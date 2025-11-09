"""Training script for recommendation models with ALS + TF-IDF hybrid approach."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from implicit.als import AlternatingLeastSquares
from scipy.sparse import csr_matrix
import joblib

from app.db import db
from app.config import settings


def build_user_item_matrix():
    """
    Build user-item interaction matrix from orders.
    
    Returns:
        Tuple of (sparse_matrix, user_map, item_map, user_ids, item_ids)
    """
    print("\nBuilding user-item matrix from orders...")
    
    # Get all orders
    orders_df = db.get_all_orders()
    
    if orders_df.empty:
        print("No orders found!")
        return None, None, None, None, None
    
    print(f"Found {len(orders_df)} order items")
    
    # Convert quantity to implicit feedback weight
    # Higher quantity = stronger preference
    orders_df['weight'] = orders_df['quantity'].apply(lambda x: min(x, 10))  # Cap at 10
    
    # Aggregate by user-product pairs
    interactions = orders_df.groupby(['user_id', 'product_id'])['weight'].sum().reset_index()
    
    print(f"Unique users: {interactions['user_id'].nunique()}")
    print(f"Unique products: {interactions['product_id'].nunique()}")
    print(f"Total interactions: {len(interactions)}")
    
    # Create mappings
    user_ids = sorted(interactions['user_id'].unique())
    item_ids = sorted(interactions['product_id'].unique())
    
    user_index = {uid: idx for idx, uid in enumerate(user_ids)}
    item_index = {pid: idx for idx, pid in enumerate(item_ids)}
    
    # Build sparse matrix
    rows = interactions['user_id'].map(user_index).values
    cols = interactions['product_id'].map(item_index).values
    data = interactions['weight'].values
    
    sparse_matrix = csr_matrix(
        (data, (rows, cols)),
        shape=(len(user_ids), len(item_ids))
    )
    
    sparsity = 1 - (sparse_matrix.nnz / (sparse_matrix.shape[0] * sparse_matrix.shape[1]))
    print(f"Matrix shape: {sparse_matrix.shape}")
    print(f"Sparsity: {sparsity:.4f}")
    
    return sparse_matrix, user_index, item_index, user_ids, item_ids


def train_als_model(user_item_matrix, factors=64, regularization=0.01, iterations=20):
    """
    Train ALS collaborative filtering model.
    
    Args:
        user_item_matrix: Sparse user-item matrix
        factors: Number of latent factors
        regularization: Regularization parameter
        iterations: Number of training iterations
        
    Returns:
        Trained ALS model
    """
    print(f"\nTraining ALS model...")
    print(f"  Factors: {factors}")
    print(f"  Regularization: {regularization}")
    print(f"  Iterations: {iterations}")
    
    model = AlternatingLeastSquares(
        factors=factors,
        regularization=regularization,
        iterations=iterations,
        calculate_training_loss=True,
        random_state=42
    )
    
    # Train model
    model.fit(user_item_matrix, show_progress=True)
    
    print("✓ ALS model trained successfully")
    
    return model


def train_content_based_model():
    """
    Train content-based model using TF-IDF on product title + description.
    
    Returns:
        Tuple of (tfidf_vectorizer, product_vectors, products_df)
    """
    print("\nTraining content-based model (TF-IDF)...")
    
    # Get all products
    products_df = db.get_products()
    
    if products_df.empty:
        print("No products found!")
        return None, None, None
    
    print(f"Found {len(products_df)} products")
    
    # Create text features from title + description
    products_df['text'] = (
        products_df['title'].fillna('') + ' ' + 
        products_df['description'].fillna('') + ' ' + 
        products_df['category'].fillna('')
    )
    
    # Train TF-IDF vectorizer
    n_docs = len(products_df)
    # For very small document sets, sklearn's min_df/max_df can conflict
    # (e.g. min_df=1 and max_df=0.95 with a single document). Choose
    # conservative values based on document count to avoid ValueError.
    # Also scale min_df dynamically for medium/large corpora using a
    # fractional heuristic so that extremely rare tokens are ignored.
    if n_docs <= 1:
        tfidf_min_df = 1
        tfidf_max_df = 1.0
    else:
        # For small corpora increase max_df to avoid removing terms that
        # appear in all documents (common in small synthetic datasets).
        if n_docs < 10:
            tfidf_max_df = 1.0
        else:
            tfidf_max_df = 0.95

        # Dynamic min_df heuristics:
        #  - tiny corpora (<10): keep min_df=1
        #  - small (10-99): remove tokens appearing in <2% of docs
        #  - medium (100-999): remove tokens appearing in <1% of docs
        #  - large (>=1000): remove tokens appearing in <0.5% of docs
        if n_docs < 10:
            tfidf_min_df = 1
        elif n_docs < 100:
            tfidf_min_df = max(1, int(n_docs * 0.02))
        elif n_docs < 1000:
            tfidf_min_df = max(1, int(n_docs * 0.01))
        else:
            tfidf_min_df = max(1, int(n_docs * 0.005))

    tfidf = TfidfVectorizer(
        stop_words='english',
        max_features=settings.tfidf_max_features,
        ngram_range=(1, 2),
        min_df=tfidf_min_df,
        max_df=tfidf_max_df
    )

    tfidf_matrix = tfidf.fit_transform(products_df['text'].values)
    
    print(f"✓ TF-IDF model trained")
    print(f"  Vocabulary size: {len(tfidf.vocabulary_)}")
    print(f"  Feature matrix shape: {tfidf_matrix.shape}")
    
    return tfidf, tfidf_matrix, products_df


def save_models(als_model, user_index, item_index, user_ids, item_ids, 
                tfidf_model, tfidf_matrix, products_df):
    """
    Save all trained models and mappings.
    
    Args:
        als_model: Trained ALS model
        user_index: User ID to index mapping
        item_index: Item ID to index mapping
        user_ids: List of user IDs
        item_ids: List of item IDs
        tfidf_model: Trained TF-IDF vectorizer
        tfidf_matrix: TF-IDF feature matrix
        products_df: Products dataframe
    """
    print("\nSaving models...")
    
    # Save ALS model
    als_path = settings.model_dir / "als_model.joblib"
    joblib.dump(als_model, als_path)
    print(f"✓ ALS model saved to {als_path}")
    
    # Save TF-IDF model
    tfidf_path = settings.model_dir / "tfidf.joblib"
    joblib.dump({
        'vectorizer': tfidf_model,
        'matrix': tfidf_matrix,
        'products': products_df[['id', 'title', 'description', 'category', 'text']]
    }, tfidf_path)
    print(f"✓ TF-IDF model saved to {tfidf_path}")
    
    # Save mappings as JSON
    mappings_path = settings.model_dir / "mappings.json"
    mappings = {
        'user_index': user_index,
        'item_index': item_index,
        'user_ids': user_ids,
        'item_ids': item_ids,
        'index_to_user': {str(idx): uid for uid, idx in user_index.items()},
        'index_to_item': {str(idx): iid for iid, idx in item_index.items()}
    }
    
    with open(mappings_path, 'w') as f:
        json.dump(mappings, f, indent=2)
    print(f"✓ Mappings saved to {mappings_path}")
    
    # Save user-item matrix for later use
    matrix_path = settings.model_dir / "user_item_matrix.joblib"
    joblib.dump({
        'matrix': None,  # Don't save the full matrix to save space
        'shape': (len(user_ids), len(item_ids)),
        'nnz': 0
    }, matrix_path)
    print(f"✓ Matrix metadata saved to {matrix_path}")


def evaluate_models(als_model, user_item_matrix, user_index, item_index):
    """
    Evaluate trained models with sample recommendations.
    
    Args:
        als_model: Trained ALS model
        user_item_matrix: User-item interaction matrix
        user_index: User ID to index mapping
        item_index: Item ID to index mapping
    """
    print("\nEvaluating models...")
    
    if not user_index:
        print("No users to evaluate")
        return
    
    # Get a sample user
    sample_user_id = list(user_index.keys())[0]
    sample_user_idx = user_index[sample_user_id]
    
    print(f"\nSample recommendations for user {sample_user_id}:")
    
    try:
        # Get recommendations
        ids, scores = als_model.recommend(
            sample_user_idx,
            user_item_matrix[sample_user_idx],
            N=10,
            filter_already_liked_items=True
        )
        
        # Map back to product IDs
        index_to_item = {idx: iid for iid, idx in item_index.items()}
        
        for idx, score in zip(ids, scores):
            product_id = index_to_item[idx]
            print(f"  Product {product_id}: score {score:.4f}")
        
        print("\n✓ Model evaluation complete")
        
    except Exception as e:
        print(f"✗ Evaluation failed: {e}")


def main():
    """Main training function."""
    print("=" * 70)
    print("TRAINING RECOMMENDATION MODELS (ALS + TF-IDF HYBRID)")
    print("=" * 70)
    
    # Step 1: Build user-item matrix
    user_item_matrix, user_index, item_index, user_ids, item_ids = build_user_item_matrix()
    
    if user_item_matrix is None:
        print("\n✗ Cannot train collaborative filtering without order data")
        als_model = None
    else:
        # Step 2: Train ALS model
        als_model = train_als_model(
            user_item_matrix,
            factors=64,
            regularization=0.01,
            iterations=20
        )
    
    # Step 3: Train content-based model
    tfidf_model, tfidf_matrix, products_df = train_content_based_model()
    
    if tfidf_model is None:
        print("\n✗ Cannot train content-based model without product data")
        return
    
    # Step 4: Save models
    if als_model is not None:
        save_models(
            als_model, user_index, item_index, user_ids, item_ids,
            tfidf_model, tfidf_matrix, products_df
        )
        
        # Step 5: Evaluate
        evaluate_models(als_model, user_item_matrix, user_index, item_index)
    else:
        # Save only content-based model
        tfidf_path = settings.model_dir / "tfidf.joblib"
        joblib.dump({
            'vectorizer': tfidf_model,
            'matrix': tfidf_matrix,
            'products': products_df[['id', 'title', 'description', 'category', 'text']]
        }, tfidf_path)
        print(f"✓ TF-IDF model saved to {tfidf_path}")
    
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Start the ML service: python -m app.main")
    print("2. Test recommendations: curl http://localhost:8000/recommendations/user/{user_id}")
    print("=" * 70)


if __name__ == "__main__":
    main()


def train_content_based():
    """Compatibility wrapper: train and save only the content-based TF-IDF model."""
    tfidf_model, tfidf_matrix, products_df = train_content_based_model()
    if tfidf_model is None:
        print("✗ Cannot train content-based model without product data")
        return

    tfidf_path = settings.model_dir / "tfidf.joblib"
    joblib.dump({
        'vectorizer': tfidf_model,
        'matrix': tfidf_matrix,
        'products': products_df[['id', 'title', 'description', 'category', 'text']]
    }, tfidf_path)
    print(f"✓ TF-IDF model saved to {tfidf_path}")


def train_collaborative():
    """Compatibility wrapper: build user-item matrix, train ALS and save mappings.

    This mirrors the collaborative portion of the original training flow so
    callers that expect `train_collaborative()` (for example `train_all.py`)
    will continue to work.
    """
    user_item_matrix, user_index, item_index, user_ids, item_ids = build_user_item_matrix()
    if user_item_matrix is None:
        print("✗ Cannot train collaborative filtering without order data")
        return

    als_model = train_als_model(user_item_matrix, factors=64, regularization=0.01, iterations=20)

    # Save ALS model
    als_path = settings.model_dir / "als_model.joblib"
    joblib.dump(als_model, als_path)
    print(f"✓ ALS model saved to {als_path}")

    # Save mappings as JSON
    mappings_path = settings.model_dir / "mappings.json"
    mappings = {
        'user_index': user_index,
        'item_index': item_index,
        'user_ids': user_ids,
        'item_ids': item_ids,
        'index_to_user': {str(idx): uid for uid, idx in user_index.items()},
        'index_to_item': {str(idx): iid for iid, idx in item_index.items()}
    }

    with open(mappings_path, 'w') as f:
        json.dump(mappings, f, indent=2)
    print(f"✓ Mappings saved to {mappings_path}")

    # Save matrix metadata
    matrix_path = settings.model_dir / "user_item_matrix.joblib"
    joblib.dump({
        'matrix': None,
        'shape': (len(user_ids), len(item_ids)),
        'nnz': user_item_matrix.nnz
    }, matrix_path)
    print(f"✓ Matrix metadata saved to {matrix_path}")
