"""Training script for price optimization models."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
import joblib

from app.db import db
from app.config import settings


def train_price_models():
    """Train price optimization models for products with price history."""
    print("Training price optimization models...")
    
    # Get products
    products_df = db.get_products()
    
    if products_df.empty:
        print("No products found.")
        return
    
    print(f"Found {len(products_df)} products")
    
    models_trained = 0
    
    for _, product in products_df.iterrows():
        product_id = product['id']
        product_name = product['title']
        
        # Get price-demand history
        query = """
            SELECT 
                DATE(o.createdAt) as date,
                AVG(oi.unitPrice) as price,
                SUM(oi.qty) as demand
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
            WHERE oi.productId = :product_id
                AND o.status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY DATE(o.createdAt)
            HAVING price > 0 AND demand > 0
        """
        
        df = db.execute_query(query, {'product_id': product_id})
        
        if df.empty or len(df) < 10:
            continue
        
        print(f"  Training model for {product_name} ({len(df)} data points)")
        
        try:
            X = df[['price']].values
            y = df['demand'].values
            
            # Create polynomial features
            poly = PolynomialFeatures(degree=2)
            X_poly = poly.fit_transform(X)
            
            # Train model
            model = LinearRegression()
            model.fit(X_poly, y)
            
            # Calculate R² score
            r2 = model.score(X_poly, y)
            
            # Save model
            model_path = settings.model_dir / f"price_{product_id}.pkl"
            joblib.dump({
                'model': model,
                'poly': poly,
                'r2_score': r2,
                'mean_price': X.mean(),
                'std_price': X.std()
            }, model_path)
            
            models_trained += 1
            print(f"    ✓ Model saved (R² = {r2:.3f})")
        
        except Exception as e:
            print(f"    ✗ Failed to train model: {e}")
    
    print(f"\n✓ Trained {models_trained} price optimization models")


if __name__ == "__main__":
    print("=" * 60)
    print("Training Price Optimization Models")
    print("=" * 60)
    
    train_price_models()
    
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
