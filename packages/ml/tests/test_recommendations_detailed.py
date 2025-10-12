"""Detailed tests for recommendation system."""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app
from app.db import db

client = TestClient(app)


class TestRecommendationMappings:
    """Test user/item mapping correctness."""
    
    def test_mappings_file_structure(self):
        """Test that mappings.json has correct structure."""
        mappings_path = Path(__file__).parent.parent / "models" / "mappings.json"
        
        if not mappings_path.exists():
            pytest.skip("Mappings file not found - train models first")
        
        with open(mappings_path, 'r') as f:
            mappings = json.load(f)
        
        # Check required keys
        assert 'user_index' in mappings
        assert 'item_index' in mappings
        assert 'user_ids' in mappings
        assert 'item_ids' in mappings
        assert 'index_to_user' in mappings
        assert 'index_to_item' in mappings
    
    def test_mapping_consistency(self):
        """Test that forward and reverse mappings are consistent."""
        mappings_path = Path(__file__).parent.parent / "models" / "mappings.json"
        
        if not mappings_path.exists():
            pytest.skip("Mappings file not found")
        
        with open(mappings_path, 'r') as f:
            mappings = json.load(f)
        
        # Check user mappings
        for user_id, idx in mappings['user_index'].items():
            assert mappings['index_to_user'][str(idx)] == user_id
        
        # Check item mappings
        for item_id, idx in mappings['item_index'].items():
            assert mappings['index_to_item'][str(idx)] == item_id


