"""Fraud detection API endpoints."""
from fastapi import APIRouter, HTTPException, Body
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import joblib
from datetime import datetime

from ..db import db
from ..config import settings
from ..schemas import TransactionFeatures, FraudScoreResponse

router = APIRouter(prefix="/fraud", tags=["fraud-detection"])

# Global models
_isolation_forest = None
_xgb_model = None
_scaler = None


def load_fraud_models():
    """Load fraud detection models."""
    global _isolation_forest, _xgb_model, _scaler
    
    iso_path = settings.model_dir / "fraud_isolation_forest.pkl"
    xgb_path = settings.model_dir / "fraud_xgboost.pkl"
    scaler_path = settings.model_dir / "fraud_scaler.pkl"
    
    try:
        if iso_path.exists():
            _isolation_forest = joblib.load(iso_path)
        if xgb_path.exists():
            _xgb_model = joblib.load(xgb_path)
        if scaler_path.exists():
            _scaler = joblib.load(scaler_path)
    except Exception as e:
        print(f"Failed to load fraud models: {e}")


def engineer_features(transaction: TransactionFeatures) -> pd.DataFrame:
    """
    Engineer features for fraud detection.
    
    Args:
        transaction: Transaction features
        
    Returns:
        DataFrame with engineered features
    """
    features = {
        'amount': transaction.amount,
        'num_items': transaction.num_items,
        'avg_item_price': transaction.avg_item_price,
        'max_item_price': transaction.max_item_price,
        'amount_per_item': transaction.amount / max(transaction.num_items, 1),
    }
    
    # Payment method encoding
    payment_methods = ['CASH', 'CARD', 'UPI', 'WALLET']
    for method in payment_methods:
        features[f'payment_{method.lower()}'] = 1 if transaction.payment_method == method else 0
    
    # Time features
    if transaction.hour_of_day is not None:
        features['hour_of_day'] = transaction.hour_of_day
        features['is_night'] = 1 if transaction.hour_of_day < 6 or transaction.hour_of_day > 22 else 0
    else:
        features['hour_of_day'] = 12  # Default
        features['is_night'] = 0
    
    if transaction.day_of_week is not None:
        features['day_of_week'] = transaction.day_of_week
        features['is_weekend'] = 1 if transaction.day_of_week >= 5 else 0
    else:
        features['day_of_week'] = 3  # Default
        features['is_weekend'] = 0
    
    # User history features
    if transaction.user_history_days is not None:
        features['user_history_days'] = transaction.user_history_days
        features['is_new_user'] = 1 if transaction.user_history_days < 7 else 0
    else:
        features['user_history_days'] = 30  # Default
        features['is_new_user'] = 0
    
    if transaction.user_total_orders is not None:
        features['user_total_orders'] = transaction.user_total_orders
    else:
        features['user_total_orders'] = 1
    
    # Derived features
    features['amount_z_score'] = 0  # Will be calculated with scaler
    features['price_variance'] = (
        transaction.max_item_price - transaction.avg_item_price
    ) / max(transaction.avg_item_price, 1)
    
    return pd.DataFrame([features])


def get_user_statistics(user_id: str) -> dict:
    """
    Get user statistics for fraud detection.
    
    Args:
        user_id: User ID
        
    Returns:
        Dictionary with user statistics
    """
    query = """
        SELECT 
            COUNT(*) as total_orders,
            AVG(total) as avg_order_amount,
            MAX(total) as max_order_amount,
            MIN(createdAt) as first_order_date
        FROM orders
        WHERE customerId = :user_id
    """
    
    result = db.execute_query(query, {'user_id': user_id})
    
    if result.empty:
        return {
            'total_orders': 0,
            'avg_order_amount': 0,
            'max_order_amount': 0,
            'user_history_days': 0
        }
    
    row = result.iloc[0]
    
    # Calculate user history days
    if pd.notna(row['first_order_date']):
        first_order = pd.to_datetime(row['first_order_date'])
        history_days = (datetime.now() - first_order).days
    else:
        history_days = 0
    
    return {
        'total_orders': int(row['total_orders']),
        'avg_order_amount': float(row['avg_order_amount']) if pd.notna(row['avg_order_amount']) else 0,
        'max_order_amount': float(row['max_order_amount']) if pd.notna(row['max_order_amount']) else 0,
        'user_history_days': history_days
    }


