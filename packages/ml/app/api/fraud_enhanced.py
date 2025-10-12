"""Enhanced fraud detection API with risk scoring and monitoring."""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta

from ..db import db
from ..config import settings

router = APIRouter(prefix="/fraud", tags=["fraud-detection"])


# Schemas
class TransactionInput(BaseModel):
    """Transaction input for fraud scoring."""
    transaction_id: Optional[str] = None
    user_id: str
    amount: float = Field(gt=0, description="Transaction amount")
    payment_method: str = Field(default="CARD", description="Payment method")
    num_items: int = Field(default=1, ge=1, description="Number of items")
    total_quantity: int = Field(default=1, ge=1, description="Total quantity")
    avg_item_price: Optional[float] = None
    max_item_price: Optional[float] = None
    min_item_price: Optional[float] = None
    timestamp: Optional[datetime] = None
    device_info: Optional[str] = None
    ip_address: Optional[str] = None


class FraudReason(BaseModel):
    """Reason for fraud score."""
    reason: str
    contribution: float
    severity: str  # "low", "medium", "high"


class FraudScoreResponse(BaseModel):
    """Response for fraud scoring."""
    transaction_id: Optional[str]
    risk_score: float = Field(ge=0, le=1, description="Risk score (0=safe, 1=fraud)")
    risk_level: str = Field(description="low, medium, high, critical")
    top_reasons: List[FraudReason]
    model_version: str
    recommendation: str
    flagged: bool


class FraudStatsResponse(BaseModel):
    """Fraud detection statistics."""
    total_scored: int
    high_risk_count: int
    high_risk_pct: float
    avg_risk_score: float
    model_info: Dict[str, Any]


# Global cache
_isolation_model = None
_xgb_model = None
_models_loaded = False


def load_models():
    """Load fraud detection models."""
    global _isolation_model, _xgb_model, _models_loaded
    
    if _models_loaded:
        return
    
    try:
        # Load IsolationForest
        isolation_path = settings.model_dir / "fraud_isolation_forest.pkl"
        if isolation_path.exists():
            _isolation_model = joblib.load(isolation_path)
            print(f"  ✓ Loaded IsolationForest model")
        else:
            raise FileNotFoundError(f"IsolationForest model not found at {isolation_path}")
        
        # Load XGBoost (optional)
        xgb_path = settings.model_dir / "fraud_xgboost.pkl"
        if xgb_path.exists():
            _xgb_model = joblib.load(xgb_path)
            print(f"  ✓ Loaded XGBoost model")
        else:
            print(f"  ⚠️  XGBoost model not found (using IsolationForest only)")
        
        _models_loaded = True
        
    except Exception as e:
        print(f"Failed to load fraud models: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Fraud detection models not available. Run train_fraud_enhanced.py first. Error: {str(e)}"
        )


