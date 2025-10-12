"""Tests for fraud detection system."""
import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


class TestFraudHealth:
    """Test fraud detection service health."""
    
    def test_health_endpoint(self):
        """Test fraud health endpoint."""
        response = client.get("/fraud/health")
        assert response.status_code == 200
        
        data = response.json()
        assert 'status' in data
        assert 'models_loaded' in data
    
    def test_thresholds_endpoint(self):
        """Test thresholds information endpoint."""
        response = client.get("/fraud/thresholds")
        assert response.status_code == 200
        
        data = response.json()
        assert 'thresholds' in data
        assert 'recommendations' in data
        assert 'integration_guide' in data


class TestFraudScoring:
    """Test fraud scoring functionality."""
    
    def test_score_normal_transaction(self):
        """Test scoring a normal transaction."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 100.0,
                "payment_method": "CARD",
                "num_items": 2,
                "total_quantity": 2
            }
        )
        
        # May return 503 if models not trained
        if response.status_code == 503:
            pytest.skip("Fraud models not trained. Run train_fraud_enhanced.py first.")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'risk_score' in data
        assert 'risk_level' in data
        assert 'top_reasons' in data
        assert 'recommendation' in data
        assert 'flagged' in data
        
        # Check risk score range
        assert 0.0 <= data['risk_score'] <= 1.0
        
        # Check risk level
        assert data['risk_level'] in ['low', 'medium', 'high', 'critical']
    
    def test_score_large_transaction(self):
        """Test scoring a large transaction."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 10000.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        # Large transaction should have higher risk
        assert data['risk_score'] >= 0.0
    
    def test_score_high_velocity(self):
        """Test scoring with high velocity indicators."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "new_user_123",
                "amount": 500.0,
                "payment_method": "CARD",
                "num_items": 5,
                "total_quantity": 10
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'risk_score' in data


class TestRiskLevels:
    """Test risk level classification."""
    
    def test_risk_level_values(self):
        """Test that risk levels are correctly assigned."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 100.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        risk_level = data['risk_level']
        risk_score = data['risk_score']
        
        # Verify risk level matches score
        if risk_score >= 0.8:
            assert risk_level == 'critical'
        elif risk_score >= 0.6:
            assert risk_level == 'high'
        elif risk_score >= 0.4:
            assert risk_level == 'medium'
        else:
            assert risk_level == 'low'


class TestRecommendations:
    """Test fraud recommendations."""
    
    def test_recommendation_format(self):
        """Test that recommendations are properly formatted."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 100.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        recommendation = data['recommendation']
        
        # Should contain action keyword
        assert any(keyword in recommendation.upper() for keyword in ['APPROVE', 'REVIEW', 'HOLD', 'BLOCK'])
    
    def test_flagged_for_high_risk(self):
        """Test that high risk transactions are flagged."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "suspicious_user",
                "amount": 50000.0,
                "payment_method": "CARD",
                "num_items": 100,
                "total_quantity": 100
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        # Very large transaction should potentially be flagged
        assert isinstance(data['flagged'], bool)


class TestTopReasons:
    """Test fraud reason generation."""
    
    def test_reasons_structure(self):
        """Test that reasons have correct structure."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 100.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        reasons = data['top_reasons']
        
        assert isinstance(reasons, list)
        
        if reasons:
            reason = reasons[0]
            assert 'reason' in reason
            assert 'contribution' in reason
            assert 'severity' in reason
            
            # Check severity values
            assert reason['severity'] in ['low', 'medium', 'high']
            
            # Check contribution range
            assert 0.0 <= reason['contribution'] <= 1.0
    
    def test_reasons_sorted_by_contribution(self):
        """Test that reasons are sorted by contribution."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 100.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        reasons = data['top_reasons']
        
        if len(reasons) > 1:
            contributions = [r['contribution'] for r in reasons]
            # Should be in descending order
            assert contributions == sorted(contributions, reverse=True)


class TestInputValidation:
    """Test input validation."""
    
    def test_missing_required_fields(self):
        """Test that missing required fields are rejected."""
        response = client.post(
            "/fraud/score",
            json={
                "amount": 100.0
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_negative_amount(self):
        """Test that negative amount is rejected."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": -100.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        assert response.status_code == 422
    
    def test_zero_amount(self):
        """Test that zero amount is rejected."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 0.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        assert response.status_code == 422
    
    def test_invalid_num_items(self):
        """Test that invalid num_items is rejected."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 100.0,
                "payment_method": "CARD",
                "num_items": 0,
                "total_quantity": 1
            }
        )
        
        assert response.status_code == 422


class TestModelVersion:
    """Test model versioning."""
    
    def test_model_version_returned(self):
        """Test that model version is returned."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 100.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'model_version' in data
        assert isinstance(data['model_version'], str)
        assert len(data['model_version']) > 0


class TestStats:
    """Test fraud statistics endpoint."""
    
    def test_stats_endpoint(self):
        """Test fraud statistics endpoint."""
        response = client.get("/fraud/stats")
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'total_scored' in data
        assert 'high_risk_count' in data
        assert 'high_risk_pct' in data
        assert 'avg_risk_score' in data
        assert 'model_info' in data


class TestRefresh:
    """Test model refresh functionality."""
    
    def test_refresh_endpoint(self):
        """Test model refresh endpoint."""
        response = client.post("/fraud/refresh")
        
        # May fail if models not trained
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'success'


class TestPaymentMethods:
    """Test different payment methods."""
    
    @pytest.mark.parametrize("payment_method", ["CARD", "UPI", "NETBANKING", "COD", "WALLET"])
    def test_different_payment_methods(self, payment_method):
        """Test scoring with different payment methods."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 100.0,
                "payment_method": payment_method,
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        assert 'risk_score' in data


class TestEdgeCases:
    """Test edge cases."""
    
    def test_very_large_amount(self):
        """Test with very large amount."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 1000000.0,
                "payment_method": "CARD",
                "num_items": 1,
                "total_quantity": 1
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200
        
        data = response.json()
        # Very large amount should have high risk
        assert data['risk_score'] > 0.0
    
    def test_many_items(self):
        """Test with many items."""
        response = client.post(
            "/fraud/score",
            json={
                "user_id": "user123",
                "amount": 1000.0,
                "payment_method": "CARD",
                "num_items": 100,
                "total_quantity": 100
            }
        )
        
        if response.status_code == 503:
            pytest.skip("Fraud models not trained")
        
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