def calculate_risk_score(features_df: pd.DataFrame, transaction: TransactionFeatures) -> tuple:
    """
    Calculate fraud risk score.
    
    Args:
        features_df: Engineered features
        transaction: Original transaction
        
    Returns:
        Tuple of (risk_score, risk_factors)
    """
    risk_factors = []
    risk_score = 0.0
    
    # Rule-based scoring
    amount = transaction.amount
    
    # High amount transactions
    if amount > 10000:
        risk_score += 0.3
        risk_factors.append("High transaction amount")
    elif amount > 5000:
        risk_score += 0.15
        risk_factors.append("Above average transaction amount")
    
    # Unusual item prices
    if transaction.max_item_price > transaction.avg_item_price * 3:
        risk_score += 0.2
        risk_factors.append("Unusual item price variance")
    
    # New user with high amount
    if transaction.user_history_days and transaction.user_history_days < 7 and amount > 2000:
        risk_score += 0.25
        risk_factors.append("New user with high transaction")
    
    # Night time transactions
    if transaction.hour_of_day and (transaction.hour_of_day < 6 or transaction.hour_of_day > 22):
        risk_score += 0.1
        risk_factors.append("Transaction during unusual hours")
    
    # Many items with low average price (potential bulk fraud)
    if transaction.num_items > 20 and transaction.avg_item_price < 100:
        risk_score += 0.15
        risk_factors.append("High quantity of low-value items")
    
    # Use ML models if available
    if _isolation_forest is not None:
        try:
            # Isolation Forest (anomaly detection)
            iso_score = _isolation_forest.decision_function(features_df)[0]
            # Convert to 0-1 scale (more negative = more anomalous)
            iso_risk = max(0, min(1, (1 - iso_score) / 2))
            risk_score = (risk_score + iso_risk) / 2
            
            if iso_risk > 0.6:
                risk_factors.append("Anomalous transaction pattern detected")
        except Exception as e:
            print(f"Isolation Forest error: {e}")
    
    if _xgb_model is not None:
        try:
            # XGBoost classifier
            xgb_proba = _xgb_model.predict_proba(features_df)[0][1]
            risk_score = (risk_score + xgb_proba) / 2
            
            if xgb_proba > 0.7:
                risk_factors.append("ML model indicates high fraud probability")
        except Exception as e:
            print(f"XGBoost error: {e}")
    
    # Ensure score is in [0, 1]
    risk_score = max(0.0, min(1.0, risk_score))
    
    return risk_score, risk_factors


@router.post("/score", response_model=FraudScoreResponse)
async def score_transaction(transaction: TransactionFeatures = Body(...)):
    """
    Calculate fraud risk score for a transaction.
    
    Returns a risk score from 0 (safe) to 1 (fraudulent) along with
    contributing risk factors and a recommendation.
    """
    try:
        # Get user statistics if not provided
        if transaction.user_history_days is None or transaction.user_total_orders is None:
            user_stats = get_user_statistics(transaction.user_id)
            
            if transaction.user_history_days is None:
                transaction.user_history_days = user_stats['user_history_days']
            if transaction.user_total_orders is None:
                transaction.user_total_orders = user_stats['total_orders']
        
        # Add time features if not provided
        if transaction.hour_of_day is None:
            now = datetime.now()
            transaction.hour_of_day = now.hour
            transaction.day_of_week = now.weekday()
        
        # Engineer features
        features_df = engineer_features(transaction)
        
        # Scale features if scaler is available
        if _scaler is not None:
            try:
                features_df = pd.DataFrame(
                    _scaler.transform(features_df),
                    columns=features_df.columns
                )
            except Exception as e:
                print(f"Scaling error: {e}")
        
        # Calculate risk score
        risk_score, risk_factors = calculate_risk_score(features_df, transaction)
        
        # Determine risk level
        if risk_score < 0.3:
            risk_level = "low"
            recommendation = "Approve transaction"
        elif risk_score < 0.7:
            risk_level = "medium"
            recommendation = "Review transaction manually"
        else:
            risk_level = "high"
            recommendation = "Block transaction and verify with user"
        
        if not risk_factors:
            risk_factors = ["No specific risk factors detected"]
        
        return FraudScoreResponse(
            risk_score=risk_score,
            risk_level=risk_level,
            factors=risk_factors,
            recommendation=recommendation
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud detection error: {str(e)}")


@router.get("/user/{user_id}/risk-profile")
async def get_user_risk_profile(user_id: str):
    """
    Get risk profile for a user based on their transaction history.
    """
    try:
        user_stats = get_user_statistics(user_id)
        
        # Calculate risk indicators
        is_new_user = user_stats['user_history_days'] < 30
        has_few_orders = user_stats['total_orders'] < 5
        
        risk_indicators = []
        base_risk = 0.0
        
        if is_new_user:
            risk_indicators.append("New user (< 30 days)")
            base_risk += 0.2
        
        if has_few_orders:
            risk_indicators.append("Limited order history")
            base_risk += 0.15
        
        if user_stats['max_order_amount'] > user_stats['avg_order_amount'] * 3:
            risk_indicators.append("High variance in order amounts")
            base_risk += 0.1
        
        if not risk_indicators:
            risk_indicators = ["Established user with normal patterns"]
        
        return {
            "user_id": user_id,
            "base_risk_score": min(1.0, base_risk),
            "risk_indicators": risk_indicators,
            "statistics": user_stats,
            "recommendation": (
                "Monitor closely" if base_risk > 0.3
                else "Standard monitoring"
            )
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk profile error: {str(e)}")


# Initialize models on module load
load_fraud_models()
