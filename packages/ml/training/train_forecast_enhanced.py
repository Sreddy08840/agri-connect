"""Enhanced forecasting training script with per-product Prophet models."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from prophet import Prophet
from statsmodels.tsa.statespace.sarimax import SARIMAX
import joblib
import json
import warnings
from datetime import datetime, timedelta

from app.db import db
from app.config import settings

warnings.filterwarnings('ignore')


def calculate_forecast_error(actual: pd.Series, predicted: pd.Series) -> dict:
    """
    Calculate forecast error metrics.
    
    Args:
        actual: Actual values
        predicted: Predicted values
        
    Returns:
        Dictionary with error metrics
    """
    errors = actual - predicted
    
    mae = np.mean(np.abs(errors))
    mape = np.mean(np.abs(errors / actual.clip(lower=1))) * 100
    rmse = np.sqrt(np.mean(errors ** 2))
    
    return {
        'mae': float(mae),
        'mape': float(mape),
        'rmse': float(rmse)
    }


def train_prophet_model(df: pd.DataFrame, product_id: str) -> tuple:
    """
    Train Prophet model for a product.
    
    Args:
        df: DataFrame with 'ds' and 'y' columns
        product_id: Product ID
        
    Returns:
        Tuple of (model, metadata)
    """
    if len(df) < settings.min_history_days:
        return None, None
    
    # Configure Prophet
    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=len(df) > 365,
        changepoint_prior_scale=0.05,
        interval_width=0.95,
        seasonality_mode='multiplicative'
    )
    
    # Train model
    try:
        model.fit(df)
    except Exception as e:
        print(f"  ✗ Failed to train Prophet for {product_id}: {e}")
        return None, None
    
    # Calculate error on training data
    forecast = model.predict(df)
    errors = calculate_forecast_error(df['y'], forecast['yhat'])
    
    # Create metadata
    metadata = {
        'product_id': product_id,
        'model_type': 'prophet',
        'training_date': datetime.now().isoformat(),
        'last_date': df['ds'].max().isoformat(),
        'training_days': len(df),
        'mean_demand': float(df['y'].mean()),
        'std_demand': float(df['y'].std()),
        'errors': errors,
        'horizon_capability': 90  # Can forecast up to 90 days
    }
    
    return model, metadata


def train_sarimax_model(df: pd.DataFrame, product_id: str) -> tuple:
    """
    Train SARIMAX model for a product (fallback).
    
    Args:
        df: DataFrame with 'ds' and 'y' columns
        product_id: Product ID
        
    Returns:
        Tuple of (model, metadata)
    """
    if len(df) < 30:
        return None, None
    
    try:
        # Fit SARIMAX model
        model = SARIMAX(
            df['y'].values,
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, 7),  # Weekly seasonality
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        
        fitted = model.fit(disp=False)
        
        # Calculate error
        predictions = fitted.fittedvalues
        errors = calculate_forecast_error(df['y'].iloc[1:], predictions[1:])
        
        # Create metadata
        metadata = {
            'product_id': product_id,
            'model_type': 'sarimax',
            'training_date': datetime.now().isoformat(),
            'last_date': df['ds'].max().isoformat(),
            'training_days': len(df),
            'mean_demand': float(df['y'].mean()),
            'std_demand': float(df['y'].std()),
            'errors': errors,
            'horizon_capability': 30
        }
        
        return fitted, metadata
        
    except Exception as e:
        print(f"  ✗ Failed to train SARIMAX for {product_id}: {e}")
        return None, None


def train_product_models(min_history_days: int = 30):
    """
    Train forecasting models for all products with sufficient history.
    
    Args:
        min_history_days: Minimum days of history required
    """
    print("\nTraining per-product forecasting models...")
    
    # Get all products
    products_df = db.get_products()
    
    if products_df.empty:
        print("No products found!")
        return
    
    print(f"Found {len(products_df)} products")
    
    models_trained = 0
    prophet_count = 0
    sarimax_count = 0
    failed_count = 0
    
    all_metadata = {}
    
    for _, product in products_df.iterrows():
        product_id = product['id']
        product_name = product['title']
        
        # Get sales time series
        df = db.get_sales_timeseries(product_id)
        
        if df.empty or len(df) < min_history_days:
            print(f"  Skipping {product_name}: insufficient data ({len(df)} days)")
            continue
        
        print(f"  Training model for {product_name} ({len(df)} days of data)")
        
        # Try Prophet first
        model, metadata = train_prophet_model(df, product_id)
        
        if model is not None:
            # Save Prophet model
            model_path = settings.model_dir / f"product_{product_id}_prophet.pkl"
            joblib.dump(model, model_path)
            
            all_metadata[product_id] = metadata
            models_trained += 1
            prophet_count += 1
            
            print(f"    ✓ Prophet model saved (MAE: {metadata['errors']['mae']:.2f})")
        else:
            # Try SARIMAX as fallback
            model, metadata = train_sarimax_model(df, product_id)
            
            if model is not None:
                model_path = settings.model_dir / f"product_{product_id}_sarimax.pkl"
                joblib.dump(model, model_path)
                
                all_metadata[product_id] = metadata
                models_trained += 1
                sarimax_count += 1
                
                print(f"    ✓ SARIMAX model saved (MAE: {metadata['errors']['mae']:.2f})")
            else:
                failed_count += 1
    
    # Save all metadata
    metadata_path = settings.model_dir / "forecast_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(all_metadata, f, indent=2)
    
    print(f"\n✓ Training complete:")
    print(f"  Prophet models: {prophet_count}")
    print(f"  SARIMAX models: {sarimax_count}")
    print(f"  Failed: {failed_count}")
    print(f"  Total models trained: {models_trained}")
    print(f"  Metadata saved to {metadata_path}")


def train_category_models():
    """Train aggregate models per category as fallback."""
    print("\nTraining category-level aggregate models...")
    
    # Get all categories
    query = "SELECT DISTINCT categoryId FROM products WHERE categoryId IS NOT NULL"
    categories = db.execute_query(query)
    
    if categories.empty:
        print("No categories found!")
        return
    
    category_metadata = {}
    models_trained = 0
    
    for _, row in categories.iterrows():
        category_id = row['categoryId']
        
        # Get category sales time series
        df = db.get_category_sales_timeseries(category_id)
        
        if df.empty or len(df) < settings.min_history_days:
            print(f"  Skipping category {category_id}: insufficient data")
            continue
        
        print(f"  Training model for category {category_id} ({len(df)} days)")
        
        # Train Prophet model
        model, metadata = train_prophet_model(df, f"category_{category_id}")
        
        if model is not None:
            # Save model
            model_path = settings.model_dir / f"category_{category_id}_prophet.pkl"
            joblib.dump(model, model_path)
            
            category_metadata[category_id] = metadata
            models_trained += 1
            
            print(f"    ✓ Category model saved (MAE: {metadata['errors']['mae']:.2f})")
    
    # Save category metadata
    if category_metadata:
        metadata_path = settings.model_dir / "category_forecast_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(category_metadata, f, indent=2)
        
        print(f"\n✓ Category models trained: {models_trained}")
        print(f"  Metadata saved to {metadata_path}")


def evaluate_models():
    """Evaluate trained models."""
    print("\nEvaluating models...")
    
    metadata_path = settings.model_dir / "forecast_metadata.json"
    
    if not metadata_path.exists():
        print("No metadata found. Train models first.")
        return
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    if not metadata:
        print("No models to evaluate")
        return
    
    # Calculate statistics
    maes = [m['errors']['mae'] for m in metadata.values()]
    mapes = [m['errors']['mape'] for m in metadata.values()]
    
    print(f"\nModel Performance:")
    print(f"  Total models: {len(metadata)}")
    print(f"  Average MAE: {np.mean(maes):.2f}")
    print(f"  Average MAPE: {np.mean(mapes):.2f}%")
    print(f"  Median MAE: {np.median(maes):.2f}")
    print(f"  Median MAPE: {np.median(mapes):.2f}%")
    
    # Show best and worst models
    sorted_by_mae = sorted(metadata.items(), key=lambda x: x[1]['errors']['mae'])
    
    print(f"\nBest 3 models (by MAE):")
    for product_id, meta in sorted_by_mae[:3]:
        print(f"  {product_id}: MAE={meta['errors']['mae']:.2f}, MAPE={meta['errors']['mape']:.2f}%")
    
    print(f"\nWorst 3 models (by MAE):")
    for product_id, meta in sorted_by_mae[-3:]:
        print(f"  {product_id}: MAE={meta['errors']['mae']:.2f}, MAPE={meta['errors']['mape']:.2f}%")


def main():
    """Main training function."""
    print("=" * 70)
    print("TRAINING DEMAND FORECASTING MODELS")
    print("=" * 70)
    
    # Train per-product models
    train_product_models(min_history_days=settings.min_history_days)
    
    # Train category-level models as fallback
    train_category_models()
    
    # Evaluate models
    evaluate_models()
    
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Start the ML service: python -m app.main")
    print("2. Test forecasting: curl -X POST http://localhost:8000/forecast/product/{product_id}")
    print("=" * 70)


if __name__ == "__main__":
    main()