def engineer_transaction_features(transaction: TransactionInput, 
                                  user_history: pd.DataFrame,
                                  user_profile: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features for a single transaction.
    
    Args:
        transaction: Transaction input
        user_history: User's transaction history
        user_profile: User profile data
        
    Returns:
        DataFrame with engineered features
    """
    features = {}
    
    # Basic amount features
    features['amount'] = transaction.amount
    features['log_amount'] = np.log1p(transaction.amount)
    
    # User profile features
    if not user_profile.empty:
        profile = user_profile.iloc[0]
        
        avg_order = profile.get('avg_order_amount', transaction.amount)
        max_order = profile.get('max_order_amount', transaction.amount)
        stddev_order = profile.get('stddev_order_amount', 0)
        
        features['amount_vs_user_avg'] = transaction.amount / (avg_order + 1)
        features['amount_vs_user_max'] = transaction.amount / (max_order + 1)
        features['amount_zscore'] = (transaction.amount - avg_order) / (stddev_order + 1)
        
        features['account_age_days'] = profile.get('account_age_days', 0)
        features['is_new_account'] = 1 if features['account_age_days'] < 30 else 0
        features['is_very_new_account'] = 1 if features['account_age_days'] < 7 else 0
        
        features['total_orders'] = profile.get('total_orders', 0)
        features['orders_per_day'] = features['total_orders'] / (features['account_age_days'] + 1)
        features['avg_order_amount'] = avg_order
        features['total_spent'] = profile.get('total_spent', 0)
    else:
        # New user - set defaults
        features['amount_vs_user_avg'] = 1.0
        features['amount_vs_user_max'] = 1.0
        features['amount_zscore'] = 0.0
        features['account_age_days'] = 0
        features['is_new_account'] = 1
        features['is_very_new_account'] = 1
        features['total_orders'] = 0
        features['orders_per_day'] = 0
        features['avg_order_amount'] = transaction.amount
        features['total_spent'] = 0
    
    # Time features
    timestamp = transaction.timestamp or datetime.now()
    features['hour'] = timestamp.hour
    features['day_of_week'] = timestamp.weekday()
    features['is_weekend'] = 1 if timestamp.weekday() >= 5 else 0
    features['is_night'] = 1 if (timestamp.hour >= 22 or timestamp.hour <= 6) else 0
    features['is_business_hours'] = 1 if (9 <= timestamp.hour <= 17) else 0
    
    # Transaction composition
    features['num_items'] = transaction.num_items
    features['total_quantity'] = transaction.total_quantity
    features['avg_item_price'] = transaction.avg_item_price or (transaction.amount / transaction.num_items)
    features['items_per_dollar'] = transaction.num_items / (transaction.amount + 1)
    features['quantity_per_item'] = transaction.total_quantity / transaction.num_items
    
    # Price range
    if transaction.max_item_price and transaction.min_item_price:
        features['price_range'] = transaction.max_item_price - transaction.min_item_price
        features['price_range_ratio'] = features['price_range'] / (features['avg_item_price'] + 1)
    else:
        features['price_range'] = 0
        features['price_range_ratio'] = 0
    
    # Velocity features from user history
    if not user_history.empty:
        # Transactions in last hour
        one_hour_ago = timestamp - timedelta(hours=1)
        txns_last_hour = len(user_history[user_history['timestamp'] >= one_hour_ago])
        
        # Transactions in last day
        one_day_ago = timestamp - timedelta(days=1)
        txns_last_day = len(user_history[user_history['timestamp'] >= one_day_ago])
        
        features['txns_last_hour'] = txns_last_hour
        features['txns_last_day'] = txns_last_day
        features['high_velocity_hour'] = 1 if txns_last_hour > 5 else 0
        features['high_velocity_day'] = 1 if txns_last_day > 20 else 0
    else:
        features['txns_last_hour'] = 0
        features['txns_last_day'] = 0
        features['high_velocity_hour'] = 0
        features['high_velocity_day'] = 0
    
    # Payment method encoding
    payment_methods = {'CARD': 0, 'UPI': 1, 'NETBANKING': 2, 'COD': 3, 'WALLET': 4}
    features['payment_method_encoded'] = payment_methods.get(transaction.payment_method, 0)
    
    # Order flags
    features['is_first_order'] = 1 if features['total_orders'] == 0 else 0
    features['is_large_order'] = 1 if transaction.amount > features['avg_order_amount'] * 3 else 0
    features['is_very_large_order'] = 1 if transaction.amount > features['avg_order_amount'] * 5 else 0
    
    return pd.DataFrame([features])


def score_with_isolation_forest(features_df: pd.DataFrame) -> tuple:
    """
    Score transaction using IsolationForest.
    
    Args:
        features_df: Feature DataFrame
        
    Returns:
        Tuple of (risk_score, reasons)
    """
    model_data = _isolation_model
    model = model_data['model']
    scaler = model_data['scaler']
    model_features = model_data['features']
    
    # Align features
    X = features_df[model_features].fillna(0)
    
    # Scale
    X_scaled = scaler.transform(X)
    
    # Get anomaly score
    anomaly_score = model.score_samples(X_scaled)[0]
    prediction = model.predict(X_scaled)[0]
    
    # Convert to risk score (0-1)
    # IsolationForest scores are typically in range [-0.5, 0.5]
    # More negative = more anomalous
    risk_score = 1 / (1 + np.exp(anomaly_score * 10))  # Sigmoid transformation
    risk_score = float(np.clip(risk_score, 0, 1))
    
    # Identify top reasons
    reasons = []
    
    # Check individual feature anomalies
    feature_values = features_df.iloc[0]
    
    if feature_values.get('is_very_new_account', 0) == 1:
        reasons.append({
            'reason': 'Very new account (< 7 days)',
            'contribution': 0.3,
            'severity': 'high'
        })
    
    if feature_values.get('amount_vs_user_avg', 0) > 5:
        reasons.append({
            'reason': f"Amount {feature_values['amount_vs_user_avg']:.1f}x user average",
            'contribution': 0.25,
            'severity': 'high'
        })
    
    if feature_values.get('high_velocity_hour', 0) == 1:
        reasons.append({
            'reason': f"High velocity: {int(feature_values.get('txns_last_hour', 0))} transactions in last hour",
            'contribution': 0.2,
            'severity': 'medium'
        })
    
    if feature_values.get('is_night', 0) == 1:
        reasons.append({
            'reason': 'Transaction during night hours',
            'contribution': 0.1,
            'severity': 'low'
        })
    
    if feature_values.get('is_first_order', 0) == 1 and feature_values.get('amount', 0) > 1000:
        reasons.append({
            'reason': 'Large first order',
            'contribution': 0.2,
            'severity': 'medium'
        })
    
    # Sort by contribution
    reasons.sort(key=lambda x: x['contribution'], reverse=True)
    
    return risk_score, reasons[:5]


def score_with_xgboost(features_df: pd.DataFrame) -> tuple:
    """
    Score transaction using XGBoost.
    
    Args:
        features_df: Feature DataFrame
        
    Returns:
        Tuple of (risk_score, feature_contributions)
    """
    model_data = _xgb_model
    model = model_data['model']
    scaler = model_data['scaler']
    model_features = model_data['features']
    
    # Align features
    X = features_df[model_features].fillna(0)
    
    # Scale
    X_scaled = scaler.transform(X)
    
    # Get probability
    risk_score = float(model.predict_proba(X_scaled)[0, 1])
    
    # Get feature contributions (SHAP-like approximation)
    feature_importance = model.feature_importances_
    feature_values = X.iloc[0].values
    
    # Calculate contributions
    contributions = []
    for i, (feat_name, feat_val, importance) in enumerate(zip(model_features, feature_values, feature_importance)):
        if importance > 0.01:  # Only significant features
            # Approximate contribution
            contribution = float(importance * abs(feat_val))
            
            if contribution > 0.05:
                severity = 'high' if contribution > 0.15 else 'medium' if contribution > 0.1 else 'low'
                
                contributions.append({
                    'reason': f"{feat_name}: {feat_val:.2f}",
                    'contribution': contribution,
                    'severity': severity
                })
    
    # Sort by contribution
    contributions.sort(key=lambda x: x['contribution'], reverse=True)
    
    return risk_score, contributions[:5]


def determine_risk_level(risk_score: float) -> str:
    """
    Determine risk level from score.
    
    Args:
        risk_score: Risk score (0-1)
        
    Returns:
        Risk level string
    """
    if risk_score >= 0.8:
        return "critical"
    elif risk_score >= 0.6:
        return "high"
    elif risk_score >= 0.4:
        return "medium"
    else:
        return "low"


def get_recommendation(risk_level: str, risk_score: float) -> str:
    """
    Get recommendation based on risk level.
    
    Args:
        risk_level: Risk level
        risk_score: Risk score
        
    Returns:
        Recommendation string
    """
    if risk_level == "critical":
        return f"BLOCK transaction (risk: {risk_score:.2%}). Manual review required."
    elif risk_level == "high":
        return f"HOLD transaction (risk: {risk_score:.2%}). Send OTP for verification."
    elif risk_level == "medium":
        return f"REVIEW transaction (risk: {risk_score:.2%}). Additional verification recommended."
    else:
        return f"APPROVE transaction (risk: {risk_score:.2%}). Low risk."


# API Endpoints
@router.post("/score", response_model=FraudScoreResponse)
async def score_transaction(transaction: TransactionInput = Body(...)):
    """
    Score a transaction for fraud risk.
    
    Returns:
    - risk_score: 0-1 (0=safe, 1=fraud)
    - risk_level: low, medium, high, critical
    - top_reasons: Why this score was assigned
    - recommendation: Action to take
    
    Thresholds:
    - < 0.4: Low risk - Approve
    - 0.4-0.6: Medium risk - Review
    - 0.6-0.8: High risk - Hold & send OTP
    - >= 0.8: Critical risk - Block & manual review
    """
    try:
        # Load models
        if not _models_loaded:
            load_models()
        
        # Get user data
        user_history = db.get_user_transaction_history(transaction.user_id, days=30)
        user_profile = db.get_user_profiles()
        user_profile = user_profile[user_profile['user_id'] == transaction.user_id]
        
        # Engineer features
        features_df = engineer_transaction_features(transaction, user_history, user_profile)
        
        # Score with available models
        if _xgb_model is not None:
            # Use XGBoost (supervised)
            risk_score, reasons = score_with_xgboost(features_df)
            model_version = "xgboost_v1"
        else:
            # Use IsolationForest (unsupervised)
            risk_score, reasons = score_with_isolation_forest(features_df)
            model_version = "isolation_forest_v1"
        
        # Determine risk level
        risk_level = determine_risk_level(risk_score)
        
        # Get recommendation
        recommendation = get_recommendation(risk_level, risk_score)
        
        # Flag if high risk
        flagged = risk_level in ["high", "critical"]
        
        # Prepare response
        response = FraudScoreResponse(
            transaction_id=transaction.transaction_id,
            risk_score=risk_score,
            risk_level=risk_level,
            top_reasons=[FraudReason(**r) for r in reasons],
            model_version=model_version,
            recommendation=recommendation,
            flagged=flagged
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud scoring error: {str(e)}")


@router.get("/health")
async def fraud_health():
    """Check fraud detection service health."""
    try:
        if not _models_loaded:
            load_models()
        
        return {
            "status": "healthy",
            "models_loaded": _models_loaded,
            "isolation_forest": _isolation_model is not None,
            "xgboost": _xgb_model is not None,
            "model_version": "xgboost_v1" if _xgb_model else "isolation_forest_v1"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Run train_fraud_enhanced.py to initialize"
        }


@router.get("/stats", response_model=FraudStatsResponse)
async def get_fraud_stats():
    """Get fraud detection statistics."""
    try:
        if not _models_loaded:
            load_models()
        
        # Get recent transactions
        transactions = db.get_transactions(limit=1000)
        
        if transactions.empty:
            return FraudStatsResponse(
                total_scored=0,
                high_risk_count=0,
                high_risk_pct=0.0,
                avg_risk_score=0.0,
                model_info={"status": "no_data"}
            )
        
        # Score all transactions (simplified)
        # In production, this would query a fraud_scores table
        
        model_info = {
            "isolation_forest_available": _isolation_model is not None,
            "xgboost_available": _xgb_model is not None,
            "active_model": "xgboost" if _xgb_model else "isolation_forest"
        }
        
        if _xgb_model:
            metrics = _xgb_model.get('metrics', {})
            model_info.update({
                "auc": metrics.get('auc', 0),
                "fraud_rate": metrics.get('fraud_pct', 0)
            })
        
        return FraudStatsResponse(
            total_scored=len(transactions),
            high_risk_count=0,  # Would query fraud_scores table
            high_risk_pct=0.0,
            avg_risk_score=0.0,
            model_info=model_info
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
async def refresh_models():
    """Refresh fraud detection models."""
    global _models_loaded, _isolation_model, _xgb_model
    
    try:
        _models_loaded = False
        _isolation_model = None
        _xgb_model = None
        
        load_models()
        
        return {
            "status": "success",
            "message": "Models reloaded",
            "isolation_forest": _isolation_model is not None,
            "xgboost": _xgb_model is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh failed: {str(e)}")


@router.get("/thresholds")
async def get_thresholds():
    """
    Get recommended fraud score thresholds.
    
    These thresholds balance fraud prevention with customer experience.
    Adjust based on your business requirements and fraud rate.
    """
    return {
        "thresholds": {
            "low": {
                "range": "0.0 - 0.4",
                "action": "APPROVE",
                "description": "Low risk - Process normally"
            },
            "medium": {
                "range": "0.4 - 0.6",
                "action": "REVIEW",
                "description": "Medium risk - Flag for review"
            },
            "high": {
                "range": "0.6 - 0.8",
                "action": "HOLD",
                "description": "High risk - Hold payment and send OTP"
            },
            "critical": {
                "range": "0.8 - 1.0",
                "action": "BLOCK",
                "description": "Critical risk - Block and require manual review"
            }
        },
        "recommendations": {
            "conservative": "Lower thresholds (0.3, 0.5, 0.7) for higher security",
            "balanced": "Default thresholds (0.4, 0.6, 0.8) for balance",
            "permissive": "Higher thresholds (0.5, 0.7, 0.9) for better UX"
        },
        "integration_guide": {
            "step1": "Call /fraud/score before processing payment",
            "step2": "Check risk_level in response",
            "step3": "Take action based on recommendation",
            "step4": "Log result for monitoring and retraining"
        }
    }
