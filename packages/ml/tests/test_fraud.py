"""Tests for fraud detection endpoints."""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


def test_fraud_score():
    """Test fraud scoring endpoint."""
    transaction = {
        "user_id": "test-user-123",
        "amount": 1000.0,
        "payment_method": "CARD",
        "num_items": 3,
        "avg_item_price": 333.33,
        "max_item_price": 500.0
    }
    
    response = client.post("/fraud/score", json=transaction)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "risk_level" in data
    assert "factors" in data
    assert "recommendation" in data
    assert 0 <= data["risk_score"] <= 1


def test_fraud_score_high_amount():
    """Test fraud detection with high amount."""
    transaction = {
        "user_id": "test-user-123",
        "amount": 50000.0,
        "payment_method": "CARD",
        "num_items": 1,
        "avg_item_price": 50000.0,
        "max_item_price": 50000.0
    }
    
    response = client.post("/fraud/score", json=transaction)
    assert response.status_code == 200
    data = response.json()
    # High amount should increase risk score
    assert data["risk_score"] > 0


def test_fraud_score_night_transaction():
    """Test fraud detection for night transaction."""
    transaction = {
        "user_id": "test-user-123",
        "amount": 5000.0,
        "payment_method": "CARD",
        "num_items": 2,
        "avg_item_price": 2500.0,
        "max_item_price": 3000.0,
        "hour_of_day": 2  # 2 AM
    }
    
    response = client.post("/fraud/score", json=transaction)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data


def test_user_risk_profile():
    """Test user risk profile endpoint."""
    response = client.get("/fraud/user/test-user-123/risk-profile")
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert "base_risk_score" in data
    assert "risk_indicators" in data
    assert "statistics" in data


def test_fraud_score_missing_fields():
    """Test fraud detection with minimal fields."""
    transaction = {
        "user_id": "test-user-123",
        "amount": 1000.0,
        "payment_method": "CASH",
        "num_items": 1,
        "avg_item_price": 1000.0,
        "max_item_price": 1000.0
    }
    
    response = client.post("/fraud/score", json=transaction)
    assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
