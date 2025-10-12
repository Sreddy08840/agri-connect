"""Quick start script to set up and test the ML service."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import subprocess
import time
import requests
from colorama import init, Fore, Style

init(autoreset=True)

def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"{Fore.CYAN}{Style.BRIGHT}{text}")
    print("=" * 60)

def print_success(text):
    """Print success message."""
    print(f"{Fore.GREEN}✓ {text}")

def print_error(text):
    """Print error message."""
    print(f"{Fore.RED}✗ {text}")

def print_info(text):
    """Print info message."""
    print(f"{Fore.YELLOW}ℹ {text}")

def check_dependencies():
    """Check if required dependencies are installed."""
    print_header("Checking Dependencies")
    
    try:
        import fastapi
        print_success("FastAPI installed")
    except ImportError:
        print_error("FastAPI not installed. Run: pip install -r requirements.txt")
        return False
    
    try:
        import pandas
        print_success("Pandas installed")
    except ImportError:
        print_error("Pandas not installed")
        return False
    
    try:
        import sklearn
        print_success("Scikit-learn installed")
    except ImportError:
        print_error("Scikit-learn not installed")
        return False
    
    return True

def check_database():
    """Check if database is accessible."""
    print_header("Checking Database")
    
    try:
        from app.db import db
        products = db.get_products()
        print_success(f"Database connected: {len(products)} products found")
        return True
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        print_info("Make sure the database path in .env is correct")
        return False

def train_models():
    """Train ML models."""
    print_header("Training Models")
    print_info("This may take a few minutes...")
    
    try:
        from training.train_all import main
        main()
        print_success("All models trained successfully")
        return True
    except Exception as e:
        print_error(f"Training failed: {e}")
        return False

def start_service():
    """Start the ML service."""
    print_header("Starting ML Service")
    print_info("Starting server on http://localhost:8000")
    print_info("Press Ctrl+C to stop")
    print_info("API docs available at http://localhost:8000/docs")
    
    try:
        subprocess.run([
            "uvicorn", "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ])
    except KeyboardInterrupt:
        print_info("\nService stopped")

def test_endpoints():
    """Test ML service endpoints."""
    print_header("Testing Endpoints")
    
    base_url = "http://localhost:8000"
    
    # Test health
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print_success("Health check passed")
        else:
            print_error(f"Health check failed: {response.status_code}")
    except Exception as e:
        print_error(f"Health check failed: {e}")
        print_info("Make sure the service is running")
        return False
    
    # Test recommendations
    try:
        response = requests.get(f"{base_url}/recommendations/user/test-user?n=5", timeout=5)
        if response.status_code == 200:
            print_success("Recommendations endpoint working")
        else:
            print_info(f"Recommendations returned {response.status_code}")
    except Exception as e:
        print_error(f"Recommendations test failed: {e}")
    
    # Test chat
    try:
        response = requests.post(
            f"{base_url}/chat/query",
            json={"query": "What products are available?"},
            timeout=5
        )
        if response.status_code == 200:
            print_success("Chat endpoint working")
        elif response.status_code == 503:
            print_info("Chat endpoint not ready (models loading)")
        else:
            print_info(f"Chat returned {response.status_code}")
    except Exception as e:
        print_error(f"Chat test failed: {e}")
    
    print_success("Endpoint testing complete")
    return True

def main():
    """Main quick start function."""
    print_header("Agri-Connect ML Service - Quick Start")
    
    # Check dependencies
    if not check_dependencies():
        print_error("Please install dependencies first: pip install -r requirements.txt")
        return
    
    # Check database
    if not check_database():
        print_error("Database not accessible. Check your .env configuration")
        return
    
    # Ask user what to do
    print("\nWhat would you like to do?")
    print("1. Train models")
    print("2. Start service")
    print("3. Train models and start service")
    print("4. Test endpoints (service must be running)")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        train_models()
    elif choice == "2":
        start_service()
    elif choice == "3":
        if train_models():
            print_info("\nStarting service in 3 seconds...")
            time.sleep(3)
            start_service()
    elif choice == "4":
        test_endpoints()
    else:
        print_error("Invalid choice")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_info("\n\nQuick start interrupted")
    except Exception as e:
        print_error(f"\nUnexpected error: {e}")
