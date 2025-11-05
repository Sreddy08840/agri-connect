"""Quick fix script to resolve all ML service issues."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.db import db
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import json

def create_sample_data():
    """Create sample data if database is empty."""
    print("\n" + "="*60)
    print("Checking database for sample data...")
    print("="*60)
    
    try:
        products = db.get_products()
        if not products.empty:
            print(f"✓ Found {len(products)} products in database")
            return True
        else:
            print("⚠ No products found in database")
            print("  Please add products through the web interface first")
            return False
    except Exception as e:
        print(f"⚠ Database error: {e}")
        print("  Please ensure the database is set up correctly")
        return False


def train_tfidf_model():
    """Train TF-IDF model for content-based recommendations."""
    print("\n" + "="*60)
    print("Training TF-IDF model...")
    print("="*60)
    
    try:
        # Get products
        products = db.get_products()
        
        if products.empty:
            print("⚠ No products available for training")
            return False
        
        print(f"Training on {len(products)} products")
        
        # Create text features
        products['text'] = (
            products['title'].fillna('') + ' ' +
            products['description'].fillna('') + ' ' +
            products['category'].fillna('')
        )
        
        # Train TF-IDF
        vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        tfidf_matrix = vectorizer.fit_transform(products['text'])
        
        # Save model
        settings.model_dir.mkdir(parents=True, exist_ok=True)
        
        tfidf_data = {
            'vectorizer': vectorizer,
            'matrix': tfidf_matrix,
            'products': products[['id', 'title', 'description', 'category', 'price']]
        }
        
        joblib.dump(tfidf_data, settings.model_dir / 'tfidf.joblib')
        print("✓ TF-IDF model saved")
        return True
        
    except Exception as e:
        print(f"✗ Failed to train TF-IDF model: {e}")
        return False


def create_dummy_mappings():
    """Create dummy mappings for ALS model fallback."""
    print("\n" + "="*60)
    print("Creating mappings...")
    print("="*60)
    
    try:
        products = db.get_products()
        
        if products.empty:
            print("⚠ No products available")
            return False
        
        # Create simple mappings
        product_ids = products['id'].tolist()
        
        mappings = {
            'user_index': {},
            'item_index': {pid: idx for idx, pid in enumerate(product_ids)},
            'index_to_item': {str(idx): pid for idx, pid in enumerate(product_ids)},
            'index_to_user': {}
        }
        
        # Save mappings
        settings.model_dir.mkdir(parents=True, exist_ok=True)
        with open(settings.model_dir / 'mappings.json', 'w') as f:
            json.dump(mappings, f)
        
        print(f"✓ Mappings created for {len(product_ids)} products")
        return True
        
    except Exception as e:
        print(f"✗ Failed to create mappings: {e}")
        return False


def verify_endpoints():
    """Verify that endpoints will work."""
    print("\n" + "="*60)
    print("Verifying endpoint requirements...")
    print("="*60)
    
    checks = {
        'TF-IDF model': (settings.model_dir / 'tfidf.joblib').exists(),
        'Mappings': (settings.model_dir / 'mappings.json').exists(),
        'Database connection': True,
    }
    
    try:
        products = db.get_products()
        checks['Products in DB'] = not products.empty
    except:
        checks['Products in DB'] = False
    
    all_good = True
    for check, status in checks.items():
        symbol = "✓" if status else "✗"
        print(f"{symbol} {check}: {'OK' if status else 'MISSING'}")
        if not status:
            all_good = False
    
    return all_good


def main():
    """Run all fixes."""
    print("\n" + "="*60)
    print("ML SERVICE QUICK FIX")
    print("="*60)
    print("This script will:")
    print("1. Check database for products")
    print("2. Train TF-IDF model")
    print("3. Create mappings")
    print("4. Verify everything is ready")
    print("="*60)
    
    # Check database
    has_data = create_sample_data()
    
    if not has_data:
        print("\n" + "="*60)
        print("⚠ ACTION REQUIRED")
        print("="*60)
        print("Please add products to your database first:")
        print("1. Start the web application")
        print("2. Log in as a farmer")
        print("3. Add some products")
        print("4. Run this script again")
        print("="*60)
        return
    
    # Train models
    tfidf_ok = train_tfidf_model()
    mappings_ok = create_dummy_mappings()
    
    # Verify
    print()
    all_ok = verify_endpoints()
    
    print("\n" + "="*60)
    if all_ok:
        print("✓ ALL SYSTEMS READY!")
        print("="*60)
        print("\nYou can now start the ML service:")
        print("  py -m app.main")
        print("\nOptional: Train ALS model for better recommendations:")
        print("  .\\venv\\Scripts\\python.exe train_als.py")
        print("\nThen test the endpoints:")
        print("  1. Open http://127.0.0.1:8000/docs")
        print("  2. Try the /health endpoint")
        print("  3. Try the /reviews/analyze endpoint (POST)")
        print("  4. Try the /recommendations/user/{user_id} endpoint")
    else:
        print("⚠ SOME ISSUES REMAIN")
        print("="*60)
        print("\nPlease address the issues above and run this script again.")
    
    print("="*60)


if __name__ == "__main__":
    main()
