"""Seed a minimal order into the shared SQLite DB used by the ML service.

This script will:
- pick an existing APPROVED product (first available)
- create a test customer user if none exists with phone '0000000000'
- insert a single order + order_item referencing that product

Run from the `packages/ml` folder with:
    py .\scripts\seed_orders.py

This is safe for development/testing but intended only for local use.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import uuid
from datetime import datetime
from sqlalchemy import text
from app.db import DatabaseConnector

DB = DatabaseConnector()

def now_str():
    return datetime.utcnow().isoformat()


def seed_one_order(qty: int = 1):
    with DB.engine.connect() as conn:
        trans = conn.begin()
        try:
            # Find a product to reference
            product_row = conn.execute(
                text("SELECT id, farmerId, price FROM products WHERE status = 'APPROVED' LIMIT 1")
            ).fetchone()

            if not product_row:
                print('No APPROVED products found in the database. Aborting seed.')
                trans.rollback()
                return False

            # product_row can be a tuple; access by index
            product_id = product_row[0]
            farmer_id = product_row[1]
            unit_price = float(product_row[2] or 0.0)

            # Ensure a test customer exists
            phone = '0000000000'
            user = conn.execute(
                text('SELECT id FROM users WHERE phone = :phone'), {'phone': phone}
            ).fetchone()

            if user:
                # Row may be tuple-like
                user_id = user[0]
                print(f'Using existing test user {user_id} with phone {phone}')
            else:
                user_id = uuid.uuid4().hex
                now = now_str()
                conn.execute(
                    text(
                        "INSERT INTO users (id, phone, name, role, createdAt, updatedAt) VALUES (:id, :phone, :name, :role, :createdAt, :updatedAt)"
                    ),
                    {
                        'id': user_id,
                        'phone': phone,
                        'name': 'ml_test_customer',
                        'role': 'CUSTOMER',
                        'createdAt': now,
                        'updatedAt': now
                    }
                )
                print(f'Created test user {user_id} with phone {phone}')

            # Create order
            order_id = uuid.uuid4().hex
            order_number = f'TEST-{order_id[:8]}'
            total = unit_price * qty
            now = now_str()

            conn.execute(
                text(
                    "INSERT INTO orders (id, orderNumber, customerId, farmerId, total, status, paymentMethod, addressSnapshot, createdAt, updatedAt)"
                    " VALUES (:id, :orderNumber, :customerId, :farmerId, :total, :status, :paymentMethod, :addressSnapshot, :createdAt, :updatedAt)"
                ),
                {
                    'id': order_id,
                    'orderNumber': order_number,
                    'customerId': user_id,
                    'farmerId': farmer_id,
                    'total': total,
                    'status': 'PLACED',
                    'paymentMethod': 'CASH',
                    'addressSnapshot': 'Test address',
                    'createdAt': now,
                    'updatedAt': now
                }
            )

            # Create order item
            order_item_id = uuid.uuid4().hex
            conn.execute(
                text(
                    "INSERT INTO order_items (id, orderId, productId, qty, unitPrice, createdAt) VALUES (:id, :orderId, :productId, :qty, :unitPrice, :createdAt)"
                ),
                {
                    'id': order_item_id,
                    'orderId': order_id,
                    'productId': product_id,
                    'qty': qty,
                    'unitPrice': unit_price,
                    'createdAt': now
                }
            )

            trans.commit()
            print(f'Inserted order {order_id} for product {product_id} qty={qty}')
            return True

        except Exception as exc:
            trans.rollback()
            print('Seeding failed:', exc)
            return False


if __name__ == '__main__':
    ok = seed_one_order(qty=1)
    if not ok:
        raise SystemExit(1)
