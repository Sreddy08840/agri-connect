"""Enhanced fraud detection training with IsolationForest and XGBoost."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import roc_auc_score, classification_report, confusion_matrix
import xgboost as xgb
import joblib
import json
from datetime import datetime, timedelta

from app.db import db
from app.config import settings


def engineer_features(transactions_df: pd.DataFrame, user_profiles_df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features for fraud detection.
    
    Features:
    - Transaction amount
    - Amount relative to user's average
    - Time-of-day features
    - Velocity features (transactions per hour/day)
    - Frequency anomalies
    - User behavior patterns
    
    Args:
        transactions_df: Transaction data
        user_profiles_df: User profile data
        
    Returns:
        DataFrame with engineered features
    """
    print("Engineering features...")
    
    df = transactions_df.copy()
    
    # Merge with user profiles
    df = df.merge(user_profiles_df, on='user_id', how='left')
    
    # Basic amount features
    df['amount'] = df['amount'].fillna(0)
    df['log_amount'] = np.log1p(df['amount'])
    
    # Amount relative to user average
    df['amount_vs_user_avg'] = df['amount'] / (df['avg_order_amount'] + 1)
    df['amount_vs_user_max'] = df['amount'] / (df['max_order_amount'] + 1)
    
    # Z-score of amount relative to user history
    df['amount_zscore'] = (df['amount'] - df['avg_order_amount']) / (df['stddev_order_amount'] + 1)
    
    # Time-based features
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 6)).astype(int)
    df['is_business_hours'] = ((df['hour'] >= 9) & (df['hour'] <= 17)).astype(int)
    
    # User account features
    df['account_age_days'] = df['account_age_days'].fillna(0)
    df['is_new_account'] = (df['account_age_days'] < 30).astype(int)
    df['is_very_new_account'] = (df['account_age_days'] < 7).astype(int)
    
    # User behavior features
    df['total_orders'] = df['total_orders'].fillna(0)
    df['orders_per_day'] = df['total_orders'] / (df['account_age_days'] + 1)
    df['avg_order_amount'] = df['avg_order_amount'].fillna(0)
    df['total_spent'] = df['total_spent'].fillna(0)
    
    # Transaction composition features
    df['num_items'] = df['num_items'].fillna(0)
    df['total_quantity'] = df['total_quantity'].fillna(0)
    df['avg_item_price'] = df['avg_item_price'].fillna(0)
    df['items_per_dollar'] = df['num_items'] / (df['amount'] + 1)
    df['quantity_per_item'] = df['total_quantity'] / (df['num_items'] + 1)
    
    # Price range features
    df['price_range'] = df['max_item_price'] - df['min_item_price']
    df['price_range_ratio'] = df['price_range'] / (df['avg_item_price'] + 1)
    
    # Velocity features (transactions in last hour/day)
    # Sort by timestamp for rolling calculations
    df = df.sort_values('timestamp')
    
    # Calculate transactions per user in last hour
    df['hour_window'] = df['timestamp'].dt.floor('H')
    hourly_counts = df.groupby(['user_id', 'hour_window']).size().reset_index(name='txns_last_hour')
    df = df.merge(hourly_counts, on=['user_id', 'hour_window'], how='left')
    df['txns_last_hour'] = df['txns_last_hour'].fillna(1)
    
    # Calculate transactions per user in last day
    df['day_window'] = df['timestamp'].dt.floor('D')
    daily_counts = df.groupby(['user_id', 'day_window']).size().reset_index(name='txns_last_day')
    df = df.merge(daily_counts, on=['user_id', 'day_window'], how='left')
    df['txns_last_day'] = df['txns_last_day'].fillna(1)
    
    # Velocity anomaly flags
    df['high_velocity_hour'] = (df['txns_last_hour'] > 5).astype(int)
    df['high_velocity_day'] = (df['txns_last_day'] > 20).astype(int)
    
    # Payment method encoding
    if 'payment_method' in df.columns:
        payment_encoder = LabelEncoder()
        df['payment_method_encoded'] = payment_encoder.fit_transform(df['payment_method'].fillna('UNKNOWN'))
    else:
        df['payment_method_encoded'] = 0
    
    # First-time buyer flag
    df['is_first_order'] = (df['total_orders'] == 1).astype(int)
    
    # Large order flags
    df['is_large_order'] = (df['amount'] > df['avg_order_amount'] * 3).astype(int)
    df['is_very_large_order'] = (df['amount'] > df['avg_order_amount'] * 5).astype(int)
    
    print(f"  ✓ Engineered {len(df.columns)} features")
    
    return df


