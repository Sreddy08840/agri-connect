"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# Recommendation schemas
class RecommendationItem(BaseModel):
    """Single recommendation item."""
    product_id: str
    score: float
    reason: List[str] = Field(description="Recommendation sources: cf, cb, hybrid")


class RecommendationRequest(BaseModel):
    """Request for recommendations."""
    top_k: int = Field(default=20, ge=1, le=100, description="Number of recommendations")


class RecommendationResponse(BaseModel):
    """Response for recommendation endpoint."""
    user_id: str
    items: List[RecommendationItem]
    method: str = Field(description="Recommendation method used")


# Forecast schemas
class ForecastPoint(BaseModel):
    """Single forecast data point."""
    date: str
    predicted_demand: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None


class RestockRecommendation(BaseModel):
    """Restock recommendation."""
    reorder_amount: int = Field(description="Recommended reorder quantity")
    reorder_by_date: str = Field(description="Date by which to reorder")
    current_inventory: int = Field(description="Current stock level")
    predicted_demand: float = Field(description="Predicted demand during lead time")
    safety_stock: int = Field(description="Safety stock buffer")
    stockout_risk: str = Field(description="Risk level: low, medium, high")


class ForecastResponse(BaseModel):
    """Response for forecast endpoint."""
    product_id: str
    forecast: List[ForecastPoint]
    method: str
    confidence: Optional[float] = None
    restock_recommendation: Optional[RestockRecommendation] = None
    model_metadata: Optional[Dict[str, Any]] = None


class ForecastRequest(BaseModel):
    """Request for forecast endpoint."""
    horizon_days: int = Field(default=30, ge=1, le=365, description="Number of days to forecast")
    lead_time_days: int = Field(default=7, ge=1, le=90, description="Supplier lead time in days")
    safety_stock_days: int = Field(default=3, ge=0, le=30, description="Safety stock buffer in days")
    desired_fill_rate: float = Field(default=0.95, ge=0.5, le=1.0, description="Desired service level")


# Price optimization schemas
class PricePoint(BaseModel):
    """Price point with predicted metrics."""
    price: float
    predicted_demand: float
    predicted_revenue: float
    confidence: float


class PriceOptimizationResponse(BaseModel):
    """Response for price optimization endpoint."""
    product_id: str
    current_price: float
    recommended_price: float
    price_points: List[PricePoint]
    expected_revenue_increase: float


class PriceOptimizationRequest(BaseModel):
    """Request for price optimization."""
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    num_samples: int = Field(default=20, ge=5, le=100)


# Fraud detection schemas
class TransactionFeatures(BaseModel):
    """Transaction features for fraud detection."""
    user_id: str
    amount: float
    payment_method: str
    num_items: int
    avg_item_price: float
    max_item_price: float
    hour_of_day: Optional[int] = None
    day_of_week: Optional[int] = None
    user_history_days: Optional[int] = None
    user_total_orders: Optional[int] = None


class FraudScoreResponse(BaseModel):
    """Response for fraud detection endpoint."""
    risk_score: float = Field(ge=0.0, le=1.0, description="Risk score from 0 (safe) to 1 (fraudulent)")
    risk_level: str = Field(description="Risk level: low, medium, high")
    factors: List[str] = Field(description="Contributing risk factors")
    recommendation: str


# Chatbot/RAG schemas
class ChatQuery(BaseModel):
    """Chat query request."""
    query: str = Field(min_length=1, max_length=500)
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatDocument(BaseModel):
    """Retrieved document for context."""
    id: str
    text: str
    score: float
    metadata: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Response for chat endpoint."""
    query: str
    answer: str
    documents: List[ChatDocument]
    confidence: float


# General schemas
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: datetime
    models_loaded: Dict[str, bool]


class RefreshResponse(BaseModel):
    """Response for refresh endpoint."""
    status: str
    message: str
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None
    timestamp: datetime
