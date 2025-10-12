"""Enhanced price optimization training with elasticity modeling and revenue maximization."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
import xgboost as xgb
import joblib
import json
from scipy.optimize import minimize_scalar

from app.db import db
from app.config import settings


def estimate_price_elasticity(df: pd.DataFrame) -> dict:
    """
    Estimate price elasticity using log-log regression.
    
    Model: log(units) = a + b*log(price) + covariates
    Elasticity = b (% change in demand / % change in price)
    
    Args:
        df: DataFrame with price, units_sold, and features
        
    Returns:
        Dictionary with elasticity parameters and model
    """
    if len(df) < 10:
        return None
    
    # Prepare features
    df = df.copy()
    
    # Log transformation (add small constant to avoid log(0))
    df['log_price'] = np.log(df['price'] + 0.01)
    df['log_units'] = np.log(df['units_sold'] + 0.01)
    
    # Create feature matrix
    features = ['log_price']
    
    # Add covariates if available
    if 'is_weekend' in df.columns:
        features.append('is_weekend')
    if 'is_promo' in df.columns:
        features.append('is_promo')
    
    # Add season dummies
    if 'season' in df.columns:
        season_dummies = pd.get_dummies(df['season'], prefix='season')
        df = pd.concat([df, season_dummies], axis=1)
        features.extend([col for col in season_dummies.columns if col != 'season_winter'])
    
    X = df[features].values
    y = df['log_units'].values
    
    # Fit model with Ridge regression (handles multicollinearity)
    model = Ridge(alpha=1.0)
    model.fit(X, y)
    
    # Calculate R² score
    r2 = model.score(X, y)
    
    # Cross-validation score
    cv_scores = cross_val_score(model, X, y, cv=min(5, len(df)), scoring='r2')
    cv_r2 = cv_scores.mean()
    
    # Extract elasticity (coefficient of log_price)
    elasticity = model.coef_[0]
    
    # Calculate confidence interval (simplified)
    residuals = y - model.predict(X)
    std_error = np.std(residuals) / np.sqrt(len(df))
    elasticity_ci = (elasticity - 1.96 * std_error, elasticity + 1.96 * std_error)
    
    return {
        'elasticity': float(elasticity),
        'elasticity_ci': [float(elasticity_ci[0]), float(elasticity_ci[1])],
        'intercept': float(model.intercept_),
        'coefficients': {feat: float(coef) for feat, coef in zip(features, model.coef_)},
        'r2_score': float(r2),
        'cv_r2_score': float(cv_r2),
        'model': model,
        'features': features,
        'scaler': None
    }


def train_xgboost_model(df: pd.DataFrame) -> dict:
    """
    Train XGBoost model for more complex price-demand relationships.
    
    Args:
        df: DataFrame with price, units_sold, and features
        
    Returns:
        Dictionary with model and metadata
    """
    if len(df) < 20:
        return None
    
    # Prepare features
    features = ['price']
    
    if 'is_weekend' in df.columns:
        features.append('is_weekend')
    if 'is_promo' in df.columns:
        features.append('is_promo')
    if 'day_of_week' in df.columns:
        features.append('day_of_week')
    if 'month' in df.columns:
        features.append('month')
    
    X = df[features].values
    y = df['units_sold'].values
    
    # Train XGBoost
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42
    )
    
    model.fit(X, y)
    
    # Calculate R² score
    r2 = model.score(X, y)
    
    return {
        'model': model,
        'features': features,
        'r2_score': float(r2),
        'model_type': 'xgboost'
    }


def find_optimal_price(elasticity_params: dict, df: pd.DataFrame, 
                       price_range: tuple = None) -> dict:
    """
    Find price that maximizes revenue using grid search.
    
    Revenue(price) = price * demand(price)
    
    Args:
        elasticity_params: Elasticity model parameters
        df: Historical data
        price_range: (min_price, max_price) tuple
        
    Returns:
        Dictionary with optimal price and expected metrics
    """
    current_price = df['price'].iloc[-1] if not df.empty else 100
    mean_price = df['price'].mean()
    
    # Determine price range
    if price_range is None:
        min_price = mean_price * 0.7
        max_price = mean_price * 1.3
    else:
        min_price, max_price = price_range
    
    # Grid search
    prices = np.linspace(min_price, max_price, 100)
    revenues = []
    demands = []
    
    model = elasticity_params['model']
    features = elasticity_params['features']
    elasticity = elasticity_params['elasticity']
    
    # Calculate baseline demand at mean price
    baseline_features = np.zeros(len(features))
    baseline_features[0] = np.log(mean_price + 0.01)  # log_price
    baseline_log_demand = model.predict([baseline_features])[0]
    baseline_demand = np.exp(baseline_log_demand)
    
    for price in prices:
        # Predict demand using elasticity
        # demand(price) = baseline_demand * (price / mean_price) ^ elasticity
        predicted_demand = baseline_demand * (price / mean_price) ** elasticity
        predicted_demand = max(0, predicted_demand)  # Ensure non-negative
        
        revenue = price * predicted_demand
        
        revenues.append(revenue)
        demands.append(predicted_demand)
    
    # Find optimal price
    optimal_idx = np.argmax(revenues)
    optimal_price = prices[optimal_idx]
    optimal_demand = demands[optimal_idx]
    optimal_revenue = revenues[optimal_idx]
    
    # Calculate current revenue for comparison
    current_demand = baseline_demand * (current_price / mean_price) ** elasticity
    current_revenue = current_price * current_demand
    
    # Revenue uplift
    revenue_uplift = ((optimal_revenue - current_revenue) / current_revenue) * 100
    
    return {
        'optimal_price': float(optimal_price),
        'current_price': float(current_price),
        'optimal_demand': float(optimal_demand),
        'optimal_revenue': float(optimal_revenue),
        'current_revenue': float(current_revenue),
        'revenue_uplift_pct': float(revenue_uplift),
        'price_range': (float(min_price), float(max_price)),
        'all_prices': prices.tolist(),
        'all_revenues': revenues
    }


def train_price_model(product_id: str) -> dict:
    """
    Train complete price optimization model for a product.
    
    Args:
        product_id: Product ID
        
    Returns:
        Dictionary with all model components
    """
    # Get historical data
    df = db.get_historical_price_demand(product_id, days=365)
    
    if df.empty or len(df) < 10:
        return None
    
    print(f"  Training for product {product_id} ({len(df)} data points)")
    
    # Estimate elasticity
    elasticity_params = estimate_price_elasticity(df)
    
    if elasticity_params is None:
        return None
    
    # Train XGBoost model (optional, for comparison)
    xgb_params = train_xgboost_model(df)
    
    # Find optimal price
    optimization_result = find_optimal_price(elasticity_params, df)
    
    # Combine results
    result = {
        'product_id': product_id,
        'elasticity': elasticity_params['elasticity'],
        'elasticity_ci': elasticity_params['elasticity_ci'],
        'r2_score': elasticity_params['r2_score'],
        'cv_r2_score': elasticity_params['cv_r2_score'],
        'optimal_price': optimization_result['optimal_price'],
        'current_price': optimization_result['current_price'],
        'revenue_uplift_pct': optimization_result['revenue_uplift_pct'],
        'data_points': len(df),
        'price_range': optimization_result['price_range'],
        'model_type': 'log-log elasticity',
        'features': elasticity_params['features']
    }
    
    # Save models
    model_data = {
        'elasticity_params': elasticity_params,
        'xgb_params': xgb_params,
        'optimization_result': optimization_result,
        'metadata': result
    }
    
    return model_data


def train_all_products():
    """Train price optimization models for all products."""
    print("\nTraining price optimization models...")
    
    # Get products with sufficient price history
    products_df = db.get_products()
    
    if products_df.empty:
        print("No products found!")
        return
    
    print(f"Found {len(products_df)} products")
    
    models_trained = 0
    all_metadata = {}
    
    for _, product in products_df.iterrows():
        product_id = product['id']
        
        try:
            model_data = train_price_model(product_id)
            
            if model_data is not None:
                # Save model
                model_path = settings.model_dir / f"price_{product_id}.pkl"
                joblib.dump(model_data, model_path)
                
                # Store metadata
                all_metadata[product_id] = model_data['metadata']
                
                models_trained += 1
                
                elasticity = model_data['metadata']['elasticity']
                uplift = model_data['metadata']['revenue_uplift_pct']
                
                print(f"    ✓ Model saved (elasticity: {elasticity:.3f}, uplift: {uplift:.1f}%)")
            
        except Exception as e:
            print(f"    ✗ Failed: {e}")
    
    # Save metadata
    if all_metadata:
        metadata_path = settings.model_dir / "price_optimization_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(all_metadata, f, indent=2)
        
        print(f"\n✓ Models trained: {models_trained}")
        print(f"  Metadata saved to {metadata_path}")
        
        # Print statistics
        elasticities = [m['elasticity'] for m in all_metadata.values()]
        uplifts = [m['revenue_uplift_pct'] for m in all_metadata.values()]
        
        print(f"\nElasticity Statistics:")
        print(f"  Mean: {np.mean(elasticities):.3f}")
        print(f"  Median: {np.median(elasticities):.3f}")
        print(f"  Range: [{np.min(elasticities):.3f}, {np.max(elasticities):.3f}]")
        
        print(f"\nRevenue Uplift Statistics:")
        print(f"  Mean: {np.mean(uplifts):.1f}%")
        print(f"  Median: {np.median(uplifts):.1f}%")
        print(f"  Range: [{np.min(uplifts):.1f}%, {np.max(uplifts):.1f}%]")


def interpret_elasticity(elasticity: float) -> str:
    """
    Interpret price elasticity value.
    
    Args:
        elasticity: Price elasticity coefficient
        
    Returns:
        Interpretation string
    """
    if elasticity > -0.5:
        return "Inelastic (demand not very sensitive to price)"
    elif elasticity > -1.0:
        return "Moderately elastic"
    elif elasticity > -2.0:
        return "Elastic (demand sensitive to price)"
    else:
        return "Highly elastic (demand very sensitive to price)"


def main():
    """Main training function."""
    print("=" * 70)
    print("TRAINING PRICE OPTIMIZATION MODELS")
    print("=" * 70)
    print("\nUsing log-log elasticity regression:")
    print("  log(demand) = a + b*log(price) + covariates")
    print("  Elasticity = b")
    print("  Revenue = price * demand(price)")
    print("=" * 70)
    
    train_all_products()
    
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Start ML service: python -m app.main")
    print("2. Test optimization: curl -X POST http://localhost:8000/price-optimize/product/{id}")
    print("\n⚠️  IMPORTANT: Dynamic pricing must respect:")
    print("   - Farmer minimum price preferences")
    print("   - Legal price discrimination limits")
    print("   - Ethical considerations")
    print("   - Market fairness")
    print("=" * 70)


if __name__ == "__main__":
    main()