def select_features(df: pd.DataFrame) -> list:
    """
    Select features for modeling.
    
    Args:
        df: DataFrame with engineered features
        
    Returns:
        List of feature names
    """
    feature_cols = [
        # Amount features
        'amount', 'log_amount', 'amount_vs_user_avg', 'amount_vs_user_max', 'amount_zscore',
        
        # Time features
        'hour', 'day_of_week', 'is_weekend', 'is_night', 'is_business_hours',
        
        # Account features
        'account_age_days', 'is_new_account', 'is_very_new_account',
        
        # User behavior
        'total_orders', 'orders_per_day', 'avg_order_amount', 'total_spent',
        
        # Transaction composition
        'num_items', 'total_quantity', 'avg_item_price', 'items_per_dollar',
        'quantity_per_item', 'price_range', 'price_range_ratio',
        
        # Velocity
        'txns_last_hour', 'txns_last_day', 'high_velocity_hour', 'high_velocity_day',
        
        # Flags
        'payment_method_encoded', 'is_first_order', 'is_large_order', 'is_very_large_order'
    ]
    
    # Filter to only include columns that exist
    available_features = [col for col in feature_cols if col in df.columns]
    
    return available_features


def train_isolation_forest(X: pd.DataFrame) -> tuple:
    """
    Train IsolationForest for anomaly detection.
    
    Args:
        X: Feature matrix
        
    Returns:
        Tuple of (model, scaler, feature_names)
    """
    print("\nTraining IsolationForest...")
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train IsolationForest
    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,  # Assume 10% fraud rate
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_scaled)
    
    # Get anomaly scores
    scores = model.score_samples(X_scaled)
    predictions = model.predict(X_scaled)
    
    # Calculate statistics
    anomaly_count = (predictions == -1).sum()
    anomaly_pct = (anomaly_count / len(predictions)) * 100
    
    print(f"  ✓ Model trained")
    print(f"  Detected anomalies: {anomaly_count} ({anomaly_pct:.2f}%)")
    print(f"  Score range: [{scores.min():.4f}, {scores.max():.4f}]")
    
    return model, scaler, X.columns.tolist()


def train_xgboost_classifier(X: pd.DataFrame, y: pd.Series) -> tuple:
    """
    Train XGBoost classifier for supervised fraud detection.
    
    Args:
        X: Feature matrix
        y: Labels (0=legitimate, 1=fraud)
        
    Returns:
        Tuple of (model, scaler, feature_importance, metrics)
    """
    print("\nTraining XGBoost classifier...")
    
    # Check class balance
    fraud_count = y.sum()
    fraud_pct = (fraud_count / len(y)) * 100
    print(f"  Fraud cases: {fraud_count} ({fraud_pct:.2f}%)")
    
    if fraud_count < 10:
        print("  ⚠️  Warning: Very few fraud cases. Model may not be reliable.")
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Calculate scale_pos_weight for imbalanced data
    scale_pos_weight = (len(y) - fraud_count) / fraud_count
    
    # Train XGBoost
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric='auc'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Calculate metrics
    auc = roc_auc_score(y_test, y_pred_proba)
    
    print(f"  ✓ Model trained")
    print(f"  AUC-ROC: {auc:.4f}")
    print("\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Fraud']))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n  Top 10 Important Features:")
    for _, row in feature_importance.head(10).iterrows():
        print(f"    {row['feature']}: {row['importance']:.4f}")
    
    # Cross-validation
    print("\n  Cross-validation (5-fold):")
    cv_scores = cross_val_score(model, X_scaled, y, cv=5, scoring='roc_auc')
    print(f"    CV AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    metrics = {
        'auc': float(auc),
        'cv_auc_mean': float(cv_scores.mean()),
        'cv_auc_std': float(cv_scores.std()),
        'fraud_count': int(fraud_count),
        'fraud_pct': float(fraud_pct)
    }
    
    return model, scaler, feature_importance, metrics


