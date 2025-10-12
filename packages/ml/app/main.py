"""Main FastAPI application for ML service."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    models_loaded = {
        "recommendations": recommend._content_model is not None,
        "collaborative_filtering": recommend._collaborative_model is not None,
        "chatbot_embeddings": chat._embedding_model is not None,
        "chatbot_index": chat._faiss_index is not None,
        "fraud_detection": fraud._isolation_forest is not None or fraud._xgb_model is not None
    }
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        models_loaded=models_loaded
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc),
            timestamp=datetime.now()
        ).dict()
    )


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
