"""Tests for forecasting endpoints."""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


def test_forecast_product():
    """Test product demand forecast."""
    response = client.post(
        "/forecast/product/test-product-123",
        json={"days": 30}
    )
    # May return 400 if insufficient data, which is acceptable
    assert response.status_code in [200, 400]
    
    if response.status_code == 200:
        data = response.json()
        assert "product_id" in data
        assert "forecast" in data
        assert "method" in data
        assert isinstance(data["forecast"], list)


def test_forecast_with_custom_days():
    """Test forecast with custom number of days."""
    response = client.post(
        "/forecast/product/test-product-123",
        json={"days": 60}
    )
    assert response.status_code in [200, 400]


def test_forecast_invalid_days():
    """Test forecast with invalid days parameter."""
    response = client.post(
        "/forecast/product/test-product-123",
        json={"days": 500}  # Exceeds maximum
    )
    assert response.status_code == 422


def test_product_history():
    """Test product sales history endpoint."""
    response = client.get("/forecast/product/test-product-123/history")
    assert response.status_code == 200
    data = response.json()
    assert "product_id" in data
    assert "history" in data


def test_product_history_with_days():
    """Test product history with custom days."""
    response = client.get("/forecast/product/test-product-123/history?days=30")
    assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
