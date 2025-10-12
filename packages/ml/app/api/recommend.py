"""Recommendation API endpoints with ALS + TF-IDF hybrid approach."""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List, Dict, Tuple
from functools import lru_cache
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import json

from ..db import db
from ..config import settings
from ..schemas import RecommendationResponse, RecommendationItem, RecommendationRequest

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

# Global cache for models
_als_model = None
_tfidf_data = None
_mappings = None
_cache = {}
_cache_ttl = 3600  # 1 hour TTL


def load_models():
    """Load trained ALS and TF-IDF models."""
    global _als_model, _tfidf_data, _mappings
    
    # Load ALS model
    als_path = settings.model_dir / "als_model.joblib"
    if als_path.exists():
        try:
            _als_model = joblib.load(als_path)
            print("✓ ALS model loaded")
        except Exception as e:
            print(f"Failed to load ALS model: {e}")
            _als_model = None
    else:
        print("ALS model not found")
        _als_model = None
    
    # Load TF-IDF model
    tfidf_path = settings.model_dir / "tfidf.joblib"
    if tfidf_path.exists():
        try:
            _tfidf_data = joblib.load(tfidf_path)
            print("✓ TF-IDF model loaded")
        except Exception as e:
            print(f"Failed to load TF-IDF model: {e}")
            _tfidf_data = None
    else:
        print("TF-IDF model not found")
        _tfidf_data = None
    
    # Load mappings
    mappings_path = settings.model_dir / "mappings.json"
    if mappings_path.exists():
        try:
            with open(mappings_path, 'r') as f:
                _mappings = json.load(f)
            print("✓ Mappings loaded")
        except Exception as e:
            print(f"Failed to load mappings: {e}")
            _mappings = None
    else:
        print("Mappings not found")
        _mappings = None


def get_collaborative_recommendations(user_id: str, top_k: int) -> List[Tuple[str, float, List[str]]]:
    """
    Get recommendations using collaborative filtering (ALS).
    
    Args:
        user_id: User ID
        top_k: Number of recommendations
        
    Returns:
        List of (product_id, score, reasons)
    """
    if _als_model is None or _mappings is None:
        return []
    
    # Check if user exists in training data
    if user_id not in _mappings['user_index']:
        return []
    
    user_idx = _mappings['user_index'][user_id]
    
    try:
        # Get user's purchase history to filter
        user_orders = db.get_user_order_history(user_id)
        purchased_products = set(user_orders['product_id'].tolist()) if not user_orders.empty else set()
        
        # Get recommendations from ALS
        # Note: We need to reconstruct user vector or use similar_items
        # For simplicity, we'll use item-item similarity
        
        # Get top N recommendations
        recommended_items = []
        index_to_item = _mappings['index_to_item']
        
        # Get user's top items
        if not user_orders.empty:
            top_user_items = user_orders.head(5)['product_id'].tolist()
            
            for item_id in top_user_items:
                if item_id in _mappings['item_index']:
                    item_idx = _mappings['item_index'][item_id]
                    
                    # Get similar items
                    try:
                        similar_ids, scores = _als_model.similar_items(item_idx, N=top_k + 10)
                        
                        for sim_idx, score in zip(similar_ids, scores):
                            sim_product_id = index_to_item[str(sim_idx)]
                            
                            # Filter out already purchased
                            if sim_product_id not in purchased_products:
                                recommended_items.append((sim_product_id, float(score), ['cf']))
                    except Exception as e:
                        print(f"Error getting similar items: {e}")
                        continue
        
        # Deduplicate and sort
        seen = set()
        unique_recs = []
        for prod_id, score, reasons in sorted(recommended_items, key=lambda x: x[1], reverse=True):
            if prod_id not in seen:
                seen.add(prod_id)
                unique_recs.append((prod_id, score, reasons))
                if len(unique_recs) >= top_k:
                    break
        
        return unique_recs
    
    except Exception as e:
        print(f"Collaborative filtering error: {e}")
        return []


