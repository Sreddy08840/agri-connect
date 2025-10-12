"""Training script for forecasting models."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from prophet import Prophet
import joblib
import warnings

from app.db import db
from app.config import settings

warnings.filterwarnings('ignore')


def train_forecast_models():
    """Train forecasting models for top products."""
    print("Training forecasting models...")
    
    # Get products with sufficient sales history
    products_df = db.get_products()
    
    if products_df.empty:
        print("No products found.")
        return
    
    print(f"Found {len(products_df)} products")
    
    # Train models for top products (by rating or sales)
    top_products = products_df.nlargest(10, 'ratingCount')
    
    models_trained = 0
    
    for _, product in top_products.iterrows():
        product_id = product['id']
        product_name = product['title']
        
        # Get sales history
        sales_df = db.get_product_sales_history(product_id, days=365)
        
        if sales_df.empty or len(sales_df) < settings.min_history_days:
            print(f"  Skipping {product_name}: insufficient data ({len(sales_df)} days)")
            continue
        
        print(f"  Training model for {product_name} ({len(sales_df)} days of data)")
        
        # Prepare data for Prophet
        df = pd.DataFrame({
            'ds': pd.to_datetime(sales_df['date']),
            'y': sales_df['quantity']
        })
        
        # Fill missing dates
        date_range = pd.date_range(
            start=df['ds'].min(),
            end=df['ds'].max(),
            freq='D'
        )
        df = df.set_index('ds').reindex(date_range, fill_value=0).reset_index()
        df.columns = ['ds', 'y']
        
        try:
            # Train Prophet model
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=len(df) > 365,
                changepoint_prior_scale=0.05
            )
            
            model.fit(df)
            
            # Save model
            model_path = settings.model_dir / f"forecast_{product_id}.pkl"
            joblib.dump(model, model_path)
            
            models_trained += 1
            print(f"    ✓ Model saved to {model_path}")
        
        except Exception as e:
            print(f"    ✗ Failed to train model: {e}")
    
    print(f"\n✓ Trained {models_trained} forecasting models")


if __name__ == "__main__":
    print("=" * 60)
    print("Training Forecasting Models")
    print("=" * 60)
    
    train_forecast_models()
    
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
