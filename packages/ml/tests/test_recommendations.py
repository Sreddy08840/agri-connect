"""Tests for recommendation endpoints."""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models_loaded" in data


def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Agri-Connect ML Service"
    assert "endpoints" in data


def test_user_recommendations():
    """Test user recommendations endpoint."""
    response = client.get("/recommendations/user/test-user-123")
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert "items" in data
    assert "method" in data
    assert isinstance(data["items"], list)


def test_user_recommendations_with_limit():
    """Test user recommendations with custom limit."""
    response = client.get("/recommendations/user/test-user-123?n=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) <= 5


def test_product_recommendations():
    """Test product similarity recommendations."""
    response = client.get("/recommendations/product/test-product-123")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "method" in data


def test_refresh_recommendations():
    """Test refresh endpoint."""
    response = client.post("/recommendations/refresh")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"


def test_invalid_limit():
    """Test with invalid limit parameter."""
    response = client.get("/recommendations/user/test-user?n=1000")
    # Should handle gracefully or return error
    assert response.status_code in [200, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
