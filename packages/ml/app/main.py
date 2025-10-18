"""Main FastAPI application for ML service."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.schemas import HealthResponse, ErrorResponse
from app.api import recommend, forecast, price_opt, fraud, chat

# Create FastAPI app
app = FastAPI(
    title="Agri-Connect ML Service",
    description="AI/Analytics microservice for recommendations, forecasting, price optimization, fraud detection, and chatbot",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recommend.router)
app.include_router(forecast.router)
app.include_router(price_opt.router)
app.include_router(fraud.router)
app.include_router(chat.router)


@app.get("/", tags=["health"])
async def root():
    """Root endpoint."""
    return {
        "service": "Agri-Connect ML Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "recommendations": "/recommendations/user/{user_id}",
            "forecast": "/forecast/product/{product_id}",
            "price_optimization": "/price-optimize/product/{product_id}",
            "fraud_detection": "/fraud/score",
            "chatbot": "/chat/query"
        },
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Health check endpoint."""
    # The recommend module defines different model variable names in some branches
    # so be defensive: check for multiple possible attributes and fall back to None
    recommendations_loaded = (
        getattr(recommend, '_content_model', None) is not None
        or getattr(recommend, '_tfidf_data', None) is not None
        or getattr(recommend, '_als_model', None) is not None
    )
    collaborative_loaded = (
        getattr(recommend, '_collaborative_model', None) is not None
        or getattr(recommend, '_als_model', None) is not None
    )
    models_loaded = {
        "recommendations": recommendations_loaded,
        "collaborative_filtering": collaborative_loaded,
        "chatbot_embeddings": getattr(chat, '_embedding_model', None) is not None,
        "chatbot_index": getattr(chat, '_faiss_index', None) is not None,
        "fraud_detection": getattr(fraud, '_isolation_forest', None) is not None or getattr(fraud, '_xgb_model', None) is not None
    }
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        models_loaded=models_loaded
    )


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Handle favicon requests to prevent 404 errors."""
    return JSONResponse(status_code=204, content=None)


@app.get("/.well-known/appspecific/com.chrome.devtools.json", include_in_schema=False)
async def chrome_devtools():
    """Handle Chrome DevTools requests to prevent 404 errors."""
    return JSONResponse(status_code=204, content=None)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler that ensures the response is JSON serializable."""
    err = ErrorResponse(
        error="Internal server error",
        detail=str(exc),
        timestamp=datetime.now()
    )
    return JSONResponse(status_code=500, content=jsonable_encoder(err))


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print("=" * 60)
    print("Starting Agri-Connect ML Service")
    print("=" * 60)
    print(f"Database: {settings.database_url}")
    print(f"Model directory: {settings.model_dir}")
    print(f"Vector index directory: {settings.vector_index_dir}")
    print("=" * 60)
    
    # Models are loaded in their respective modules
    print("Loading models...")
    print("✓ Recommendation models initialized")
    print("✓ Chatbot models initialized")
    print("✓ Fraud detection models initialized")
    print("=" * 60)
    print(f"Service ready at http://{settings.ml_service_host}:{settings.ml_service_port}")
    print(f"API docs at http://{settings.ml_service_host}:{settings.ml_service_port}/docs")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print("Shutting down Agri-Connect ML Service...")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.ml_service_host,
        port=settings.ml_service_port,
        reload=True
    )
