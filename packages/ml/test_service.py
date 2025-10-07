"""
Test script to verify ML service setup
"""
import os
import sys

print("Testing ML Service Setup...")
print("-" * 50)

# Test 1: Check imports
print("\n1. Testing imports...")
try:
    from fastapi import FastAPI
    print("   ✓ FastAPI imported")
except ImportError as e:
    print(f"   ✗ FastAPI import failed: {e}")
    sys.exit(1)

try:
    import pandas as pd
    print("   ✓ Pandas imported")
except ImportError as e:
    print(f"   ✗ Pandas import failed: {e}")
    sys.exit(1)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    print("   ✓ Scikit-learn imported")
except ImportError as e:
    print(f"   ✗ Scikit-learn import failed: {e}")
    sys.exit(1)

try:
    from sqlalchemy import create_engine, text
    print("   ✓ SQLAlchemy imported")
except ImportError as e:
    print(f"   ✗ SQLAlchemy import failed: {e}")
    sys.exit(1)

# Test 2: Check database path
print("\n2. Testing database connection...")
DATABASE_URL = os.environ.get('DATABASE_URL', 'file:../api/prisma/dev.db')
print(f"   Database URL: {DATABASE_URL}")

if DATABASE_URL.startswith('file:'):
    db_path = DATABASE_URL.replace('file:', '')
    DATABASE_URL = f'sqlite:///{db_path}'
    print(f"   Converted to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={'check_same_thread': False})
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result]
        print(f"   ✓ Connected to database")
        print(f"   Tables found: {', '.join(tables)}")
except Exception as e:
    print(f"   ✗ Database connection failed: {e}")
    sys.exit(1)

# Test 3: Check if products table exists and has data
print("\n3. Testing products table...")
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM products"))
        count = result.fetchone()[0]
        print(f"   ✓ products table exists with {count} products")
        
        if count > 0:
            result = conn.execute(text("SELECT id, name, status FROM products LIMIT 3"))
            print("   Sample products:")
            for row in result:
                print(f"     - ID: {row[0]}, Name: {row[1]}, Status: {row[2]}")
except Exception as e:
    print(f"   ✗ products table check failed: {e}")

# Test 4: Check if events table exists
print("\n4. Testing events table...")
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM events"))
        count = result.fetchone()[0]
        print(f"   ✓ events table exists with {count} events")
        
        if count > 0:
            result = conn.execute(text("SELECT userId, type, productId FROM events LIMIT 3"))
            print("   Sample events:")
            for row in result:
                print(f"     - User: {row[0]}, Type: {row[1]}, Product: {row[2]}")
except Exception as e:
    print(f"   ✗ events table check failed: {e}")

print("\n" + "=" * 50)
print("Setup verification complete!")
print("\nTo start the service, run:")
print("  python -m uvicorn main:app --reload --port 8000")
