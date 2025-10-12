"""Training script for fraud detection models."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import joblib

from app.db import db
from app.config import settings


def engineer_transaction_features(df: pd.DataFrame) -> pd.DataFrame:
    """Engineer features from transaction data."""
    features = pd.DataFrame()
    
    features['amount'] = df['amount']
    features['num_items'] = df['num_items']
    features['avg_item_price'] = df['avg_item_price']
    features['max_item_price'] = df['max_item_price']
    features['amount_per_item'] = df['amount'] / df['num_items'].clip(lower=1)
    
    # Payment method encoding
    payment_dummies = pd.get_dummies(df['payment_method'], prefix='payment')
    features = pd.concat([features, payment_dummies], axis=1)
    
    # Time features
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    features['hour_of_day'] = df['timestamp'].dt.hour
    features['day_of_week'] = df['timestamp'].dt.dayofweek
    features['is_night'] = ((features['hour_of_day'] < 6) | (features['hour_of_day'] > 22)).astype(int)
    features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
    
    # Price variance
    features['price_variance'] = (
        (features['max_item_price'] - features['avg_item_price']) / 
        features['avg_item_price'].clip(lower=1)
    )
    
    return features


def create_fraud_labels(df: pd.DataFrame) -> np.ndarray:
    """
    Create fraud labels based on heuristics.
    
    In production, you would use actual fraud labels from your database.
    This is a synthetic labeling approach for training.
    """
    labels = np.zeros(len(df))
    
    # High amount transactions
    labels[(df['amount'] > df['amount'].quantile(0.95))] = 1
    
    # Unusual patterns
    labels[(df['num_items'] > 50) & (df['avg_item_price'] < 50)] = 1
    
    # Night transactions with high amounts
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    hour = df['timestamp'].dt.hour
    labels[((hour < 6) | (hour > 22)) & (df['amount'] > 5000)] = 1
    
    # Status-based (cancelled/refunded might indicate fraud attempts)
    labels[df['status'].isin(['CANCELLED', 'REFUNDED'])] = 1
    
    return labels


def train_isolation_forest():
    """Train Isolation Forest for anomaly detection."""
    print("Training Isolation Forest model...")
    
    # Get transaction data
    df = db.get_transaction_features(limit=10000)
    
    if df.empty or len(df) < 100:
        print("Insufficient transaction data.")
        return
    
    print(f"Found {len(df)} transactions")
    
    # Engineer features
    features = engineer_transaction_features(df)
    
    # Handle missing columns
    expected_cols = [
        'amount', 'num_items', 'avg_item_price', 'max_item_price',
        'amount_per_item', 'hour_of_day', 'day_of_week', 'is_night',
        'is_weekend', 'price_variance'
    ]
    
    for col in expected_cols:
        if col not in features.columns:
            features[col] = 0
    
    # Scale features
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    
    # Train Isolation Forest
    model = IsolationForest(
        contamination=0.1,  # Assume 10% anomalies
        random_state=42,
        n_estimators=100
    )
    
    model.fit(features_scaled)
    
    # Save model
    model_path = settings.model_dir / "fraud_isolation_forest.pkl"
    scaler_path = settings.model_dir / "fraud_scaler.pkl"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"✓ Isolation Forest model saved to {model_path}")
    print(f"✓ Scaler saved to {scaler_path}")


def train_xgboost_classifier():
    """Train XGBoost classifier for fraud detection."""
    print("\nTraining XGBoost classifier...")
    
    # Get transaction data
    df = db.get_transaction_features(limit=10000)
    
    if df.empty or len(df) < 100:
        print("Insufficient transaction data.")
        return
    
    # Engineer features
    features = engineer_transaction_features(df)
    
    # Create synthetic labels
    labels = create_fraud_labels(df)
    
    print(f"Training data: {len(features)} samples, {labels.sum()} fraud cases ({labels.mean()*100:.1f}%)")
    
    if labels.sum() < 10:
        print("Too few fraud cases for training. Skipping XGBoost.")
        return
    
    # Handle missing columns
    expected_cols = [
        'amount', 'num_items', 'avg_item_price', 'max_item_price',
        'amount_per_item', 'hour_of_day', 'day_of_week', 'is_night',
        'is_weekend', 'price_variance'
    ]
    
    for col in expected_cols:
        if col not in features.columns:
            features[col] = 0
    
    # Train XGBoost
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        scale_pos_weight=len(labels) / labels.sum() if labels.sum() > 0 else 1,
        random_state=42
    )
    
    model.fit(features, labels)
    
    # Save model
    model_path = settings.model_dir / "fraud_xgboost.pkl"
    joblib.dump(model, model_path)
    
    print(f"✓ XGBoost model saved to {model_path}")
    
    # Feature importance
    importance = model.feature_importances_
    feature_names = features.columns
    
    print("\nTop 5 important features:")
    for idx in importance.argsort()[-5:][::-1]:
        print(f"  {feature_names[idx]}: {importance[idx]:.3f}")


if __name__ == "__main__":
    print("=" * 60)
    print("Training Fraud Detection Models")
    print("=" * 60)
    
    train_isolation_forest()
    train_xgboost_classifier()
    
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
