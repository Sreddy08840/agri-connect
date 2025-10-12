"""Price optimization API endpoints."""
from fastapi import APIRouter, HTTPException, Body
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
import joblib

from ..db import db
from ..config import settings
from ..schemas import (
    PriceOptimizationResponse,
    PriceOptimizationRequest,
    PricePoint
)

router = APIRouter(prefix="/price-optimize", tags=["price-optimization"])


def get_price_demand_data(product_id: str) -> pd.DataFrame:
    """
    Get historical price and demand data for a product.
    
    Args:
        product_id: Product ID
        
    Returns:
        DataFrame with price and demand columns
    """
    query = """
        SELECT 
            DATE(o.createdAt) as date,
            AVG(oi.unitPrice) as price,
            SUM(oi.qty) as demand,
            COUNT(DISTINCT o.id) as num_orders
        FROM orders o
        JOIN order_items oi ON o.id = oi.orderId
        WHERE oi.productId = :product_id
            AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY DATE(o.createdAt)
        HAVING price > 0 AND demand > 0
        ORDER BY date
    """
    
    df = db.execute_query(query, {'product_id': product_id})
    return df


def train_price_demand_model(df: pd.DataFrame, degree: int = 2):
    """
    Train a polynomial regression model for price-demand relationship.
    
    Args:
        df: DataFrame with 'price' and 'demand' columns
        degree: Polynomial degree
        
    Returns:
        Tuple of (model, poly_features, scaler_info)
    """
    if len(df) < 5:
        return None, None, None
    
    X = df[['price']].values
    y = df['demand'].values
    
    # Create polynomial features
    poly = PolynomialFeatures(degree=degree)
    X_poly = poly.fit_transform(X)
    
    # Train model
    model = LinearRegression()
    model.fit(X_poly, y)
    
    return model, poly, {'mean_price': X.mean(), 'std_price': X.std()}


def predict_demand(model, poly, price: float) -> float:
    """
    Predict demand for a given price.
    
    Args:
        model: Trained model
        poly: Polynomial features transformer
        price: Price to predict demand for
        
    Returns:
        Predicted demand
    """
    X = np.array([[price]])
    X_poly = poly.transform(X)
    demand = model.predict(X_poly)[0]
    return max(0, demand)  # Ensure non-negative


def optimize_price(
    model,
    poly,
    current_price: float,
    price_range: tuple,
    num_samples: int = 50
) -> tuple:
    """
    Find optimal price that maximizes revenue.
    
    Args:
        model: Trained demand model
        poly: Polynomial features transformer
        current_price: Current product price
        price_range: (min_price, max_price) tuple
        num_samples: Number of price points to evaluate
        
    Returns:
        Tuple of (optimal_price, max_revenue, price_points)
    """
    min_price, max_price = price_range
    prices = np.linspace(min_price, max_price, num_samples)
    
    price_points = []
    max_revenue = 0
    optimal_price = current_price
    
    for price in prices:
        demand = predict_demand(model, poly, price)
        revenue = price * demand
        
        # Calculate confidence based on distance from training data
        confidence = 1.0 / (1.0 + abs(price - current_price) / current_price)
        
        price_points.append({
            'price': float(price),
            'predicted_demand': float(demand),
            'predicted_revenue': float(revenue),
            'confidence': float(confidence)
        })
        
        if revenue > max_revenue:
            max_revenue = revenue
            optimal_price = price
    
    return optimal_price, max_revenue, price_points


