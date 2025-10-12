"""Tests for chatbot endpoints."""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


def test_chat_query():
    """Test chat query endpoint."""
    query = {
        "query": "What vegetables are available?"
    }
    
    response = client.post("/chat/query", json=query)
    assert response.status_code in [200, 503]  # 503 if models not ready
    
    if response.status_code == 200:
        data = response.json()
        assert "query" in data
        assert "answer" in data
        assert "documents" in data
        assert "confidence" in data


def test_chat_query_with_user():
    """Test chat query with user context."""
    query = {
        "query": "Show me organic products",
        "user_id": "test-user-123"
    }
    
    response = client.post("/chat/query", json=query)
    assert response.status_code in [200, 503]


def test_chat_query_price():
    """Test price-related query."""
    query = {
        "query": "What is the price of tomatoes?"
    }
    
    response = client.post("/chat/query", json=query)
    assert response.status_code in [200, 503]


def test_chat_refresh_index():
    """Test refresh vector index endpoint."""
    response = client.post("/chat/refresh-index")
    assert response.status_code in [200, 500]
    
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "success"


def test_chat_suggestions():
    """Test query suggestions endpoint."""
    response = client.get("/chat/suggestions")
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert isinstance(data["suggestions"], list)
    assert len(data["suggestions"]) > 0


def test_chat_empty_query():
    """Test with empty query."""
    query = {
        "query": ""
    }
    
    response = client.post("/chat/query", json=query)
    assert response.status_code == 422  # Validation error


def test_chat_long_query():
    """Test with very long query."""
    query = {
        "query": "a" * 600  # Exceeds max length
    }
    
    response = client.post("/chat/query", json=query)
    assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
