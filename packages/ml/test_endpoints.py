"""Test script for ML service endpoints."""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint."""
    print("\n" + "="*60)
    print("Testing /health endpoint")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_recommendations():
    """Test recommendations endpoint."""
    print("\n" + "="*60)
    print("Testing /recommendations/user/{user_id} endpoint")
    print("="*60)
    
    # Test with a sample user ID
    user_id = "test-user-123"
    response = requests.get(f"{BASE_URL}/recommendations/user/{user_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code in [200, 404]  # 404 is acceptable for non-existent user

def test_review_analysis():
    """Test review analysis endpoint."""
    print("\n" + "="*60)
    print("Testing /reviews/analyze endpoint (POST)")
    print("="*60)
    
    # Sample review data
    review_data = {
        "user_id": "test-user-123",
        "product_id": "test-product-456",
        "text": "This is an excellent product! Very fresh and high quality. I highly recommend it to everyone.",
        "rating": 5
    }
    
    response = requests.post(
        f"{BASE_URL}/reviews/analyze",
        json=review_data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_review_analysis_negative():
    """Test review analysis with negative review."""
    print("\n" + "="*60)
    print("Testing /reviews/analyze with negative review")
    print("="*60)
    
    review_data = {
        "user_id": "test-user-456",
        "product_id": "test-product-789",
        "text": "Terrible product. Arrived damaged and spoiled. Complete waste of money. Never buying again!",
        "rating": 1
    }
    
    response = requests.post(
        f"{BASE_URL}/reviews/analyze",
        json=review_data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_review_analysis_spam():
    """Test review analysis with spam."""
    print("\n" + "="*60)
    print("Testing /reviews/analyze with spam detection")
    print("="*60)
    
    review_data = {
        "user_id": "test-user-789",
        "product_id": "test-product-123",
        "text": "AMAZING PRODUCT!!! BUY NOW!!! Contact me at www.spam.com for discount!!!",
        "rating": 5
    }
    
    response = requests.post(
        f"{BASE_URL}/reviews/analyze",
        json=review_data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_similar_products():
    """Test similar products endpoint."""
    print("\n" + "="*60)
    print("Testing /recommendations/product/{product_id} endpoint")
    print("="*60)
    
    product_id = "test-product-123"
    response = requests.get(f"{BASE_URL}/recommendations/product/{product_id}")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Response: {response.text}")
    return response.status_code in [200, 404, 503]  # Various acceptable responses

def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("ML SERVICE ENDPOINT TESTS")
    print("="*60)
    print(f"Testing service at: {BASE_URL}")
    
    results = {}
    
    try:
        results['health'] = test_health()
        results['recommendations'] = test_recommendations()
        results['review_analysis_positive'] = test_review_analysis()
        results['review_analysis_negative'] = test_review_analysis_negative()
        results['review_analysis_spam'] = test_review_analysis_spam()
        results['similar_products'] = test_similar_products()
        
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        for test_name, passed in results.items():
            status = "✓ PASSED" if passed else "✗ FAILED"
            print(f"{test_name}: {status}")
        
        total = len(results)
        passed = sum(results.values())
        print(f"\nTotal: {passed}/{total} tests passed")
        
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to ML service")
        print("Make sure the service is running at http://localhost:8000")
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")

if __name__ == "__main__":
    main()
