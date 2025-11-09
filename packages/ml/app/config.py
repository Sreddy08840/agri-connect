"""Configuration management for ML service."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Allow unknown/extra variables in the .env file so this service
    # can be started from the repository root where a shared .env
    # contains variables for other services (api, web, etc.).
    # Use 'ignore' so unknown keys are silently ignored.
    model_config = {
        "protected_namespaces": (),
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore",
    }
    
    # Database
    database_url: str = "file:../api/prisma/dev.db"
    
    # Server
    ml_service_port: int = 8000
    ml_service_host: str = "0.0.0.0"
    
    # Model storage
    model_dir: Path = Path("./models")
    vector_index_dir: Path = Path("./vectors")
    
    # Model configuration
    tfidf_max_features: int = 20000
    default_recommendations: int = 10
    
    # Forecasting
    forecast_days: int = 30
    min_history_days: int = 30
    
    # Price optimization
    price_optimization_samples: int = 100
    
    # Fraud detection
    fraud_threshold: float = 0.7
    
    # Chatbot/RAG
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    top_k_docs: int = 5
    max_context_length: int = 512


settings = Settings()

# Ensure directories exist
settings.model_dir.mkdir(parents=True, exist_ok=True)
settings.vector_index_dir.mkdir(parents=True, exist_ok=True)
