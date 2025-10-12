"""Demand forecasting API endpoints."""
from fastapi import APIRouter, HTTPException, Body
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from prophet import Prophet
from statsmodels.tsa.arima.model import ARIMA
import joblib
import warnings

from ..db import db
from ..config import settings
from ..schemas import ForecastResponse, ForecastPoint, ForecastRequest

warnings.filterwarnings('ignore')

router = APIRouter(prefix="/forecast", tags=["forecast"])


def prepare_time_series(product_id: str, days: int = 365) -> pd.DataFrame:
    """
    Prepare time series data for forecasting.
    
    Args:
        product_id: Product ID
        days: Number of historical days to fetch
        
    Returns:
        DataFrame with date and quantity columns
    """
    sales_df = db.get_product_sales_history(product_id, days)
    
    if sales_df.empty:
        return pd.DataFrame(columns=['ds', 'y'])
    
    # Convert to Prophet format
    df = pd.DataFrame({
        'ds': pd.to_datetime(sales_df['date']),
        'y': sales_df['quantity']
    })
    
    # Fill missing dates with 0
    date_range = pd.date_range(
        start=df['ds'].min(),
        end=df['ds'].max(),
        freq='D'
    )
    
    df = df.set_index('ds').reindex(date_range, fill_value=0).reset_index()
    df.columns = ['ds', 'y']
    
    return df


def forecast_with_prophet(df: pd.DataFrame, days: int) -> pd.DataFrame:
    """
    Forecast using Prophet.
    
    Args:
        df: Historical data with 'ds' and 'y' columns
        days: Number of days to forecast
        
    Returns:
        DataFrame with forecast
    """
    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True if len(df) > 365 else False,
        changepoint_prior_scale=0.05,
        interval_width=0.95
    )
    
    model.fit(df)
    
    # Create future dataframe
    future = model.make_future_dataframe(periods=days)
    forecast = model.predict(future)
    
    # Return only future predictions
    forecast = forecast.tail(days)
    
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]


def forecast_with_arima(df: pd.DataFrame, days: int) -> pd.DataFrame:
    """
    Forecast using ARIMA.
    
    Args:
        df: Historical data with 'ds' and 'y' columns
        days: Number of days to forecast
        
    Returns:
        DataFrame with forecast
    """
    # Fit ARIMA model
    model = ARIMA(df['y'].values, order=(1, 1, 1))
    fitted = model.fit()
    
    # Forecast
    forecast = fitted.forecast(steps=days)
    
    # Create result dataframe
    last_date = df['ds'].max()
    future_dates = pd.date_range(
        start=last_date + timedelta(days=1),
        periods=days,
        freq='D'
    )
    
    result = pd.DataFrame({
        'ds': future_dates,
        'yhat': forecast,
        'yhat_lower': forecast * 0.8,  # Simple confidence interval
        'yhat_upper': forecast * 1.2
    })
    
    return result


def simple_moving_average_forecast(df: pd.DataFrame, days: int, window: int = 7) -> pd.DataFrame:
    """
    Simple moving average forecast (fallback method).
    
    Args:
        df: Historical data
        days: Number of days to forecast
        window: Moving average window
        
    Returns:
        DataFrame with forecast
    """
    # Calculate moving average
    ma = df['y'].rolling(window=window).mean().iloc[-1]
    
    if pd.isna(ma):
        ma = df['y'].mean()
    
    # Create forecast
    last_date = df['ds'].max()
    future_dates = pd.date_range(
        start=last_date + timedelta(days=1),
        periods=days,
        freq='D'
    )
    
    result = pd.DataFrame({
        'ds': future_dates,
        'yhat': [ma] * days,
        'yhat_lower': [ma * 0.7] * days,
        'yhat_upper': [ma * 1.3] * days
    })
    
    return result


@router.post("/product/{product_id}", response_model=ForecastResponse)
async def forecast_product_demand(
    product_id: str,
    request: ForecastRequest = Body(default=ForecastRequest())
):
    """
    Forecast demand for a product.
    
    Uses Prophet for time series forecasting with automatic seasonality detection.
    Falls back to ARIMA or moving average if insufficient data.
    """
    try:
        days = request.days
        
        # Get historical data
        df = prepare_time_series(product_id, days=365)
        
        if df.empty or len(df) < settings.min_history_days:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient historical data. Need at least {settings.min_history_days} days."
            )
        
        # Choose forecasting method based on data availability
        method = "prophet"
        confidence = 0.8
        
        try:
            # Try Prophet first
            forecast_df = forecast_with_prophet(df, days)
        except Exception as e:
            print(f"Prophet failed: {e}")
            try:
                # Fall back to ARIMA
                forecast_df = forecast_with_arima(df, days)
                method = "arima"
                confidence = 0.6
            except Exception as e2:
                print(f"ARIMA failed: {e2}")
                # Fall back to moving average
                forecast_df = simple_moving_average_forecast(df, days)
                method = "moving_average"
                confidence = 0.4
        
        # Convert to response format
        forecast_points = [
            ForecastPoint(
                date=row['ds'].strftime('%Y-%m-%d'),
                predicted_demand=max(0, float(row['yhat'])),  # Ensure non-negative
                lower_bound=max(0, float(row['yhat_lower'])),
                upper_bound=max(0, float(row['yhat_upper']))
            )
            for _, row in forecast_df.iterrows()
        ]
        
        return ForecastResponse(
            product_id=product_id,
            forecast=forecast_points,
            method=method,
            confidence=confidence
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")


@router.get("/product/{product_id}/history")
async def get_product_history(
    product_id: str,
    days: int = 90
):
    """
    Get historical sales data for a product.
    """
    try:
        df = prepare_time_series(product_id, days)
        
        if df.empty:
            return {
                "product_id": product_id,
                "history": [],
                "message": "No historical data available"
            }
        
        history = [
            {
                "date": row['ds'].strftime('%Y-%m-%d'),
                "quantity": float(row['y'])
            }
            for _, row in df.iterrows()
        ]
        
        return {
            "product_id": product_id,
            "history": history,
            "total_days": len(history),
            "total_quantity": float(df['y'].sum()),
            "avg_daily_quantity": float(df['y'].mean())
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History error: {str(e)}")
