"""Enhanced RAG-enabled chatbot API with semantic search and LLM integration."""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import json
from datetime import datetime
import hashlib

from ..db import db
from ..config import settings

router = APIRouter(prefix="/chat", tags=["chatbot"])


# Schemas
class ChatQuery(BaseModel):
    """Chat query request."""
    user_id: Optional[str] = Field(default=None, description="User ID (anonymized)")
    query: str = Field(..., min_length=1, max_length=500, description="User query")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of documents to retrieve")
    use_llm: bool = Field(default=False, description="Use LLM for answer generation")


class RetrievedDocument(BaseModel):
    """Retrieved document from vector search."""
    doc_id: str
    text: str
    score: float
    metadata: Dict[str, Any]


class ChatResponse(BaseModel):
    """Chat response."""
    query: str
    answer: str
    retrieved_documents: List[RetrievedDocument]
    method: str
    confidence: float
    response_time_ms: float


# Global cache
_embedding_model = None
_faiss_index = None
_documents = []
_model_loaded = False


def load_vector_store():
    """Load FAISS index and document mappings."""
    global _embedding_model, _faiss_index, _documents, _model_loaded
    
    if _model_loaded:
        return
    
    try:
        # Load embedding model
        print(f"Loading embedding model: {settings.embedding_model}")
        _embedding_model = SentenceTransformer(settings.embedding_model)
        
        # Load FAISS index
        index_path = settings.vector_index_dir / "faiss.index"
        if not index_path.exists():
            raise FileNotFoundError(f"FAISS index not found at {index_path}. Run build_vector_store.py first.")
        
        _faiss_index = faiss.read_index(str(index_path))
        print(f"  ✓ Loaded FAISS index with {_faiss_index.ntotal} vectors")
        
        # Load document mappings
        mappings_path = settings.vector_index_dir / "doc_mappings.json"
        if not mappings_path.exists():
            raise FileNotFoundError(f"Document mappings not found at {mappings_path}")
        
        with open(mappings_path, 'r') as f:
            mappings = json.load(f)
        
        _documents = mappings['documents']
        print(f"  ✓ Loaded {len(_documents)} document mappings")
        
        _model_loaded = True
        
    except Exception as e:
        print(f"Failed to load vector store: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Vector store not available. Please run build_vector_store.py first. Error: {str(e)}"
        )


def semantic_search(query: str, top_k: int = 5) -> List[Dict]:
    """
    Perform semantic search using FAISS.
    
    Args:
        query: User query
        top_k: Number of results to return
        
    Returns:
        List of retrieved documents with scores
    """
    if _embedding_model is None or _faiss_index is None:
        load_vector_store()
    
    # Embed query
    query_embedding = _embedding_model.encode([query], convert_to_numpy=True)
    
    # Normalize for cosine similarity
    faiss.normalize_L2(query_embedding)
    
    # Search
    scores, indices = _faiss_index.search(query_embedding, top_k)
    
    # Prepare results
    results = []
    for idx, score in zip(indices[0], scores[0]):
        if idx < len(_documents):
            doc = _documents[idx]
            results.append({
                'doc_id': doc['doc_id'],
                'text': doc['text'],
                'score': float(score),
                'metadata': doc['metadata']
            })
    
    return results


