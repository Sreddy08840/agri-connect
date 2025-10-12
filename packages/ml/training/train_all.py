"""Train all ML models."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from train_recs import train_content_based, train_collaborative
from train_forecast import train_forecast_models
from train_price import train_price_models
from train_fraud import train_isolation_forest, train_xgboost_classifier


def main():
    """Train all models."""
    print("=" * 60)
    print("TRAINING ALL ML MODELS")
    print("=" * 60)
    
    # Recommendations
    print("\n[1/5] RECOMMENDATION MODELS")
    print("-" * 60)
    try:
        train_content_based()
        train_collaborative()
    except Exception as e:
        print(f"✗ Error training recommendation models: {e}")
    
    # Forecasting
    print("\n[2/5] FORECASTING MODELS")
    print("-" * 60)
    try:
        train_forecast_models()
    except Exception as e:
        print(f"✗ Error training forecasting models: {e}")
    
    # Price optimization
    print("\n[3/5] PRICE OPTIMIZATION MODELS")
    print("-" * 60)
    try:
        train_price_models()
    except Exception as e:
        print(f"✗ Error training price models: {e}")
    
    # Fraud detection
    print("\n[4/5] FRAUD DETECTION MODELS")
    print("-" * 60)
    try:
        train_isolation_forest()
        train_xgboost_classifier()
    except Exception as e:
        print(f"✗ Error training fraud models: {e}")
    
    # Chatbot (vector index built on startup)
    print("\n[5/5] CHATBOT MODELS")
    print("-" * 60)
    print("Vector index will be built on service startup")
    
    print("\n" + "=" * 60)
    print("ALL TRAINING COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start the ML service: python -m app.main")
    print("2. Or use: make serve")
    print("=" * 60)


if __name__ == "__main__":
    main()