@router.post("/product/{product_id}", response_model=PriceOptimizationResponse)
async def optimize_product_price(
    product_id: str,
    request: PriceOptimizationRequest = Body(default=PriceOptimizationRequest())
):
    """
    Optimize price for a product to maximize revenue.
    
    Uses polynomial regression to model price-demand relationship
    and finds the price that maximizes revenue (price × demand).
    """
    try:
        # Get historical price-demand data
        df = get_price_demand_data(product_id)
        
        if df.empty or len(df) < 5:
            raise HTTPException(
                status_code=400,
                detail="Insufficient price-demand data for optimization. Need at least 5 data points."
            )
        
        # Get current price
        current_price = float(df['price'].iloc[-1])
        
        # Determine price range
        if request.price_range_min and request.price_range_max:
            min_price = request.price_range_min
            max_price = request.price_range_max
        else:
            # Use ±30% of current price as default range
            min_price = current_price * 0.7
            max_price = current_price * 1.3
        
        # Train price-demand model
        model, poly, scaler_info = train_price_demand_model(df)
        
        if model is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to train price-demand model"
            )
        
        # Optimize price
        optimal_price, max_revenue, price_points = optimize_price(
            model,
            poly,
            current_price,
            (min_price, max_price),
            request.num_samples
        )
        
        # Calculate expected revenue increase
        current_demand = predict_demand(model, poly, current_price)
        current_revenue = current_price * current_demand
        revenue_increase = ((max_revenue - current_revenue) / current_revenue) * 100
        
        # Convert price points to schema
        price_point_objects = [
            PricePoint(**pp) for pp in price_points
        ]
        
        return PriceOptimizationResponse(
            product_id=product_id,
            current_price=current_price,
            recommended_price=float(optimal_price),
            price_points=price_point_objects,
            expected_revenue_increase=float(revenue_increase)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price optimization error: {str(e)}")


@router.get("/product/{product_id}/elasticity")
async def get_price_elasticity(product_id: str):
    """
    Calculate price elasticity of demand for a product.
    
    Price elasticity = % change in demand / % change in price
    """
    try:
        df = get_price_demand_data(product_id)
        
        if df.empty or len(df) < 2:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data to calculate elasticity"
            )
        
        # Calculate elasticity using percentage changes
        df = df.sort_values('date')
        df['price_pct_change'] = df['price'].pct_change()
        df['demand_pct_change'] = df['demand'].pct_change()
        
        # Remove infinite and NaN values
        df = df.replace([np.inf, -np.inf], np.nan).dropna()
        
        if len(df) < 2:
            raise HTTPException(
                status_code=400,
                detail="Insufficient valid data for elasticity calculation"
            )
        
        # Calculate elasticity
        elasticities = df['demand_pct_change'] / df['price_pct_change']
        avg_elasticity = elasticities.mean()
        
        # Interpret elasticity
        if abs(avg_elasticity) > 1:
            interpretation = "elastic (demand is sensitive to price changes)"
        elif abs(avg_elasticity) < 1:
            interpretation = "inelastic (demand is not very sensitive to price changes)"
        else:
            interpretation = "unit elastic"
        
        return {
            "product_id": product_id,
            "price_elasticity": float(avg_elasticity),
            "interpretation": interpretation,
            "data_points": len(df),
            "recommendation": (
                "Consider increasing price" if abs(avg_elasticity) < 0.5
                else "Consider decreasing price" if abs(avg_elasticity) > 2
                else "Current pricing is reasonable"
            )
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Elasticity calculation error: {str(e)}")


@router.get("/product/{product_id}/price-history")
async def get_price_history(product_id: str, days: int = 90):
    """
    Get historical price and demand data for a product.
    """
    try:
        df = get_price_demand_data(product_id)
        
        if df.empty:
            return {
                "product_id": product_id,
                "history": [],
                "message": "No price history available"
            }
        
        # Filter by days
        if days:
            cutoff_date = pd.Timestamp.now() - pd.Timedelta(days=days)
            df = df[pd.to_datetime(df['date']) >= cutoff_date]
        
        history = [
            {
                "date": str(row['date']),
                "price": float(row['price']),
                "demand": float(row['demand']),
                "num_orders": int(row['num_orders'])
            }
            for _, row in df.iterrows()
        ]
        
        return {
            "product_id": product_id,
            "history": history,
            "avg_price": float(df['price'].mean()),
            "avg_demand": float(df['demand'].mean()),
            "price_range": {
                "min": float(df['price'].min()),
                "max": float(df['price'].max())
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price history error: {str(e)}")
