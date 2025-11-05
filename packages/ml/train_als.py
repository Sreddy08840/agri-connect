"""Train ALS model for collaborative filtering recommendations."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.db import db
import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix
from implicit.als import AlternatingLeastSquares
import joblib
import json

def train_als_model():
    """Train ALS model for collaborative filtering."""
    print("\n" + "="*60)
    print("Training ALS Model for Collaborative Filtering")
    print("="*60)
    
    try:
        # Get order data
        print("\nFetching order data from database...")
        orders = db.get_all_orders()
        
        if orders.empty:
            print("⚠ No order data found in database")
            print("  ALS model requires user purchase history")
            print("  Using sample data for demonstration...")
            
            # Create sample data
            products = db.get_products()
            if products.empty:
                print("✗ No products found. Cannot train model.")
                return False
            
            # Generate sample interactions
            product_ids = products['id'].tolist()
            num_products_available = len(product_ids)
            sample_users = [f"user-{i}" for i in range(1, 6)]
            
            sample_data = []
            for user in sample_users:
                # Each user interacts with 1 to min(3, available) products
                max_interactions = min(3, num_products_available)
                num_products = np.random.randint(1, max_interactions + 1)
                user_products = np.random.choice(product_ids, num_products, replace=False)
                for prod in user_products:
                    sample_data.append({
                        'user_id': user,
                        'product_id': prod,
                        'quantity': np.random.randint(1, 5)
                    })
            
            orders = pd.DataFrame(sample_data)
            print(f"✓ Created {len(sample_data)} sample interactions")
        else:
            print(f"✓ Found {len(orders)} order records")
        
        # Create user-item matrix
        print("\nCreating user-item interaction matrix...")
        
        # Aggregate quantities by user-product
        interaction_matrix = orders.groupby(['user_id', 'product_id'])['quantity'].sum().reset_index()
        
        # Create mappings
        unique_users = interaction_matrix['user_id'].unique()
        unique_products = interaction_matrix['product_id'].unique()
        
        user_to_idx = {user: idx for idx, user in enumerate(unique_users)}
        product_to_idx = {prod: idx for idx, prod in enumerate(unique_products)}
        idx_to_user = {idx: user for user, idx in user_to_idx.items()}
        idx_to_product = {idx: prod for prod, idx in product_to_idx.items()}
        
        print(f"✓ Users: {len(unique_users)}")
        print(f"✓ Products: {len(unique_products)}")
        print(f"✓ Interactions: {len(interaction_matrix)}")
        
        # Create sparse matrix
        rows = interaction_matrix['user_id'].map(user_to_idx).values
        cols = interaction_matrix['product_id'].map(product_to_idx).values
        data = interaction_matrix['quantity'].values
        
        user_item_matrix = csr_matrix(
            (data, (rows, cols)),
            shape=(len(unique_users), len(unique_products))
        )
        
        # Train ALS model
        print("\nTraining ALS model...")
        print("  Parameters:")
        print("    - Factors: 50")
        print("    - Regularization: 0.01")
        print("    - Iterations: 20")
        
        model = AlternatingLeastSquares(
            factors=50,
            regularization=0.01,
            iterations=20,
            calculate_training_loss=True,
            random_state=42
        )
        
        # Fit model (ALS expects item-user matrix, so transpose)
        model.fit(user_item_matrix.T)
        
        print("✓ ALS model trained successfully")
        
        # Save model
        print("\nSaving model and mappings...")
        settings.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save ALS model
        joblib.dump(model, settings.model_dir / 'als_model.joblib')
        print("✓ ALS model saved")
        
        # Save mappings
        mappings = {
            'user_index': user_to_idx,
            'item_index': product_to_idx,
            'index_to_user': idx_to_user,
            'index_to_item': idx_to_product
        }
        
        with open(settings.model_dir / 'mappings.json', 'w') as f:
            json.dump(mappings, f, indent=2)
        print("✓ Mappings saved")
        
        # Test the model
        print("\nTesting model...")
        if len(unique_users) > 0:
            test_user_idx = 0
            recommendations = model.recommend(
                test_user_idx,
                user_item_matrix[test_user_idx],
                N=5,
                filter_already_liked_items=True
            )
            print(f"✓ Generated {len(recommendations[0])} recommendations for test user")
        
        print("\n" + "="*60)
        print("✓ ALS MODEL TRAINING COMPLETE!")
        print("="*60)
        print("\nModel Statistics:")
        print(f"  - Users: {len(unique_users)}")
        print(f"  - Products: {len(unique_products)}")
        print(f"  - Interactions: {len(interaction_matrix)}")
        print(f"  - Sparsity: {(1 - len(interaction_matrix) / (len(unique_users) * len(unique_products))) * 100:.2f}%")
        print("\nRestart the ML service to use the new model:")
        print("  py -m app.main")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error training ALS model: {e}")
        print("\nThis might be due to:")
        print("  1. Missing 'implicit' library")
        print("  2. Insufficient data (need at least 2 users and 2 products)")
        print("  3. Database connection issues")
        print("\nTo install implicit library:")
        print("  .\\venv\\Scripts\\pip.exe install implicit")
        return False


def main():
    """Main function."""
    print("\n" + "="*60)
    print("ALS MODEL TRAINER")
    print("="*60)
    print("\nThis script will:")
    print("1. Fetch user-product interaction data")
    print("2. Create user-item matrix")
    print("3. Train ALS collaborative filtering model")
    print("4. Save model and mappings")
    print("="*60)
    
    success = train_als_model()
    
    if success:
        print("\n✓ SUCCESS! ALS model is now available.")
    else:
        print("\n⚠ Training failed. See errors above.")
        print("\nThe service will continue to work using TF-IDF fallback.")


if __name__ == "__main__":
    main()