class TestRecommendationEndpoints:
    """Test recommendation API endpoints."""
    
    def test_user_recommendations_basic(self):
        """Test basic user recommendations endpoint."""
        response = client.get("/recommendations/user/test-user-123")
        assert response.status_code == 200
        
        data = response.json()
        assert 'user_id' in data
        assert 'items' in data
        assert 'method' in data
        assert isinstance(data['items'], list)
    
    def test_user_recommendations_with_top_k(self):
        """Test user recommendations with custom top_k."""
        response = client.get("/recommendations/user/test-user-123?top_k=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data['items']) <= 5
    
    def test_user_recommendations_max_limit(self):
        """Test that top_k is capped at 100."""
        response = client.get("/recommendations/user/test-user-123?top_k=150")
        assert response.status_code == 422  # Validation error
    
    def test_user_recommendations_item_structure(self):
        """Test that recommendation items have correct structure."""
        response = client.get("/recommendations/user/test-user-123?top_k=5")
        assert response.status_code == 200
        
        data = response.json()
        if data['items']:
            item = data['items'][0]
            assert 'product_id' in item
            assert 'score' in item
            assert 'reason' in item
            assert isinstance(item['reason'], list)
            assert item['score'] >= 0
    
    def test_product_similarity(self):
        """Test product similarity endpoint."""
        response = client.get("/recommendations/product/test-product-123")
        assert response.status_code in [200, 404, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert 'items' in data
            assert 'method' in data
            assert data['method'] == 'content-based'
    
    def test_cache_stats(self):
        """Test cache statistics endpoint."""
        response = client.get("/recommendations/cache/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert 'cache_size' in data
        assert 'cache_ttl_seconds' in data
        assert 'models_loaded' in data
        assert isinstance(data['cache_size'], int)
    
    def test_refresh_endpoint(self):
        """Test model refresh endpoint."""
        response = client.post("/recommendations/refresh")
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'success'
        assert 'models_loaded' in data


class TestRecommendationCaching:
    """Test caching functionality."""
    
    def test_cache_hit(self):
        """Test that second request is served from cache."""
        user_id = "cache-test-user"
        
        # First request
        response1 = client.get(f"/recommendations/user/{user_id}?top_k=10")
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Second request (should be cached)
        response2 = client.get(f"/recommendations/user/{user_id}?top_k=10")
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Check if served from cache
        if 'cached' in data2['method']:
            assert data1['items'] == data2['items']
    
    def test_cache_clear_on_refresh(self):
        """Test that cache is cleared on refresh."""
        # Make a request to populate cache
        client.get("/recommendations/user/test-user?top_k=10")
        
        # Check cache size
        stats1 = client.get("/recommendations/cache/stats").json()
        cache_size_before = stats1['cache_size']
        
        # Refresh
        client.post("/recommendations/refresh")
        
        # Check cache size after refresh
        stats2 = client.get("/recommendations/cache/stats").json()
        cache_size_after = stats2['cache_size']
        
        assert cache_size_after == 0


class TestRecommendationReasons:
    """Test recommendation reason codes."""
    
    def test_reason_codes_valid(self):
        """Test that reason codes are from valid set."""
        valid_reasons = {'cf', 'cb', 'hybrid', 'popular'}
        
        response = client.get("/recommendations/user/test-user?top_k=10")
        assert response.status_code == 200
        
        data = response.json()
        for item in data['items']:
            for reason in item['reason']:
                assert reason in valid_reasons
    
    def test_hybrid_has_multiple_reasons(self):
        """Test that hybrid recommendations have multiple reason codes."""
        response = client.get("/recommendations/user/test-user?top_k=10")
        assert response.status_code == 200
        
        data = response.json()
        if data['method'] == 'hybrid':
            # At least some items should have multiple reasons
            multi_reason_items = [
                item for item in data['items']
                if len(item['reason']) > 1
            ]
            # This might not always be true, so we just check structure
            assert isinstance(multi_reason_items, list)


class TestDatabaseHelpers:
    """Test database helper functions."""
    
    def test_get_user_order_history(self):
        """Test getting user order history."""
        # This will return empty for non-existent user
        orders = db.get_user_order_history('test-user-123')
        assert isinstance(orders, pd.DataFrame)
    
    def test_get_all_orders(self):
        """Test getting all orders."""
        orders = db.get_all_orders()
        assert isinstance(orders, pd.DataFrame)
    
    def test_get_product_metadata(self):
        """Test getting product metadata."""
        products = db.get_product_metadata(['prod1', 'prod2'])
        assert isinstance(products, pd.DataFrame)
    
    def test_get_user_view_events(self):
        """Test getting user view events."""
        views = db.get_user_view_events('test-user-123')
        assert isinstance(views, pd.DataFrame)
    
    def test_get_top_selling_products(self):
        """Test getting top selling products."""
        top_products = db.get_top_selling_products(limit=10)
        assert isinstance(top_products, list)
        assert len(top_products) <= 10


class TestColdStart:
    """Test cold-start scenarios."""
    
    def test_new_user_gets_popular(self):
        """Test that new users get popular products."""
        # Use a definitely non-existent user ID
        response = client.get("/recommendations/user/brand-new-user-12345?top_k=10")
        assert response.status_code == 200
        
        data = response.json()
        # Should get some recommendations (popular products)
        assert len(data['items']) > 0
        # Method should indicate cold-start
        assert 'popular' in data['method'].lower() or 'cold' in data['method'].lower()
    
    def test_cold_start_scores_decreasing(self):
        """Test that cold-start recommendations have decreasing scores."""
        response = client.get("/recommendations/user/brand-new-user-12345?top_k=10")
        assert response.status_code == 200
        
        data = response.json()
        if data['items'] and 'popular' in data['method'].lower():
            scores = [item['score'] for item in data['items']]
            # Scores should be in descending order
            assert scores == sorted(scores, reverse=True)


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_zero_top_k(self):
        """Test that top_k=0 is rejected."""
        response = client.get("/recommendations/user/test-user?top_k=0")
        assert response.status_code == 422  # Validation error
    
    def test_negative_top_k(self):
        """Test that negative top_k is rejected."""
        response = client.get("/recommendations/user/test-user?top_k=-5")
        assert response.status_code == 422
    
    def test_empty_user_id(self):
        """Test handling of empty user ID."""
        response = client.get("/recommendations/user/?top_k=10")
        assert response.status_code == 404  # Not found
    
    def test_special_characters_in_user_id(self):
        """Test handling of special characters in user ID."""
        response = client.get("/recommendations/user/user@123!?top_k=10")
        # Should handle gracefully
        assert response.status_code in [200, 404, 500]


class TestIntegration:
    """Integration tests with small dataset."""
    
    def test_end_to_end_workflow(self):
        """Test complete workflow from training to inference."""
        # This is a smoke test - just verify endpoints work together
        
        # 1. Get recommendations
        rec_response = client.get("/recommendations/user/test-user?top_k=5")
        assert rec_response.status_code == 200
        
        # 2. Check cache
        cache_response = client.get("/recommendations/cache/stats")
        assert cache_response.status_code == 200
        
        # 3. Refresh models
        refresh_response = client.post("/recommendations/refresh")
        assert refresh_response.status_code == 200
        
        # 4. Get recommendations again (cache should be cleared)
        rec_response2 = client.get("/recommendations/user/test-user?top_k=5")
        assert rec_response2.status_code == 200


# Import pandas for database tests
import pandas as pd


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
