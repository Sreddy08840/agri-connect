"""Tests for RAG-enabled chatbot."""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


class TestChatHealth:
    """Test chat service health and initialization."""
    
    def test_health_endpoint(self):
        """Test chat health endpoint."""
        response = client.get("/chat/health")
        assert response.status_code == 200
        
        data = response.json()
        assert 'status' in data
        assert 'model_loaded' in data
    
    def test_stats_endpoint(self):
        """Test chat statistics endpoint."""
        response = client.get("/chat/stats")
        
        # May fail if vector store not built
        if response.status_code == 200:
            data = response.json()
            assert 'total_documents' in data
            assert 'document_types' in data
            assert 'embedding_model' in data


class TestSemanticSearch:
    """Test semantic search functionality."""
    
    def test_basic_query(self):
        """Test basic chat query."""
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I place an order?",
                "top_k": 5
            }
        )
        
        # May return 503 if vector store not built
        if response.status_code == 503:
            pytest.skip("Vector store not built. Run build_vector_store.py first.")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'query' in data
        assert 'answer' in data
        assert 'retrieved_documents' in data
        assert 'method' in data
        assert 'confidence' in data
        
        # Check query matches
        assert data['query'] == "How do I place an order?"
        
        # Check answer is not empty
        assert len(data['answer']) > 0
        
        # Check retrieved documents
        assert isinstance(data['retrieved_documents'], list)
    
    def test_product_query(self):
        """Test product-related query."""
        response = client.post(
            "/chat/query",
            json={
                "query": "What vegetables are available?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'answer' in data
        assert len(data['answer']) > 0
    
    def test_faq_query(self):
        """Test FAQ-related query."""
        response = client.post(
            "/chat/query",
            json={
                "query": "Can I return products?",
                "top_k": 3
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'answer' in data
        
        # Should have high confidence for FAQ
        if data['retrieved_documents']:
            assert data['confidence'] > 0.5
    
    def test_delivery_query(self):
        """Test delivery-related query."""
        response = client.post(
            "/chat/query",
            json={
                "query": "What are the delivery charges?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'answer' in data


class TestRetrievedDocuments:
    """Test retrieved document structure and quality."""
    
    def test_document_structure(self):
        """Test that retrieved documents have correct structure."""
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I contact support?",
                "top_k": 3
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        
        if data['retrieved_documents']:
            doc = data['retrieved_documents'][0]
            
            # Check required fields
            assert 'doc_id' in doc
            assert 'text' in doc
            assert 'score' in doc
            assert 'metadata' in doc
            
            # Check types
            assert isinstance(doc['doc_id'], str)
            assert isinstance(doc['text'], str)
            assert isinstance(doc['score'], (int, float))
            assert isinstance(doc['metadata'], dict)
            
            # Check score range
            assert 0.0 <= doc['score'] <= 1.0
    
    def test_document_ranking(self):
        """Test that documents are ranked by relevance."""
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I place an order?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        docs = data['retrieved_documents']
        
        if len(docs) > 1:
            # Scores should be in descending order
            scores = [doc['score'] for doc in docs]
            assert scores == sorted(scores, reverse=True)
    
    def test_top_k_parameter(self):
        """Test that top_k parameter works correctly."""
        for k in [1, 3, 5]:
            response = client.post(
                "/chat/query",
                json={
                    "query": "What products are available?",
                    "top_k": k
                }
            )
            
            if response.status_code == 503:
                pytest.skip("Vector store not built")
            
            assert response.status_code == 200
            
            data = response.json()
            assert len(data['retrieved_documents']) <= k


class TestAnswerGeneration:
    """Test answer generation quality."""
    
    def test_answer_not_empty(self):
        """Test that answer is not empty."""
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I order?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        assert len(data['answer']) > 0
        assert data['answer'] != ""
    
    def test_confidence_score(self):
        """Test that confidence score is in valid range."""
        response = client.post(
            "/chat/query",
            json={
                "query": "Can I return products?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 0.0 <= data['confidence'] <= 1.0
    
    def test_method_field(self):
        """Test that method field is present and valid."""
        response = client.post(
            "/chat/query",
            json={
                "query": "What are delivery charges?",
                "top_k": 5,
                "use_llm": False
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data['method'] in ['template', 'llm', 'no_results']


class TestPrivacy:
    """Test privacy and anonymization features."""
    
    def test_user_id_optional(self):
        """Test that user_id is optional."""
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I order?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
    
    def test_user_id_accepted(self):
        """Test that user_id is accepted but not returned."""
        response = client.post(
            "/chat/query",
            json={
                "user_id": "test-user-123",
                "query": "How do I order?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        # User ID should not be in response (privacy)
        assert 'user_id' not in data


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_empty_query(self):
        """Test that empty query is rejected."""
        response = client.post(
            "/chat/query",
            json={
                "query": "",
                "top_k": 5
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_very_long_query(self):
        """Test that very long query is rejected."""
        long_query = "a" * 1000
        response = client.post(
            "/chat/query",
            json={
                "query": long_query,
                "top_k": 5
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_invalid_top_k(self):
        """Test that invalid top_k is rejected."""
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I order?",
                "top_k": 0
            }
        )
        
        assert response.status_code == 422
        
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I order?",
                "top_k": 100
            }
        )
        
        assert response.status_code == 422
    
    def test_nonsense_query(self):
        """Test handling of nonsense query."""
        response = client.post(
            "/chat/query",
            json={
                "query": "asdfghjkl qwertyuiop",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        # Should still return an answer (even if low confidence)
        assert 'answer' in data


class TestResponseTime:
    """Test response time performance."""
    
    def test_response_time_tracked(self):
        """Test that response time is tracked."""
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I order?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'response_time_ms' in data
        assert data['response_time_ms'] > 0


class TestDocumentTypes:
    """Test different document types."""
    
    def test_faq_document_type(self):
        """Test retrieval of FAQ documents."""
        response = client.post(
            "/chat/query",
            json={
                "query": "How do I place an order?",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Should retrieve FAQ documents
        if data['retrieved_documents']:
            doc_types = [doc['metadata'].get('type') for doc in data['retrieved_documents']]
            assert 'faq' in doc_types or 'help' in doc_types
    
    def test_product_document_type(self):
        """Test retrieval of product documents."""
        response = client.post(
            "/chat/query",
            json={
                "query": "tomatoes",
                "top_k": 5
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Vector store not built")
        
        assert response.status_code == 200
        
        data = response.json()
        
        # May retrieve product documents
        if data['retrieved_documents']:
            doc_types = [doc['metadata'].get('type') for doc in data['retrieved_documents']]
            # At least one document should be returned
            assert len(doc_types) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
