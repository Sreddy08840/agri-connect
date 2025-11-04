"""Database connection and helper functions."""
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from .config import settings


class DatabaseConnector:
    """Database connector for ML service."""
    
    def __init__(self):
        """Initialize database connection."""
        self.engine = self._create_engine()
    
    def _create_engine(self) -> Engine:
        """Create SQLAlchemy engine with proper configuration."""
        db_url = settings.database_url
        
        # Convert Prisma file: format to SQLite format for SQLAlchemy
        if db_url.startswith('file:'):
            db_path = db_url.replace('file:', '')
            db_url = f'sqlite:///{db_path}'
        
        connect_args = {}
        if 'sqlite' in db_url:
            connect_args['check_same_thread'] = False
        
        return create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args=connect_args
        )
    
    def get_products(self, status: str = "APPROVED") -> pd.DataFrame:
        """
        Fetch products from database.
        
        Args:
            status: Product status filter (default: APPROVED)
            
        Returns:
            DataFrame with product data
        """
        query = """
            SELECT 
                p.id, 
                p.name as title, 
                p.description, 
                p.price,
                p.unit,
                p.stockQty,
                p.ratingAvg,
                p.ratingCount,
                p.categoryId,
                p.farmerId,
                p.createdAt,
                c.name as category 
            FROM products p
            LEFT JOIN categories c ON p.categoryId = c.id
            WHERE p.status = :status
        """
        return pd.read_sql(query, self.engine, params={'status': status})
    
    def get_orders(self, days: Optional[int] = None) -> pd.DataFrame:
        """
        Fetch orders from database.
        
        Args:
            days: Number of days to look back (None for all)
            
        Returns:
            DataFrame with order data
        """
        query = """
            SELECT 
                o.id,
                o.orderNumber,
                o.customerId,
                o.farmerId,
                o.total,
                o.status,
                o.createdAt,
                oi.productId,
                oi.qty,
                oi.unitPrice
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
        """
        
        if days:
            query += " WHERE o.createdAt >= :cutoff_date"
            cutoff = datetime.now() - timedelta(days=days)
            return pd.read_sql(query, self.engine, params={'cutoff_date': cutoff})
        
        return pd.read_sql(query, self.engine)
    
    def get_events(self, event_type: Optional[str] = None, days: Optional[int] = None) -> pd.DataFrame:
        """
        Fetch user events from database.
        
        Args:
            event_type: Filter by event type (view, add_to_cart, purchase, etc.)
            days: Number of days to look back (None for all)
            
        Returns:
            DataFrame with event data
        """
        query = "SELECT * FROM events WHERE 1=1"
        params = {}
        
        if event_type:
            query += " AND type = :event_type"
            params['event_type'] = event_type
        
        if days:
            query += " AND createdAt >= :cutoff_date"
            params['cutoff_date'] = datetime.now() - timedelta(days=days)
        
        query += " ORDER BY createdAt DESC"
        
        return pd.read_sql(query, self.engine, params=params)
    
    def get_user_product_matrix(self) -> pd.DataFrame:
        """
        Create user-product interaction matrix from events and purchases.
        
        Returns:
            DataFrame with userId, productId, and interaction score
        """
        query = """
            SELECT 
                userId,
                productId,
                CASE 
                    WHEN type = 'purchase' THEN 5.0
                    WHEN type = 'add_to_cart' THEN 3.0
                    WHEN type = 'favorite' THEN 2.0
                    WHEN type = 'view' THEN 1.0
                    ELSE 0.5
                END as score
            FROM events
            WHERE userId IS NOT NULL AND productId IS NOT NULL
        """
        return pd.read_sql(query, self.engine)
    
    def get_user_order_history(self, user_id: str) -> pd.DataFrame:
        """
        Get order history for a specific user.
        
        Args:
            user_id: User ID
            
        Returns:
            DataFrame with order items and quantities
        """
        query = """
            SELECT 
                o.id as order_id,
                o.customerId as user_id,
                oi.productId as product_id,
                oi.qty as quantity,
                oi.unitPrice as price,
                o.createdAt as order_date
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
            WHERE o.customerId = :user_id
                AND o.status NOT IN ('CANCELLED', 'REFUNDED')
            ORDER BY o.createdAt DESC
        """
        return pd.read_sql(query, self.engine, params={'user_id': user_id})
    
    def get_all_orders(self) -> pd.DataFrame:
        """
        Get all orders for building user-item matrix.
        
        Returns:
            DataFrame with user_id, product_id, quantity
        """
        query = """
            SELECT 
                o.customerId as user_id,
                oi.productId as product_id,
                oi.qty as quantity,
                o.createdAt as order_date
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
            WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
            ORDER BY o.createdAt DESC
        """
        return pd.read_sql(query, self.engine)
    
    def get_product_metadata(self, product_ids: List[str]) -> pd.DataFrame:
        """
        Get metadata for specific products.
        
        Args:
            product_ids: List of product IDs
            
        Returns:
            DataFrame with product details
        """
        if not product_ids:
            return pd.DataFrame()
        
        placeholders = ','.join(['?' for _ in product_ids])
        query = f"""
            SELECT 
                p.id,
                p.name as title,
                p.description,
                p.price,
                p.unit,
                p.ratingAvg,
                p.ratingCount,
                c.name as category
            FROM products p
            LEFT JOIN categories c ON p.categoryId = c.id
            WHERE p.id IN ({placeholders})
                AND p.status = 'APPROVED'
        """
        return pd.read_sql(query, self.engine, params=product_ids)
    
    def get_user_view_events(self, user_id: str, days: Optional[int] = 30) -> pd.DataFrame:
        """
        Get view events for a specific user.
        
        Args:
            user_id: User ID
            days: Number of days to look back
            
        Returns:
            DataFrame with view events
        """
        query = """
            SELECT 
                userId as user_id,
                productId as product_id,
                createdAt as event_date,
                value
            FROM events
            WHERE userId = :user_id
                AND type = 'view'
                AND productId IS NOT NULL
        """
        
        params = {'user_id': user_id}
        
        if days:
            query += " AND createdAt >= :cutoff_date"
            params['cutoff_date'] = datetime.now() - timedelta(days=days)
        
        query += " ORDER BY createdAt DESC"
        
        return pd.read_sql(query, self.engine, params=params)
    
    def get_top_selling_products(self, limit: int = 20) -> List[str]:
        """
        Get top selling products for cold-start recommendations.
        
        Args:
            limit: Number of products to return
            
        Returns:
            List of product IDs
        """
        query = """
            SELECT 
                oi.productId as product_id,
                SUM(oi.qty) as total_sold
            FROM order_items oi
            JOIN orders o ON oi.orderId = o.id
            WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY oi.productId
            ORDER BY total_sold DESC
            LIMIT :limit
        """
        result = pd.read_sql(query, self.engine, params={'limit': limit})
        return result['product_id'].tolist()
    
    def get_product_sales_history(self, product_id: str, days: int = 365) -> pd.DataFrame:
        """
        Get sales history for a specific product.
        
        Args:
            product_id: Product ID
            days: Number of days to look back
            
        Returns:
            DataFrame with daily sales data
        """
        query = """
            SELECT 
                DATE(o.createdAt) as date,
                SUM(oi.qty) as quantity,
                AVG(oi.unitPrice) as avg_price,
                COUNT(DISTINCT o.id) as num_orders
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
            WHERE oi.productId = :product_id
                AND o.createdAt >= :cutoff_date
                AND o.status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY DATE(o.createdAt)
            ORDER BY date
        """
        cutoff = datetime.now() - timedelta(days=days)
        return pd.read_sql(
            query, 
            self.engine, 
            params={'product_id': product_id, 'cutoff_date': cutoff}
        )
    
    def get_sales_timeseries(self, product_id: str, start_date: Optional[datetime] = None, 
                            end_date: Optional[datetime] = None) -> pd.DataFrame:
        """
        Get sales time series for forecasting (Prophet format).
        
        Args:
            product_id: Product ID
            start_date: Start date (optional)
            end_date: End date (optional)
            
        Returns:
            DataFrame with columns 'ds' (date) and 'y' (units sold)
        """
        query = """
            SELECT 
                DATE(o.createdAt) as ds,
                SUM(oi.qty) as y
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
            WHERE oi.productId = :product_id
                AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        """
        
        params = {'product_id': product_id}
        
        if start_date:
            query += " AND o.createdAt >= :start_date"
            params['start_date'] = start_date
        
        if end_date:
            query += " AND o.createdAt <= :end_date"
            params['end_date'] = end_date
        
        query += " GROUP BY DATE(o.createdAt) ORDER BY ds"
        
        df = pd.read_sql(query, self.engine, params=params)
        
        if df.empty:
            return pd.DataFrame(columns=['ds', 'y'])
        
        # Convert to datetime
        df['ds'] = pd.to_datetime(df['ds'])
        
        # Fill missing dates with 0
        if not df.empty:
            date_range = pd.date_range(
                start=df['ds'].min(),
                end=df['ds'].max(),
                freq='D'
            )
            df = df.set_index('ds').reindex(date_range, fill_value=0).reset_index()
            df.columns = ['ds', 'y']
        
        return df
    
    def get_category_sales_timeseries(self, category_id: str, start_date: Optional[datetime] = None,
                                     end_date: Optional[datetime] = None) -> pd.DataFrame:
        """
        Get aggregated sales time series for a category.
        
        Args:
            category_id: Category ID
            start_date: Start date (optional)
            end_date: End date (optional)
            
        Returns:
            DataFrame with columns 'ds' (date) and 'y' (units sold)
        """
        query = """
            SELECT 
                DATE(o.createdAt) as ds,
                SUM(oi.qty) as y
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
            JOIN products p ON oi.productId = p.id
            WHERE p.categoryId = :category_id
                AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        """
        
        params = {'category_id': category_id}
        
        if start_date:
            query += " AND o.createdAt >= :start_date"
            params['start_date'] = start_date
        
        if end_date:
            query += " AND o.createdAt <= :end_date"
            params['end_date'] = end_date
        
        query += " GROUP BY DATE(o.createdAt) ORDER BY ds"
        
        df = pd.read_sql(query, self.engine, params=params)
        
        if df.empty:
            return pd.DataFrame(columns=['ds', 'y'])
        
        df['ds'] = pd.to_datetime(df['ds'])
        
        # Fill missing dates
        if not df.empty:
            date_range = pd.date_range(
                start=df['ds'].min(),
                end=df['ds'].max(),
                freq='D'
            )
            df = df.set_index('ds').reindex(date_range, fill_value=0).reset_index()
            df.columns = ['ds', 'y']
        
        return df
    
    def get_current_inventory(self, product_id: str) -> int:
        """
        Get current inventory level for a product.
        
        Args:
            product_id: Product ID
            
        Returns:
            Current stock quantity
        """
        query = """
            SELECT stockQty
            FROM products
            WHERE id = :product_id
        """
        
        result = pd.read_sql(query, self.engine, params={'product_id': product_id})
        
        if result.empty:
            return 0
        
        return int(result.iloc[0]['stockQty'])
    
    def get_historical_price_demand(self, product_id: str, days: int = 365) -> pd.DataFrame:
        """
        Get historical price-demand data with features for elasticity modeling.
        
        Args:
            product_id: Product ID
            days: Number of days to look back
            
        Returns:
            DataFrame with date, price, units_sold, and feature columns
        """
        query = """
            SELECT 
                DATE(o.createdAt) as date,
                AVG(oi.unitPrice) as price,
                SUM(oi.qty) as units_sold,
                COUNT(DISTINCT o.id) as num_orders,
                strftime('%w', o.createdAt) as day_of_week,
                strftime('%m', o.createdAt) as month,
                CASE 
                    WHEN strftime('%w', o.createdAt) IN ('0', '6') THEN 1 
                    ELSE 0 
                END as is_weekend
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
            WHERE oi.productId = :product_id
                AND o.createdAt >= :cutoff_date
                AND o.status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY DATE(o.createdAt)
            HAVING price > 0 AND units_sold > 0
            ORDER BY date
        """
        
        cutoff = datetime.now() - timedelta(days=days)
        df = pd.read_sql(query, self.engine, params={
            'product_id': product_id,
            'cutoff_date': cutoff
        })
        
        if df.empty:
            return pd.DataFrame()
        
        # Add derived features
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['day_of_week'].astype(int)
        df['month'] = df['month'].astype(int)
        
        # Add season feature (Northern Hemisphere)
        df['season'] = df['month'].apply(lambda m: 
            'winter' if m in [12, 1, 2] else
            'spring' if m in [3, 4, 5] else
            'summer' if m in [6, 7, 8] else
            'fall'
        )
        
        # Add promo indicator (simplified - price drops > 10%)
        if len(df) > 1:
            df['price_change'] = df['price'].pct_change()
            df['is_promo'] = (df['price_change'] < -0.1).astype(int)
        else:
            df['is_promo'] = 0
        
        return df
    
    def get_transactions(self, start_date: Optional[datetime] = None, 
                        end_date: Optional[datetime] = None,
                        limit: Optional[int] = None) -> pd.DataFrame:
        """
        Get transactions with detailed information for fraud detection.
        
        Args:
            start_date: Start date filter
            end_date: End date filter
            limit: Maximum number of transactions
            
        Returns:
            DataFrame with transaction details
        """
        query = """
            SELECT 
                o.id as transaction_id,
                o.customerId as user_id,
                o.total as amount,
                o.paymentMethod as payment_method,
                o.status,
                o.createdAt as timestamp,
                o.addressSnapshot as shipping_address,
                COUNT(oi.id) as num_items,
                SUM(oi.qty) as total_quantity,
                AVG(oi.unitPrice) as avg_item_price,
                MAX(oi.unitPrice) as max_item_price,
                MIN(oi.unitPrice) as min_item_price
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.orderId
            WHERE 1=1
        """
        
        params = {}
        
        if start_date:
            query += " AND o.createdAt >= :start_date"
            params['start_date'] = start_date
        
        if end_date:
            query += " AND o.createdAt <= :end_date"
            params['end_date'] = end_date
        
        query += " GROUP BY o.id ORDER BY o.createdAt DESC"
        
        if limit:
            query += f" LIMIT {limit}"
        
        df = pd.read_sql(query, self.engine, params=params)
        
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def get_user_profiles(self) -> pd.DataFrame:
        """
        Get user profiles with aggregated statistics for fraud detection.
        
        Returns:
            DataFrame with user profiles
        """
        query = """
            SELECT 
                u.id as user_id,
                u.email,
                u.createdAt as account_created,
                COUNT(DISTINCT o.id) as total_orders,
                AVG(o.total) as avg_order_amount,
                STDDEV(o.total) as stddev_order_amount,
                MAX(o.total) as max_order_amount,
                MIN(o.total) as min_order_amount,
                SUM(o.total) as total_spent,
                COUNT(DISTINCT DATE(o.createdAt)) as active_days
            FROM users u
            LEFT JOIN orders o ON u.id = o.customerId
            WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY u.id
        """
        
        df = pd.read_sql(query, self.engine)
        
        if not df.empty:
            df['account_created'] = pd.to_datetime(df['account_created'])
            df['account_age_days'] = (datetime.now() - df['account_created']).dt.days
        
        return df
    
    def get_user_transaction_history(self, user_id: str, days: int = 30) -> pd.DataFrame:
        """
        Get recent transaction history for a specific user.
        
        Args:
            user_id: User ID
            days: Number of days to look back
            
        Returns:
            DataFrame with user's transactions
        """
        query = """
            SELECT 
                o.id as transaction_id,
                o.total as amount,
                o.createdAt as timestamp,
                o.paymentMethod as payment_method,
                o.status
            FROM orders o
            WHERE o.customerId = :user_id
                AND o.createdAt >= :cutoff_date
            ORDER BY o.createdAt DESC
        """
        
        cutoff = datetime.now() - timedelta(days=days)
        
        df = pd.read_sql(query, self.engine, params={
            'user_id': user_id,
            'cutoff_date': cutoff
        })
        
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def get_transaction_features(self, limit: Optional[int] = None) -> pd.DataFrame:
        """
        Get transaction features for fraud detection (legacy method).
        
        Args:
            limit: Maximum number of transactions to fetch
            
        Returns:
            DataFrame with transaction features
        """
        return self.get_transactions(limit=limit)
    
    def get_product_documents(self) -> List[Dict[str, Any]]:
        """
        Get product documents for chatbot/RAG system.
        
        Returns:
            List of product documents with metadata
        """
        query = """
            SELECT 
                p.id,
                p.name,
                p.description,
                p.price,
                p.unit,
                c.name as category,
                u.name as farmer_name
            FROM products p
            LEFT JOIN categories c ON p.categoryId = c.id
            LEFT JOIN users u ON p.farmerId = u.id
            WHERE p.status = 'APPROVED'
        """
        
        with self.engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
            
            docs = []
            for row in rows:
                doc = {
                    'id': row[0],
                    'name': row[1],
                    'description': row[2] or '',
                    'price': row[3],
                    'unit': row[4],
                    'category': row[5] or '',
                    'farmer_name': row[6] or '',
                    'text': f"{row[1]} - {row[2] or ''} Category: {row[5] or ''} Price: {row[3]} per {row[4]}"
                }
                docs.append(doc)
            
            return docs
    
    def execute_query(self, query: str, params: Optional[Dict] = None) -> pd.DataFrame:
        """
        Execute a custom SQL query.
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            DataFrame with query results
        """
        return pd.read_sql(query, self.engine, params=params or {})
    
    def get_product_reviews(self, product_id: str, days: Optional[int] = None) -> pd.DataFrame:
        """
        Get all reviews for a specific product.
        
        Args:
            product_id: Product ID
            days: Number of days to look back (optional)
            
        Returns:
            DataFrame with product reviews
        """
        query = """
            SELECT 
                pr.id,
                pr.userId,
                pr.productId,
                pr.orderId,
                pr.rating,
                pr.comment,
                pr.images,
                pr.createdAt,
                pr.updatedAt,
                u.name as user_name
            FROM product_reviews pr
            LEFT JOIN users u ON pr.userId = u.id
            WHERE pr.productId = :product_id
        """
        
        params = {'product_id': product_id}
        
        if days:
            query += " AND pr.createdAt >= :cutoff_date"
            params['cutoff_date'] = datetime.now() - timedelta(days=days)
        
        query += " ORDER BY pr.createdAt DESC"
        
        df = pd.read_sql(query, self.engine, params=params)
        
        if not df.empty:
            df['createdAt'] = pd.to_datetime(df['createdAt'])
            df['updatedAt'] = pd.to_datetime(df['updatedAt'])
        
        return df
    
    def get_user_reviews(self, user_id: str, days: Optional[int] = None) -> pd.DataFrame:
        """
        Get all reviews by a specific user.
        
        Args:
            user_id: User ID
            days: Number of days to look back (optional)
            
        Returns:
            DataFrame with user's reviews
        """
        query = """
            SELECT 
                pr.id,
                pr.userId,
                pr.productId,
                pr.orderId,
                pr.rating,
                pr.comment,
                pr.images,
                pr.createdAt,
                pr.updatedAt,
                p.name as product_name
            FROM product_reviews pr
            LEFT JOIN products p ON pr.productId = p.id
            WHERE pr.userId = :user_id
        """
        
        params = {'user_id': user_id}
        
        if days:
            query += " AND pr.createdAt >= :cutoff_date"
            params['cutoff_date'] = datetime.now() - timedelta(days=days)
        
        query += " ORDER BY pr.createdAt DESC"
        
        df = pd.read_sql(query, self.engine, params=params)
        
        if not df.empty:
            df['createdAt'] = pd.to_datetime(df['createdAt'])
            df['updatedAt'] = pd.to_datetime(df['updatedAt'])
        
        return df
    
    def get_review_statistics(self, product_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get review statistics for a product or overall.
        
        Args:
            product_id: Product ID (optional, if None returns overall stats)
            
        Returns:
            Dictionary with review statistics
        """
        query = """
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as avg_rating,
                MIN(rating) as min_rating,
                MAX(rating) as max_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM product_reviews
        """
        
        params = {}
        if product_id:
            query += " WHERE productId = :product_id"
            params['product_id'] = product_id
        
        with self.engine.connect() as conn:
            result = conn.execute(text(query), params)
            row = result.fetchone()
            
            if row and row[0] > 0:
                return {
                    'total_reviews': row[0],
                    'avg_rating': float(row[1]) if row[1] else 0.0,
                    'min_rating': row[2],
                    'max_rating': row[3],
                    'rating_distribution': {
                        '5': row[4],
                        '4': row[5],
                        '3': row[6],
                        '2': row[7],
                        '1': row[8]
                    }
                }
            else:
                return {
                    'total_reviews': 0,
                    'avg_rating': 0.0,
                    'min_rating': 0,
                    'max_rating': 0,
                    'rating_distribution': {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
                }


# Global database connector instance
db = DatabaseConnector()
