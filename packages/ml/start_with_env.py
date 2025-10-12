#!/usr/bin/env python3
"""
Start ML service with environment variables
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment
ML_SERVICE_HOST = os.environ.get('ML_SERVICE_HOST', '0.0.0.0')
ML_SERVICE_PORT = int(os.environ.get('ML_SERVICE_PORT', '8000'))

if __name__ == "__main__":
    import uvicorn
    from main import app
    
    print(f"🚀 Starting ML Service...")
    print(f"📍 Host: {ML_SERVICE_HOST}")
    print(f"📍 Port: {ML_SERVICE_PORT}")
    print(f"🔗 URL: http://{ML_SERVICE_HOST}:{ML_SERVICE_PORT}")
    print(f"📚 Docs: http://{ML_SERVICE_HOST}:{ML_SERVICE_PORT}/docs")
    print("-" * 50)
    
    uvicorn.run(
        app,
        host=ML_SERVICE_HOST,
        port=ML_SERVICE_PORT,
        reload=True,
        log_level="info"
    )