def get_content_based_recommendations(user_id: str, top_k: int) -> List[Tuple[str, float, List[str]]]:
    """
    Get recommendations using content-based filtering (TF-IDF).
    
    Args:
        user_id: User ID
        top_k: Number of recommendations
        
    Returns:
        List of (product_id, score, reasons)
    """
    if _tfidf_data is None:
        return []
    
    try:
        vectorizer = _tfidf_data['vectorizer']
        tfidf_matrix = _tfidf_data['matrix']
        products_df = _tfidf_data['products']
        
        # Get user's purchase/view history
        user_orders = db.get_user_order_history(user_id)
        user_views = db.get_user_view_events(user_id, days=30)
        
        # Combine purchased and viewed products
        user_products = set()
        if not user_orders.empty:
            user_products.update(user_orders['product_id'].tolist())
        if not user_views.empty:
            user_products.update(user_views['product_id'].tolist())
        
        if not user_products:
            return []
        
        # Get indices of user's products
        user_product_indices = []
        for prod_id in user_products:
            idx_list = products_df.index[products_df['id'] == prod_id].tolist()
            if idx_list:
                user_product_indices.append(idx_list[0])
        
        if not user_product_indices:
            return []
        
        # Create user profile by averaging TF-IDF vectors of user's products
        user_profile = tfidf_matrix[user_product_indices].mean(axis=0)
        
        # Calculate cosine similarity with all products
        similarities = cosine_similarity(user_profile, tfidf_matrix).flatten()
        
        # Get top N similar products (excluding already interacted)
        recommendations = []
        for idx in similarities.argsort()[::-1]:
            product_id = products_df.iloc[idx]['id']
            
            # Skip if already purchased/viewed
            if product_id in user_products:
                continue
            
            score = float(similarities[idx])
            recommendations.append((product_id, score, ['cb']))
            
            if len(recommendations) >= top_k:
                break
        
        return recommendations
    
    except Exception as e:
        print(f"Content-based filtering error: {e}")
        return []


def get_hybrid_recommendations(user_id: str, top_k: int, cf_weight: float = 0.7, cb_weight: float = 0.3) -> List[Tuple[str, float, List[str]]]:
    """
    Get hybrid recommendations combining collaborative and content-based filtering.
    
    Args:
        user_id: User ID
        top_k: Number of recommendations
        cf_weight: Weight for collaborative filtering (default 0.7)
        cb_weight: Weight for content-based filtering (default 0.3)
        
    Returns:
        List of (product_id, score, reasons)
    """
    # Get recommendations from both methods
    cf_recs = get_collaborative_recommendations(user_id, top_k * 2)
    cb_recs = get_content_based_recommendations(user_id, top_k * 2)
    
    # Combine scores
    combined_scores = {}
    combined_reasons = {}
    
    # Add CF recommendations
    for prod_id, score, reasons in cf_recs:
        combined_scores[prod_id] = score * cf_weight
        combined_reasons[prod_id] = set(reasons)
    
    # Add CB recommendations
    for prod_id, score, reasons in cb_recs:
        if prod_id in combined_scores:
            combined_scores[prod_id] += score * cb_weight
            combined_reasons[prod_id].update(reasons)
            combined_reasons[prod_id].add('hybrid')
        else:
            combined_scores[prod_id] = score * cb_weight
            combined_reasons[prod_id] = set(reasons)
    
    # Sort by combined score
    sorted_recs = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Format results
    results = [
        (prod_id, score, list(combined_reasons[prod_id]))
        for prod_id, score in sorted_recs[:top_k]
    ]
    
    return results


def get_cold_start_recommendations(user_id: str, top_k: int) -> List[Tuple[str, float, List[str]]]:
    """
    Get recommendations for cold-start users (no history).
    
    Uses top-selling products.
    
    Args:
        user_id: User ID
        top_k: Number of recommendations
        
    Returns:
        List of (product_id, score, reasons)
    """
    try:
        top_products = db.get_top_selling_products(limit=top_k)
        
        # Assign decreasing scores
        results = []
        for i, prod_id in enumerate(top_products):
            score = 1.0 - (i / len(top_products)) * 0.5  # Score from 1.0 to 0.5
            results.append((prod_id, score, ['popular']))
        
        return results
    
    except Exception as e:
        print(f"Cold-start recommendations error: {e}")
        return []


def get_cached_recommendations(user_id: str, top_k: int) -> Optional[List[Tuple[str, float, List[str]]]]:
    """Get recommendations from cache if available and not expired."""
    cache_key = f"{user_id}:{top_k}"
    
    if cache_key in _cache:
        cached_data, timestamp = _cache[cache_key]
        
        # Check if cache is still valid
        if (datetime.now() - timestamp).total_seconds() < _cache_ttl:
            return cached_data
        else:
            # Remove expired cache
            del _cache[cache_key]
    
    return None


def set_cached_recommendations(user_id: str, top_k: int, recommendations: List[Tuple[str, float, List[str]]]):
    """Store recommendations in cache."""
    cache_key = f"{user_id}:{top_k}"
    _cache[cache_key] = (recommendations, datetime.now())
    
    # Simple cache cleanup: remove old entries if cache is too large
    if len(_cache) > 1000:
        # Remove oldest 20% of entries
        sorted_cache = sorted(_cache.items(), key=lambda x: x[1][1])
        for key, _ in sorted_cache[:200]:
            del _cache[key]


