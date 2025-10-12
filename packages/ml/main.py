from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database Configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'file:../api/prisma/dev.db')

# Server Configuration
ML_SERVICE_PORT = int(os.environ.get('ML_SERVICE_PORT', '8000'))
ML_SERVICE_HOST = os.environ.get('ML_SERVICE_HOST', '0.0.0.0')

# Model Configuration
TFIDF_MAX_FEATURES = int(os.environ.get('TFIDF_MAX_FEATURES', '20000'))
DEFAULT_RECOMMENDATIONS = int(os.environ.get('DEFAULT_RECOMMENDATIONS', '10'))

# Convert Prisma file: format to SQLite format for SQLAlchemy
if DATABASE_URL.startswith('file:'):
    db_path = DATABASE_URL.replace('file:', '')
    DATABASE_URL = f'sqlite:///{db_path}'

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={'check_same_thread': False} if 'sqlite' in DATABASE_URL else {})

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_products()
    yield
    # Shutdown (if needed)

app = FastAPI(title="Agri-Connect ML Service", lifespan=lifespan)

# cached data in memory
prod_df = None
tfidf = None
tfidf_matrix = None

def load_products():
    global prod_df, tfidf, tfidf_matrix
    # Query products with category name
    q = '''
        SELECT p.id, p.name as title, p.description, c.name as category 
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.id
        WHERE p.status = 'APPROVED'
    '''
    prod_df = pd.read_sql(q, engine)
    if prod_df.empty:
        prod_df = pd.DataFrame(columns=['id','title','description','category','text'])
        return
    prod_df['text'] = prod_df['title'].fillna('') + ' ' + prod_df['description'].fillna('') + ' ' + prod_df['category'].fillna('')
    tfidf = TfidfVectorizer(stop_words='english', max_features=TFIDF_MAX_FEATURES)
    tfidf_matrix = tfidf.fit_transform(prod_df['text'].values)


@app.get('/recommendations')
def recommendations(userId: int, n: int = DEFAULT_RECOMMENDATIONS):
    # find last viewed product
    q = text('SELECT productId FROM events WHERE userId = :uid AND type = \'view\' ORDER BY createdAt DESC LIMIT 1')
    with engine.connect() as conn:
        row = conn.execute(q, {'uid': userId}).fetchone()
    if not row:
        # fallback: return top-n newest products
        items = prod_df.head(n)['id'].tolist()
        return {'userId': userId, 'items': [{'id': str(i), 'score': 0.0} for i in items]}
    prod_id = str(row[0])
    idx_list = prod_df.index[prod_df['id'] == prod_id].tolist()
    if not idx_list:
        return {'userId': userId, 'items': []}
    idx = idx_list[0]
    cosine_similarities = linear_kernel(tfidf_matrix[idx], tfidf_matrix).flatten()
    top_indices = cosine_similarities.argsort()[-(n+1):-1][::-1]
    items = [{'id': str(prod_df.iloc[i]['id']), 'score': float(cosine_similarities[i])} for i in top_indices]
    return {'userId': userId, 'items': items}

# lightweight endpoint to refresh index after product changes
@app.post('/refresh')
def refresh():
    load_products()
    return {'status': 'refreshed'}

# Health check endpoint
@app.get('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': pd.Timestamp.now().isoformat()}

# Run with environment variables:
# uvicorn main:app --host 0.0.0.0 --port 8000
# Or using the configured host and port:
# uvicorn main:app --host ${ML_SERVICE_HOST} --port ${ML_SERVICE_PORT}