def generate_template_answer(query: str, retrieved_docs: List[Dict]) -> tuple:
    """
    Generate answer using template-based approach.
    
    Args:
        query: User query
        retrieved_docs: Retrieved documents
        
    Returns:
        Tuple of (answer, confidence)
    """
    if not retrieved_docs:
        return "I couldn't find relevant information to answer your question. Please try rephrasing or contact customer support.", 0.0
    
    # Get top document
    top_doc = retrieved_docs[0]
    top_score = top_doc['score']
    
    # Determine confidence based on score
    if top_score > 0.7:
        confidence = 0.9
    elif top_score > 0.5:
        confidence = 0.7
    else:
        confidence = 0.5
    
    # Generate answer based on document type
    doc_type = top_doc['metadata'].get('type', 'unknown')
    
    if doc_type == 'faq':
        # Extract answer from FAQ
        answer = top_doc['metadata'].get('answer', top_doc['text'])
        
        # Add sources if multiple relevant docs
        if len(retrieved_docs) > 1 and retrieved_docs[1]['score'] > 0.5:
            answer += "\n\nRelated information:"
            for i, doc in enumerate(retrieved_docs[1:3], 1):
                if doc['metadata'].get('type') == 'faq':
                    question = doc['metadata'].get('question', '')
                    if question:
                        answer += f"\n  • {question}"
    
    elif doc_type == 'product':
        # Product-related query
        product_title = top_doc['metadata'].get('title', 'this product')
        category = top_doc['metadata'].get('category', '')
        
        answer = f"Regarding {product_title}"
        if category:
            answer += f" ({category})"
        answer += f": {top_doc['text']}"
        
        # Add related products
        related_products = [
            doc for doc in retrieved_docs[1:4]
            if doc['metadata'].get('type') == 'product' and doc['score'] > 0.5
        ]
        
        if related_products:
            answer += "\n\nYou might also be interested in:"
            for doc in related_products:
                title = doc['metadata'].get('title', 'Unknown')
                answer += f"\n  • {title}"
    
    elif doc_type == 'help':
        # Help article
        title = top_doc['metadata'].get('title', '')
        answer = f"{title}: {top_doc['text']}"
    
    else:
        # Generic answer
        answer = top_doc['text']
    
    # Add disclaimer for low confidence
    if confidence < 0.6:
        answer += "\n\nNote: I'm not very confident about this answer. Please contact customer support for more accurate information."
    
    return answer, confidence


def generate_llm_answer(query: str, retrieved_docs: List[Dict]) -> tuple:
    """
    Generate answer using LLM (OpenAI or local).
    
    This is a placeholder/hook for LLM integration.
    
    Args:
        query: User query
        retrieved_docs: Retrieved documents
        
    Returns:
        Tuple of (answer, confidence)
    """
    # TODO: Implement LLM integration
    # Options:
    # 1. OpenAI API:
    #    import openai
    #    openai.api_key = settings.openai_api_key
    #    response = openai.ChatCompletion.create(...)
    #
    # 2. Local LLM (e.g., llama.cpp, GPT4All):
    #    from llama_cpp import Llama
    #    llm = Llama(model_path="...")
    #    response = llm(prompt)
    #
    # 3. HuggingFace Transformers:
    #    from transformers import pipeline
    #    generator = pipeline('text-generation', model='...')
    #    response = generator(prompt)
    
    # For now, fall back to template-based
    print("⚠️  LLM integration not implemented. Using template-based answer.")
    return generate_template_answer(query, retrieved_docs)


def anonymize_user_id(user_id: str) -> str:
    """
    Anonymize user ID for logging.
    
    Args:
        user_id: Original user ID
        
    Returns:
        Anonymized hash
    """
    if not user_id:
        return "anonymous"
    
    # Hash user ID
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]


def log_query(user_id: Optional[str], query: str, answer: str, retrieved_docs: List[Dict]):
    """
    Log query for analytics (with privacy controls).
    
    Args:
        user_id: User ID (will be anonymized)
        query: User query
        answer: Generated answer
        retrieved_docs: Retrieved documents
    """
    # Anonymize user ID
    anon_user_id = anonymize_user_id(user_id) if user_id else "anonymous"
    
    # Create log entry
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'user_id_hash': anon_user_id,
        'query_length': len(query),
        'num_retrieved_docs': len(retrieved_docs),
        'top_doc_type': retrieved_docs[0]['metadata']['type'] if retrieved_docs else None,
        'top_score': retrieved_docs[0]['score'] if retrieved_docs else 0.0
    }
    
    # In production: Store in database or logging system
    # For now, just print (can be disabled in production)
    # print(f"Query log: {json.dumps(log_entry)}")
    
    # Note: Do NOT log actual query text or answer to protect privacy
    # Only log metadata for analytics