def save_models(isolation_model, isolation_scaler, isolation_features,
                xgb_model=None, xgb_scaler=None, xgb_features=None, 
                xgb_feature_importance=None, xgb_metrics=None):
    """
    Save trained models and metadata.
    
    Args:
        isolation_model: IsolationForest model
        isolation_scaler: Scaler for IsolationForest
        isolation_features: Feature names for IsolationForest
        xgb_model: XGBoost model (optional)
        xgb_scaler: Scaler for XGBoost (optional)
        xgb_features: Feature names for XGBoost (optional)
        xgb_feature_importance: Feature importance DataFrame (optional)
        xgb_metrics: Metrics dictionary (optional)
    """
    print("\nSaving models...")
    
    # Save IsolationForest
    isolation_path = settings.model_dir / "fraud_isolation_forest.pkl"
    joblib.dump({
        'model': isolation_model,
        'scaler': isolation_scaler,
        'features': isolation_features,
        'model_type': 'isolation_forest',
        'trained_at': datetime.now().isoformat()
    }, isolation_path)
    print(f"  ✓ IsolationForest saved to {isolation_path}")
    
    # Save XGBoost if available
    if xgb_model is not None:
        xgb_path = settings.model_dir / "fraud_xgboost.pkl"
        joblib.dump({
            'model': xgb_model,
            'scaler': xgb_scaler,
            'features': xgb_features,
            'model_type': 'xgboost',
            'trained_at': datetime.now().isoformat(),
            'metrics': xgb_metrics
        }, xgb_path)
        print(f"  ✓ XGBoost saved to {xgb_path}")
        
        # Save feature importance
        if xgb_feature_importance is not None:
            importance_path = settings.model_dir / "fraud_feature_importance.csv"
            xgb_feature_importance.to_csv(importance_path, index=False)
            print(f"  ✓ Feature importance saved to {importance_path}")
    
    # Save metadata
    metadata = {
        'trained_at': datetime.now().isoformat(),
        'isolation_forest': {
            'features': isolation_features,
            'n_features': len(isolation_features)
        }
    }
    
    if xgb_metrics:
        metadata['xgboost'] = {
            'features': xgb_features,
            'n_features': len(xgb_features),
            'metrics': xgb_metrics
        }
    
    metadata_path = settings.model_dir / "fraud_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  ✓ Metadata saved to {metadata_path}")


def main():
    """Main training function."""
    print("=" * 70)
    print("TRAINING FRAUD DETECTION MODELS")
    print("=" * 70)
    
    # Load data
    print("\nLoading data...")
    transactions_df = db.get_transactions(limit=10000)
    user_profiles_df = db.get_user_profiles()
    
    if transactions_df.empty:
        print("No transactions found!")
        return
    
    print(f"  Loaded {len(transactions_df)} transactions")
    print(f"  Loaded {len(user_profiles_df)} user profiles")
    
    # Engineer features
    features_df = engineer_features(transactions_df, user_profiles_df)
    
    # Select features
    feature_cols = select_features(features_df)
    print(f"\n  Selected {len(feature_cols)} features for modeling")
    
    X = features_df[feature_cols].fillna(0)
    
    # Train IsolationForest (unsupervised)
    isolation_model, isolation_scaler, isolation_features = train_isolation_forest(X)
    
    # Check if labeled fraud data exists
    has_labels = 'is_fraud' in features_df.columns or 'fraud_label' in features_df.columns
    
    xgb_model = None
    xgb_scaler = None
    xgb_features = None
    xgb_feature_importance = None
    xgb_metrics = None
    
    if has_labels:
        print("\n✓ Labeled fraud data found. Training supervised model...")
        
        # Get labels
        y = features_df.get('is_fraud', features_df.get('fraud_label', pd.Series([0] * len(features_df))))
        
        if y.sum() >= 10:  # Need at least 10 fraud cases
            xgb_model, xgb_scaler, xgb_feature_importance, xgb_metrics = train_xgboost_classifier(X, y)
            xgb_features = feature_cols
        else:
            print("  ⚠️  Insufficient fraud cases for supervised learning (need at least 10)")
    else:
        print("\n⚠️  No labeled fraud data found. Using IsolationForest only.")
        print("   To train supervised model, add 'is_fraud' column to transactions.")
    
    # Save models
    save_models(
        isolation_model, isolation_scaler, isolation_features,
        xgb_model, xgb_scaler, xgb_features,
        xgb_feature_importance, xgb_metrics
    )
    
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Start ML service: python -m app.main")
    print("2. Test fraud detection: curl -X POST http://localhost:8000/fraud/score")
    print("3. Monitor model performance and retrain monthly")
    print("4. Review threshold selection in FRAUD_DETECTION_GUIDE.md")
    print("=" * 70)


if __name__ == "__main__":
    main()
