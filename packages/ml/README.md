# ML Recommendation Service

A simple Python microservice that provides content-based product recommendations using TF-IDF and cosine similarity.

## Features

- **Content-based filtering**: Recommends products similar to the last viewed product
- **TF-IDF vectorization**: Uses product title, description, and category
- **Fallback strategy**: Returns newest products if no viewing history exists
- **Refresh endpoint**: Reload product data without restarting the service

## Setup

### Environment Variables

The service defaults to using the SQLite database at `../api/prisma/dev.db`.

Optionally, you can override this by setting:

```bash
DATABASE_URL=file:./prisma/dev.db
```

Or for PostgreSQL:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. (Optional) Set the DATABASE_URL environment variable if not using default SQLite location

3. Run the service:
```bash
uvicorn main:app --reload
```

Or for production:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker

Build and run with Docker:

```bash
docker build -t agri-ml-service .
docker run -p 8000:8000 -e DATABASE_URL="file:./prisma/dev.db" agri-ml-service
```

Note: For Docker, you'll need to mount the SQLite database file as a volume.

## API Endpoints

### GET /recommendations

Get product recommendations for a user based on their last viewed product.

**Query Parameters:**
- `userId` (required): The user ID
- `n` (optional, default=10): Number of recommendations to return

**Example:**
```bash
curl "http://localhost:8000/recommendations?userId=1&n=5"
```

**Response:**
```json
{
  "userId": 1,
  "items": [
    {"id": 42, "score": 0.85},
    {"id": 17, "score": 0.72},
    {"id": 93, "score": 0.68}
  ]
}
```

### POST /refresh

Refresh the product index after database changes.

**Example:**
```bash
curl -X POST "http://localhost:8000/refresh"
```

**Response:**
```json
{
  "status": "refreshed"
}
```

## How It Works

1. On startup, loads all products from the database
2. Creates TF-IDF vectors from product text (title + description + category)
3. When a recommendation is requested:
   - Finds the user's last viewed product from the Event table
   - Calculates cosine similarity between that product and all others
   - Returns the top N most similar products
4. If no viewing history exists, returns the newest products as fallback

## Integration

Call this service from your main API when you need recommendations:

```javascript
const response = await fetch(`http://ml-service:8000/recommendations?userId=${userId}&n=10`);
const recommendations = await response.json();
```

Remember to call `/refresh` after significant product catalog updates to keep recommendations current.
