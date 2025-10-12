"""Build FAISS vector store for RAG-enabled chatbot."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import json
from typing import List, Dict
import re

from app.db import db
from app.config import settings


def clean_text(text: str) -> str:
    """
    Clean and normalize text.
    
    Args:
        text: Raw text
        
    Returns:
        Cleaned text
    """
    if not text or pd.isna(text):
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    
    return text.strip()


def remove_pii(text: str) -> str:
    """
    Remove potential PII from text.
    
    Args:
        text: Text that may contain PII
        
    Returns:
        Text with PII removed
    """
    # Remove email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    
    # Remove phone numbers (various formats)
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)
    text = re.sub(r'\b\+\d{1,3}[-.]?\d{3,4}[-.]?\d{3,4}[-.]?\d{3,4}\b', '[PHONE]', text)
    
    # Remove credit card numbers
    text = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CARD]', text)
    
    # Remove SSN-like patterns
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]', text)
    
    return text


def chunk_text(text: str, max_length: int = 512, overlap: int = 50) -> List[str]:
    """
    Split text into overlapping chunks.
    
    Args:
        text: Text to chunk
        max_length: Maximum chunk length in characters
        overlap: Overlap between chunks
        
    Returns:
        List of text chunks
    """
    if len(text) <= max_length:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + max_length
        
        # Try to break at sentence boundary
        if end < len(text):
            # Look for sentence end
            sentence_end = text.rfind('.', start, end)
            if sentence_end > start + max_length // 2:
                end = sentence_end + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        start = end - overlap
    
    return chunks


def load_product_documents() -> List[Dict]:
    """
    Load product documents from database.
    
    Returns:
        List of document dictionaries
    """
    print("Loading product documents...")
    
    products_df = db.get_products()
    
    if products_df.empty:
        print("  No products found!")
        return []
    
    documents = []
    
    for _, product in products_df.iterrows():
        # Combine product information
        text_parts = []
        
        if product.get('title'):
            text_parts.append(f"Product: {product['title']}")
        
        if product.get('description'):
            text_parts.append(f"Description: {product['description']}")
        
        if product.get('category'):
            text_parts.append(f"Category: {product['category']}")
        
        if product.get('unit'):
            text_parts.append(f"Unit: {product['unit']}")
        
        if product.get('price'):
            text_parts.append(f"Price: ${product['price']}")
        
        text = " ".join(text_parts)
        
        # Clean and remove PII
        text = clean_text(text)
        text = remove_pii(text)
        
        if not text:
            continue
        
        # Chunk if too long
        chunks = chunk_text(text, max_length=settings.max_context_length)
        
        for i, chunk in enumerate(chunks):
            documents.append({
                'doc_id': f"product_{product['id']}_{i}",
                'text': chunk,
                'metadata': {
                    'type': 'product',
                    'product_id': product['id'],
                    'title': product.get('title', ''),
                    'category': product.get('category', ''),
                    'chunk_index': i,
                    'total_chunks': len(chunks)
                }
            })
    
    print(f"  Loaded {len(documents)} product document chunks")
    return documents


def load_faq_documents() -> List[Dict]:
    """
    Load FAQ documents.
    
    Note: In production, this would load from a FAQ database table or CMS.
    For now, we'll create some example FAQs.
    
    Returns:
        List of FAQ document dictionaries
    """
    print("Loading FAQ documents...")
    
    # Example FAQs (in production, load from database)
    faqs = [
        {
            'question': 'How do I place an order?',
            'answer': 'To place an order, browse products, add items to cart, and proceed to checkout. You can pay via credit card, debit card, or cash on delivery.'
        },
        {
            'question': 'What are the delivery charges?',
            'answer': 'Delivery is free for orders above $50. For orders below $50, a delivery fee of $5 applies. Delivery typically takes 2-3 business days.'
        },
        {
            'question': 'Can I return a product?',
            'answer': 'Yes, you can return products within 7 days of delivery if they are damaged or not as described. Fresh produce returns are accepted within 24 hours.'
        },
        {
            'question': 'How do I track my order?',
            'answer': 'After placing an order, you will receive a tracking link via email and SMS. You can also check order status in your account dashboard.'
        },
        {
            'question': 'What payment methods are accepted?',
            'answer': 'We accept credit cards (Visa, MasterCard, Amex), debit cards, UPI, net banking, and cash on delivery for eligible orders.'
        },
        {
            'question': 'How do I contact customer support?',
            'answer': 'You can contact customer support via email at support@agriconnect.com, call us at 1-800-AGRI-HELP, or use the live chat feature on our website.'
        },
        {
            'question': 'Are the products organic?',
            'answer': 'We offer both organic and conventional products. Products marked with "Organic Certified" badge are certified organic by recognized authorities.'
        },
        {
            'question': 'How fresh are the products?',
            'answer': 'All products are sourced directly from farmers and delivered within 24-48 hours of harvest. We guarantee freshness and quality.'
        },
        {
            'question': 'Can I schedule delivery?',
            'answer': 'Yes, you can choose a preferred delivery time slot during checkout. We offer morning (8-12), afternoon (12-4), and evening (4-8) slots.'
        },
        {
            'question': 'Do you offer bulk discounts?',
            'answer': 'Yes, bulk orders above $200 receive a 10% discount. For larger wholesale orders, please contact our business team for custom pricing.'
        },
        {
            'question': 'How do I become a seller?',
            'answer': 'Farmers can register as sellers by filling out the seller registration form. You will need to provide farm details, certifications, and bank information.'
        },
        {
            'question': 'What is your quality guarantee?',
            'answer': 'We guarantee 100% quality. If you receive damaged or poor-quality products, we will provide a full refund or replacement within 24 hours.'
        },
        {
            'question': 'Are prices negotiable?',
            'answer': 'Prices are set by farmers and generally fixed. However, bulk orders may qualify for volume discounts. Contact the seller for large orders.'
        },
        {
            'question': 'How do I save my favorite products?',
            'answer': 'Click the heart icon on any product to add it to your favorites. You can view all favorites in your account under "My Favorites".'
        },
        {
            'question': 'Can I cancel my order?',
            'answer': 'Orders can be cancelled within 1 hour of placement. After that, please contact customer support. Cancellation may not be possible if the order is already shipped.'
        }
    ]
    
    documents = []
    
    for i, faq in enumerate(faqs):
        text = f"Question: {faq['question']} Answer: {faq['answer']}"
        
        # Clean and remove PII
        text = clean_text(text)
        text = remove_pii(text)
        
        documents.append({
            'doc_id': f"faq_{i}",
            'text': text,
            'metadata': {
                'type': 'faq',
                'question': faq['question'],
                'answer': faq['answer']
            }
        })
    
    print(f"  Loaded {len(documents)} FAQ documents")
    return documents


def load_help_documents() -> List[Dict]:
    """
    Load help/guide documents.
    
    Returns:
        List of help document dictionaries
    """
    print("Loading help documents...")
    
    # Example help articles (in production, load from CMS)
    help_articles = [
        {
            'title': 'Getting Started with AgriConnect',
            'content': 'AgriConnect connects farmers directly with consumers. Create an account, browse fresh produce, place orders, and get farm-fresh products delivered to your door.'
        },
        {
            'title': 'Understanding Product Categories',
            'content': 'Products are organized into categories: Vegetables, Fruits, Grains, Dairy, Meat, and Organic. Use filters to find exactly what you need.'
        },
        {
            'title': 'Payment Security',
            'content': 'All payments are processed through secure, PCI-compliant gateways. Your financial information is encrypted and never stored on our servers.'
        },
        {
            'title': 'Delivery Areas',
            'content': 'We currently deliver to major cities and surrounding areas. Enter your ZIP code at checkout to check if delivery is available in your area.'
        },
        {
            'title': 'Seasonal Products',
            'content': 'Product availability varies by season. Subscribe to our newsletter to get updates on seasonal produce and special offers.'
        }
    ]
    
    documents = []
    
    for i, article in enumerate(help_articles):
        text = f"Title: {article['title']} Content: {article['content']}"
        
        # Clean and remove PII
        text = clean_text(text)
        text = remove_pii(text)
        
        # Chunk if needed
        chunks = chunk_text(text, max_length=settings.max_context_length)
        
        for j, chunk in enumerate(chunks):
            documents.append({
                'doc_id': f"help_{i}_{j}",
                'text': chunk,
                'metadata': {
                    'type': 'help',
                    'title': article['title'],
                    'chunk_index': j,
                    'total_chunks': len(chunks)
                }
            })
    
    print(f"  Loaded {len(documents)} help document chunks")
    return documents


def build_faiss_index(documents: List[Dict], model_name: str = None) -> tuple:
    """
    Build FAISS index from documents.
    
    Args:
        documents: List of document dictionaries
        model_name: Sentence transformer model name
        
    Returns:
        Tuple of (faiss_index, embeddings, model)
    """
    if not documents:
        raise ValueError("No documents to index!")
    
    if model_name is None:
        model_name = settings.embedding_model
    
    print(f"\nBuilding FAISS index with model: {model_name}")
    print(f"Total documents: {len(documents)}")
    
    # Load embedding model
    print("  Loading embedding model...")
    model = SentenceTransformer(model_name)
    
    # Extract texts
    texts = [doc['text'] for doc in documents]
    
    # Generate embeddings
    print("  Generating embeddings...")
    embeddings = model.encode(
        texts,
        show_progress_bar=True,
        batch_size=32,
        convert_to_numpy=True
    )
    
    # Normalize embeddings for cosine similarity
    faiss.normalize_L2(embeddings)
    
    # Build FAISS index
    print("  Building FAISS index...")
    dimension = embeddings.shape[1]
    
    # Use IndexFlatIP for inner product (cosine similarity with normalized vectors)
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)
    
    print(f"  ✓ Index built with {index.ntotal} vectors (dimension: {dimension})")
    
    return index, embeddings, model


def save_vector_store(index, documents: List[Dict], model_name: str):
    """
    Save FAISS index and document mappings.
    
    Args:
        index: FAISS index
        documents: List of documents
        model_name: Model name used for embeddings
    """
    print("\nSaving vector store...")
    
    # Save FAISS index
    index_path = settings.vector_index_dir / "faiss.index"
    faiss.write_index(index, str(index_path))
    print(f"  ✓ FAISS index saved to {index_path}")
    
    # Save document mappings
    mappings = {
        'documents': documents,
        'model_name': model_name,
        'total_docs': len(documents),
        'index_dimension': index.d,
        'created_at': pd.Timestamp.now().isoformat()
    }
    
    mappings_path = settings.vector_index_dir / "doc_mappings.json"
    with open(mappings_path, 'w') as f:
        json.dump(mappings, f, indent=2)
    print(f"  ✓ Document mappings saved to {mappings_path}")
    
    # Save statistics
    doc_types = {}
    for doc in documents:
        doc_type = doc['metadata'].get('type', 'unknown')
        doc_types[doc_type] = doc_types.get(doc_type, 0) + 1
    
    stats = {
        'total_documents': len(documents),
        'document_types': doc_types,
        'model_name': model_name,
        'index_dimension': index.d,
        'created_at': pd.Timestamp.now().isoformat()
    }
    
    stats_path = settings.vector_index_dir / "index_stats.json"
    with open(stats_path, 'w') as f:
        json.dump(stats, f, indent=2)
    print(f"  ✓ Statistics saved to {stats_path}")


def test_search(index, documents: List[Dict], model):
    """
    Test search functionality with sample queries.
    
    Args:
        index: FAISS index
        documents: List of documents
        model: Embedding model
    """
    print("\nTesting search functionality...")
    
    test_queries = [
        "How do I place an order?",
        "What vegetables are available?",
        "Can I return products?",
        "What are the delivery charges?"
    ]
    
    for query in test_queries:
        print(f"\n  Query: '{query}'")
        
        # Embed query
        query_embedding = model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_embedding)
        
        # Search
        k = 3
        scores, indices = index.search(query_embedding, k)
        
        print(f"  Top {k} results:")
        for i, (idx, score) in enumerate(zip(indices[0], scores[0])):
            doc = documents[idx]
            print(f"    {i+1}. Score: {score:.4f}")
            print(f"       Type: {doc['metadata']['type']}")
            print(f"       Text: {doc['text'][:100]}...")


def main():
    """Main function to build vector store."""
    print("=" * 70)
    print("BUILDING RAG VECTOR STORE")
    print("=" * 70)
    
    # Load documents
    print("\nStep 1: Loading documents...")
    documents = []
    
    # Load product documents
    product_docs = load_product_documents()
    documents.extend(product_docs)
    
    # Load FAQ documents
    faq_docs = load_faq_documents()
    documents.extend(faq_docs)
    
    # Load help documents
    help_docs = load_help_documents()
    documents.extend(help_docs)
    
    print(f"\nTotal documents loaded: {len(documents)}")
    
    if not documents:
        print("No documents to index! Exiting.")
        return
    
    # Build FAISS index
    print("\nStep 2: Building FAISS index...")
    index, embeddings, model = build_faiss_index(documents)
    
    # Save vector store
    print("\nStep 3: Saving vector store...")
    save_vector_store(index, documents, model_name=settings.embedding_model)
    
    # Test search
    print("\nStep 4: Testing search...")
    test_search(index, documents, model)
    
    print("\n" + "=" * 70)
    print("VECTOR STORE BUILD COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Start ML service: python -m app.main")
    print("2. Test chat: curl -X POST http://localhost:8000/chat/query -d '{\"query\":\"How do I order?\"}'")
    print("\n⚠️  Privacy Notes:")
    print("   - PII has been removed from indexed documents")
    print("   - Query logs should be anonymized")
    print("   - Implement data retention policy (see README)")
    print("=" * 70)


if __name__ == "__main__":
    main()