# API Endpoints
@router.post("/query", response_model=ChatResponse)
async def chat_query(request: ChatQuery = Body(...)):
    """
    Process chat query using RAG (Retrieval-Augmented Generation).
    
    Steps:
    1. Embed user query
    2. Search FAISS for top-k relevant documents
    3. Generate answer using template or LLM
    4. Return answer with source citations
    
    Privacy:
    - User ID is anonymized in logs
    - Query text is not stored
    - Only metadata is logged for analytics
    """
    start_time = datetime.now()
    
    try:
        # Load vector store if not loaded
        if not _model_loaded:
            load_vector_store()
        
        # Perform semantic search
        retrieved_docs = semantic_search(request.query, request.top_k)
        
        if not retrieved_docs:
            return ChatResponse(
                query=request.query,
                answer="I couldn't find any relevant information. Please try rephrasing your question or contact customer support.",
                retrieved_documents=[],
                method="no_results",
                confidence=0.0,
                response_time_ms=0.0
            )
        
        # Generate answer
        if request.use_llm:
            answer, confidence = generate_llm_answer(request.query, retrieved_docs)
            method = "llm"
        else:
            answer, confidence = generate_template_answer(request.query, retrieved_docs)
            method = "template"
        
        # Log query (anonymized)
        log_query(request.user_id, request.query, answer, retrieved_docs)
        
        # Calculate response time
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Prepare response
        response = ChatResponse(
            query=request.query,
            answer=answer,
            retrieved_documents=[
                RetrievedDocument(**doc) for doc in retrieved_docs
            ],
            method=method,
            confidence=confidence,
            response_time_ms=response_time
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat query error: {str(e)}")


@router.get("/health")
async def chat_health():
    """Check if chat service is ready."""
    try:
        if not _model_loaded:
            load_vector_store()
        
        return {
            "status": "healthy",
            "model_loaded": _model_loaded,
            "embedding_model": settings.embedding_model,
            "num_documents": len(_documents),
            "index_size": _faiss_index.ntotal if _faiss_index else 0
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Run build_vector_store.py to initialize"
        }


@router.post("/rebuild-index")
async def rebuild_index():
    """
    Rebuild vector index (admin endpoint).
    
    Note: In production, this should be protected with authentication.
    """
    global _model_loaded, _faiss_index, _documents, _embedding_model
    
    try:
        # Reset cache
        _model_loaded = False
        _faiss_index = None
        _documents = []
        _embedding_model = None
        
        # Reload
        load_vector_store()
        
        return {
            "status": "success",
            "message": "Vector store reloaded",
            "num_documents": len(_documents),
            "index_size": _faiss_index.ntotal
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {str(e)}")


@router.get("/stats")
async def get_stats():
    """Get chatbot statistics."""
    if not _model_loaded:
        load_vector_store()
    
    # Count document types
    doc_types = {}
    for doc in _documents:
        doc_type = doc['metadata'].get('type', 'unknown')
        doc_types[doc_type] = doc_types.get(doc_type, 0) + 1
    
    return {
        "total_documents": len(_documents),
        "document_types": doc_types,
        "embedding_model": settings.embedding_model,
        "index_dimension": _faiss_index.d if _faiss_index else 0,
        "top_k_default": 5
    }


# LLM Integration Hooks
def integrate_openai_llm(api_key: str):
    """
    Hook to integrate OpenAI API.
    
    Usage:
        integrate_openai_llm(settings.openai_api_key)
    
    Args:
        api_key: OpenAI API key
    """
    # TODO: Implement OpenAI integration
    # import openai
    # openai.api_key = api_key
    pass


def integrate_local_llm(model_path: str):
    """
    Hook to integrate local LLM (e.g., llama.cpp, GPT4All).
    
    Usage:
        integrate_local_llm("/path/to/model.gguf")
    
    Args:
        model_path: Path to local LLM model
    """
    # TODO: Implement local LLM integration
    # from llama_cpp import Llama
    # global _local_llm
    # _local_llm = Llama(model_path=model_path)
    pass


# Example LLM prompt template
def create_llm_prompt(query: str, context_docs: List[Dict]) -> str:
    """
    Create prompt for LLM.
    
    Args:
        query: User query
        context_docs: Retrieved context documents
        
    Returns:
        Formatted prompt
    """
    # Build context from retrieved documents
    context = "\n\n".join([
        f"[Source {i+1}]: {doc['text']}"
        for i, doc in enumerate(context_docs[:3])
    ])
    
    prompt = f"""You are a helpful assistant for AgriConnect, a platform connecting farmers with consumers.

Context information:
{context}

User question: {query}

Please provide a concise, helpful answer based on the context above. If the context doesn't contain enough information, say so and suggest contacting customer support.

Answer:"""
    
    return prompt
