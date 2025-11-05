"""AI Chatbot/RAG API endpoints."""
from fastapi import APIRouter, HTTPException, Body
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import joblib
from typing import List, Dict, Any
import json

from ..db import db
from ..config import settings
from ..schemas import ChatQuery, ChatResponse, ChatDocument

router = APIRouter(prefix="/chat", tags=["chatbot"])

# Global models and indices
_embedding_model = None
_faiss_index = None
_documents = []


def load_embedding_model():
    """Load sentence transformer model for embeddings."""
    global _embedding_model
    
    if _embedding_model is None:
        try:
            # Try to load the model with reduced memory usage
            _embedding_model = SentenceTransformer(
                settings.embedding_model,
                device='cpu'  # Force CPU to avoid GPU memory issues
            )
            print("✓ Embedding model loaded")
        except Exception as e:
            print(f"⚠ Failed to load embedding model: {e}")
            print("  Chatbot will be unavailable. This is optional.")
            _embedding_model = None


def build_vector_index():
    """Build FAISS index from product documents."""
    global _faiss_index, _documents
    
    index_path = settings.vector_index_dir / "faiss_index.bin"
    docs_path = settings.vector_index_dir / "documents.pkl"
    
    # Try to load existing index
    if index_path.exists() and docs_path.exists():
        try:
            _faiss_index = faiss.read_index(str(index_path))
            _documents = joblib.load(docs_path)
            return
        except Exception as e:
            print(f"Failed to load existing index: {e}")
    
    # Build new index
    if _embedding_model is None:
        load_embedding_model()
    
    if _embedding_model is None:
        return
    
    # Get product documents
    _documents = db.get_product_documents()
    
    if not _documents:
        return
    
    # Create embeddings
    texts = [doc['text'] for doc in _documents]
    embeddings = _embedding_model.encode(texts, show_progress_bar=False)
    
    # Build FAISS index
    dimension = embeddings.shape[1]
    _faiss_index = faiss.IndexFlatL2(dimension)
    _faiss_index.add(embeddings.astype('float32'))
    
    # Save index
    faiss.write_index(_faiss_index, str(index_path))
    joblib.dump(_documents, docs_path)


def search_documents(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Search for relevant documents using semantic search.
    
    Args:
        query: Search query
        top_k: Number of documents to return
        
    Returns:
        List of relevant documents with scores
    """
    if _embedding_model is None or _faiss_index is None or not _documents:
        return []
    
    # Encode query
    query_embedding = _embedding_model.encode([query], show_progress_bar=False)
    
    # Search
    distances, indices = _faiss_index.search(query_embedding.astype('float32'), top_k)
    
    results = []
    for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
        if idx < len(_documents):
            doc = _documents[idx].copy()
            # Convert L2 distance to similarity score (0-1)
            score = 1 / (1 + dist)
            doc['score'] = float(score)
            results.append(doc)
    
    return results


def generate_response(query: str, documents: List[Dict[str, Any]]) -> str:
    """
    Generate response based on retrieved documents.
    
    This is a simple template-based response. In production,
    you would use an LLM (GPT, Claude, etc.) for better responses.
    
    Args:
        query: User query
        documents: Retrieved documents
        
    Returns:
        Generated response
    """
    if not documents:
        return (
            "I couldn't find specific information about that. "
            "Could you please rephrase your question or ask about our available products?"
        )
    
    # Simple keyword-based response generation
    query_lower = query.lower()
    
    # Price queries
    if any(word in query_lower for word in ['price', 'cost', 'how much']):
        top_doc = documents[0]
        return (
            f"The {top_doc['name']} is priced at ₹{top_doc['price']} per {top_doc['unit']}. "
            f"{top_doc['description'][:100]}... "
            f"It's available in the {top_doc['category']} category."
        )
    
    # Availability queries
    if any(word in query_lower for word in ['available', 'stock', 'have']):
        products = [doc['name'] for doc in documents[:3]]
        return (
            f"Yes, we have several products available including: {', '.join(products)}. "
            "Would you like to know more about any specific product?"
        )
    
    # Category queries
    if any(word in query_lower for word in ['category', 'type', 'kind']):
        categories = list(set(doc['category'] for doc in documents if doc['category']))
        if categories:
            return (
                f"We have products in the following categories: {', '.join(categories[:5])}. "
                "What type of product are you looking for?"
            )
    
    # Farmer queries
    if any(word in query_lower for word in ['farmer', 'seller', 'who sells']):
        top_doc = documents[0]
        return (
            f"The {top_doc['name']} is sold by {top_doc['farmer_name']}. "
            f"It's priced at ₹{top_doc['price']} per {top_doc['unit']}."
        )
    
    # General product information
    top_doc = documents[0]
    response = f"I found information about {top_doc['name']}. "
    
    if top_doc['description']:
        response += f"{top_doc['description'][:150]}... "
    
    response += (
        f"It's available at ₹{top_doc['price']} per {top_doc['unit']} "
        f"in the {top_doc['category']} category."
    )
    
    if len(documents) > 1:
        response += f" We also have {len(documents) - 1} other similar products available."
    
    return response


@router.post("/query", response_model=ChatResponse)
async def chat_query(query: ChatQuery = Body(...)):
    """
    Process a chat query and return AI-generated response.
    
    Uses semantic search (RAG) to find relevant product information
    and generates a contextual response.
    """
    try:
        # Ensure models are loaded
        if _embedding_model is None:
            load_embedding_model()
        
        if _faiss_index is None:
            build_vector_index()
        
        if _embedding_model is None or _faiss_index is None:
            raise HTTPException(
                status_code=503,
                detail="Chat service not ready. Please try again later."
            )
        
        # Search for relevant documents
        top_k = settings.top_k_docs
        relevant_docs = search_documents(query.query, top_k)
        
        # Generate response
        answer = generate_response(query.query, relevant_docs)
        
        # Calculate confidence based on top document score
        confidence = relevant_docs[0]['score'] if relevant_docs else 0.0
        
        # Convert to response format
        chat_docs = [
            ChatDocument(
                id=doc['id'],
                text=doc['text'][:settings.max_context_length],
                score=doc['score'],
                metadata={
                    'name': doc['name'],
                    'price': doc['price'],
                    'category': doc['category']
                }
            )
            for doc in relevant_docs
        ]
        
        return ChatResponse(
            query=query.query,
            answer=answer,
            documents=chat_docs,
            confidence=confidence
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/refresh-index")
async def refresh_vector_index():
    """
    Refresh the vector index with latest product data.
    
    Call this after adding/updating products to ensure
    the chatbot has the latest information.
    """
    try:
        build_vector_index()
        return {
            "status": "success",
            "message": "Vector index refreshed",
            "num_documents": len(_documents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Index refresh error: {str(e)}")


@router.get("/suggestions")
async def get_query_suggestions():
    """
    Get sample queries users can ask.
    """
    suggestions = [
        "What vegetables are available?",
        "Show me organic products",
        "What is the price of tomatoes?",
        "Do you have fresh fruits?",
        "What products does [farmer name] sell?",
        "Show me products under ₹100",
        "What's in the dairy category?",
        "Tell me about seasonal vegetables"
    ]
    
    return {
        "suggestions": suggestions
    }


# Initialize on module load
load_embedding_model()
build_vector_index()