@router.get("/user/{user_id}", response_model=RecommendationResponse)
async def get_user_recommendations(
    user_id: str,
    top_k: int = Query(default=20, ge=1, le=100, description="Number of recommendations")
):
    """
    Get personalized recommendations for a user.
    
    Uses hybrid approach:
    1. Collaborative filtering (ALS) - 70% weight
    2. Content-based filtering (TF-IDF) - 30% weight
    3. Falls back to popular products for cold-start users
    
    Results are cached for 1 hour.
    """
    try:
        # Check cache first
        cached_recs = get_cached_recommendations(user_id, top_k)
        if cached_recs is not None:
            items = [
                RecommendationItem(product_id=prod_id, score=score, reason=reasons)
                for prod_id, score, reasons in cached_recs
            ]
            return RecommendationResponse(
                user_id=user_id,
                items=items,
                method="hybrid (cached)"
            )
        
        # Check if user has any history
        user_orders = db.get_user_order_history(user_id)
        user_views = db.get_user_view_events(user_id, days=30)
        
        has_history = (not user_orders.empty) or (not user_views.empty)
        
        if has_history:
            # Try hybrid recommendations
            recommendations = get_hybrid_recommendations(user_id, top_k)
            method = "hybrid"
            
            # If hybrid didn't produce enough results, try individual methods
            if len(recommendations) < top_k // 2:
                cf_recs = get_collaborative_recommendations(user_id, top_k)
                cb_recs = get_content_based_recommendations(user_id, top_k)
                
                if cf_recs:
                    recommendations = cf_recs
                    method = "collaborative"
                elif cb_recs:
                    recommendations = cb_recs
                    method = "content-based"
        else:
            # Cold-start: use popular products
            recommendations = get_cold_start_recommendations(user_id, top_k)
            method = "popular (cold-start)"
        
        # If still no recommendations, return empty
        if not recommendations:
            recommendations = get_cold_start_recommendations(user_id, top_k)
            method = "popular (fallback)"
        
        # Cache results
        set_cached_recommendations(user_id, top_k, recommendations)
        
        # Format response
        items = [
            RecommendationItem(product_id=prod_id, score=score, reason=reasons)
            for prod_id, score, reasons in recommendations
        ]
        
        return RecommendationResponse(
            user_id=user_id,
            items=items,
            method=method
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


@router.get("/product/{product_id}", response_model=RecommendationResponse)
async def get_similar_products(
    product_id: str,
    top_k: int = Query(default=20, ge=1, le=100, description="Number of recommendations")
):
    """
    Get similar products based on content similarity.
    
    Uses TF-IDF cosine similarity on product descriptions.
    """
    try:
        if _tfidf_data is None:
            raise HTTPException(status_code=503, detail="TF-IDF model not loaded")
        
        vectorizer = _tfidf_data['vectorizer']
        tfidf_matrix = _tfidf_data['matrix']
        products_df = _tfidf_data['products']
        
        # Find product index
        idx_list = products_df.index[products_df['id'] == product_id].tolist()
        if not idx_list:
            raise HTTPException(status_code=404, detail="Product not found")
        
        idx = idx_list[0]
        
        # Calculate similarities
        similarities = cosine_similarity(tfidf_matrix[idx:idx+1], tfidf_matrix).flatten()
        
        # Get top N (excluding the product itself)
        recommendations = []
        for sim_idx in similarities.argsort()[::-1]:
            if sim_idx == idx:
                continue
            
            prod_id = products_df.iloc[sim_idx]['id']
            score = float(similarities[sim_idx])
            recommendations.append((prod_id, score, ['cb']))
            
            if len(recommendations) >= top_k:
                break
        
        items = [
            RecommendationItem(product_id=prod_id, score=score, reason=reasons)
            for prod_id, score, reasons in recommendations
        ]
        
        return RecommendationResponse(
            user_id=product_id,  # Using product_id as identifier
            items=items,
            method="content-based"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


@router.post("/refresh")
async def refresh_recommendations():
    """
    Refresh recommendation models and clear cache.
    
    Call this after retraining models or when product catalog changes.
    """
    try:
        global _cache
        
        # Clear cache
        _cache = {}
        
        # Reload models
        load_models()
        
        return {
            "status": "success",
            "message": "Recommendation models refreshed and cache cleared",
            "models_loaded": {
                "als": _als_model is not None,
                "tfidf": _tfidf_data is not None,
                "mappings": _mappings is not None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh error: {str(e)}")


@router.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics."""
    return {
        "cache_size": len(_cache),
        "cache_ttl_seconds": _cache_ttl,
        "models_loaded": {
            "als": _als_model is not None,
            "tfidf": _tfidf_data is not None,
            "mappings": _mappings is not None
        }
    }


# Initialize models on module load
load_models()
