import sqlite3
import random
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import text
from .database import engine, Base, SQLALCHEMY_DATABASE_URL
from . import models

def get_existing_columns(cursor, table_name):
    cursor.execute(f"PRAGMA table_info({table_name});")
    return {row[1]: row for row in cursor.fetchall()}

def safe_migrate():
    """
    Safely migrates existing database schema without data destruction.
    Inspects existing tables, adds missing columns with defaults, backfills legacy rows,
    and creates new Phase 1 tables.
    """
    print("[MIGRATION] Starting safe database migration check...")

    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        existing_tables = {row[0] for row in cursor.fetchall()}

        # 1. Migrate `users` table
        if "users" in existing_tables:
            cols = get_existing_columns(cursor, "users")
            if "email" not in cols:
                print("[MIGRATION] Adding column users.email")
                cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR;")
            if "phone" not in cols:
                print("[MIGRATION] Adding column users.phone")
                cursor.execute("ALTER TABLE users ADD COLUMN phone VARCHAR;")
            if "password_hash" not in cols:
                print("[MIGRATION] Adding column users.password_hash")
                cursor.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR;")
            if "is_active" not in cols:
                print("[MIGRATION] Adding column users.is_active")
                cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL;")
            if "created_at" not in cols:
                print("[MIGRATION] Adding column users.created_at")
                cursor.execute("ALTER TABLE users ADD COLUMN created_at DATETIME;")
                cursor.execute("UPDATE users SET created_at = datetime('now') WHERE created_at IS NULL;")
            if "updated_at" not in cols:
                print("[MIGRATION] Adding column users.updated_at")
                cursor.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME;")
                cursor.execute("UPDATE users SET updated_at = datetime('now') WHERE updated_at IS NULL;")

            # Migrate legacy ADMIN role to PLATFORM_ADMIN
            cursor.execute("UPDATE users SET role = 'PLATFORM_ADMIN' WHERE role = 'ADMIN' OR role = 'admin';")
            cursor.execute("UPDATE users SET role = 'STUDENT' WHERE role = 'student';")
            cursor.execute("UPDATE users SET role = 'CANTEEN_STAFF' WHERE role = 'canteen_staff';")

            # Backfill known demo user emails if empty
            cursor.execute("UPDATE users SET email = 'rahul.sharma@college.edu' WHERE college_id = 'CS2024-089' AND email IS NULL;")
            cursor.execute("UPDATE users SET email = 'suresh.staff@canteen.college.edu' WHERE college_id = 'STAFF-001' AND email IS NULL;")
            cursor.execute("UPDATE users SET email = 'admin@campusbites.edu' WHERE college_id = 'ADMIN-001' AND email IS NULL;")

        # 2. Migrate `canteens` table
        if "canteens" in existing_tables:
            cols = get_existing_columns(cursor, "canteens")
            if "college_id" not in cols:
                print("[MIGRATION] Adding column canteens.college_id")
                cursor.execute("ALTER TABLE canteens ADD COLUMN college_id INTEGER;")
            if "description" not in cols:
                print("[MIGRATION] Adding column canteens.description")
                cursor.execute("ALTER TABLE canteens ADD COLUMN description TEXT;")
            if "owner_id" not in cols:
                print("[MIGRATION] Adding column canteens.owner_id")
                cursor.execute("ALTER TABLE canteens ADD COLUMN owner_id INTEGER;")
            if "is_active" not in cols:
                print("[MIGRATION] Adding column canteens.is_active")
                cursor.execute("ALTER TABLE canteens ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL;")
            if "created_at" not in cols:
                print("[MIGRATION] Adding column canteens.created_at")
                cursor.execute("ALTER TABLE canteens ADD COLUMN created_at DATETIME;")
                cursor.execute("UPDATE canteens SET created_at = datetime('now') WHERE created_at IS NULL;")
            if "updated_at" not in cols:
                print("[MIGRATION] Adding column canteens.updated_at")
                cursor.execute("ALTER TABLE canteens ADD COLUMN updated_at DATETIME;")
                cursor.execute("UPDATE canteens SET updated_at = datetime('now') WHERE updated_at IS NULL;")

        # 3. Migrate `menu_items` table
        if "menu_items" in existing_tables:
            cols = get_existing_columns(cursor, "menu_items")
            if "description" not in cols:
                print("[MIGRATION] Adding column menu_items.description")
                cursor.execute("ALTER TABLE menu_items ADD COLUMN description TEXT;")
            if "preparation_time_minutes" not in cols:
                print("[MIGRATION] Adding column menu_items.preparation_time_minutes")
                cursor.execute("ALTER TABLE menu_items ADD COLUMN preparation_time_minutes INTEGER DEFAULT 10 NOT NULL;")
            if "pricing_type" not in cols:
                print("[MIGRATION] Adding column menu_items.pricing_type")
                cursor.execute("ALTER TABLE menu_items ADD COLUMN pricing_type VARCHAR DEFAULT 'FIXED' NOT NULL;")
            if "unit_info" not in cols:
                print("[MIGRATION] Adding column menu_items.unit_info")
                cursor.execute("ALTER TABLE menu_items ADD COLUMN unit_info VARCHAR;")
            if "is_verified" not in cols:
                print("[MIGRATION] Adding column menu_items.is_verified")
                cursor.execute("ALTER TABLE menu_items ADD COLUMN is_verified BOOLEAN DEFAULT 1 NOT NULL;")
            if "created_at" not in cols:
                print("[MIGRATION] Adding column menu_items.created_at")
                cursor.execute("ALTER TABLE menu_items ADD COLUMN created_at DATETIME;")
                cursor.execute("UPDATE menu_items SET created_at = datetime('now') WHERE created_at IS NULL;")
            if "updated_at" not in cols:
                print("[MIGRATION] Adding column menu_items.updated_at")
                cursor.execute("ALTER TABLE menu_items ADD COLUMN updated_at DATETIME;")
                cursor.execute("UPDATE menu_items SET updated_at = datetime('now') WHERE updated_at IS NULL;")

        # 4. Migrate `orders` table
        if "orders" in existing_tables:
            cols = get_existing_columns(cursor, "orders")
            if "order_number" not in cols:
                print("[MIGRATION] Adding column orders.order_number")
                cursor.execute("ALTER TABLE orders ADD COLUMN order_number VARCHAR;")
            if "subtotal" not in cols:
                print("[MIGRATION] Adding column orders.subtotal")
                cursor.execute("ALTER TABLE orders ADD COLUMN subtotal NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;")
            if "discount_amount" not in cols:
                print("[MIGRATION] Adding column orders.discount_amount")
                cursor.execute("ALTER TABLE orders ADD COLUMN discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;")
            if "service_fee" not in cols:
                print("[MIGRATION] Adding column orders.service_fee")
                cursor.execute("ALTER TABLE orders ADD COLUMN service_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;")
            if "pickup_code" not in cols:
                print("[MIGRATION] Adding column orders.pickup_code")
                cursor.execute("ALTER TABLE orders ADD COLUMN pickup_code VARCHAR(10);")
            if "estimated_preparation_minutes" not in cols:
                print("[MIGRATION] Adding column orders.estimated_preparation_minutes")
                cursor.execute("ALTER TABLE orders ADD COLUMN estimated_preparation_minutes INTEGER DEFAULT 15 NOT NULL;")
            if "accepted_at" not in cols:
                print("[MIGRATION] Adding column orders.accepted_at")
                cursor.execute("ALTER TABLE orders ADD COLUMN accepted_at DATETIME;")
            if "estimated_ready_at" not in cols:
                print("[MIGRATION] Adding column orders.estimated_ready_at")
                cursor.execute("ALTER TABLE orders ADD COLUMN estimated_ready_at DATETIME;")
            if "ready_at" not in cols:
                print("[MIGRATION] Adding column orders.ready_at")
                cursor.execute("ALTER TABLE orders ADD COLUMN ready_at DATETIME;")
            if "idempotency_key" not in cols:
                print("[MIGRATION] Adding column orders.idempotency_key")
                cursor.execute("ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR;")
            if "completed_at" not in cols:
                print("[MIGRATION] Adding column orders.completed_at")
                cursor.execute("ALTER TABLE orders ADD COLUMN completed_at DATETIME;")
            if "inventory_restored" not in cols:
                print("[MIGRATION] Adding column orders.inventory_restored")
                cursor.execute("ALTER TABLE orders ADD COLUMN inventory_restored BOOLEAN DEFAULT 0 NOT NULL;")
            if "updated_at" not in cols:
                print("[MIGRATION] Adding column orders.updated_at")
                cursor.execute("ALTER TABLE orders ADD COLUMN updated_at DATETIME;")
                cursor.execute("UPDATE orders SET updated_at = datetime('now') WHERE updated_at IS NULL;")

            # Backfill existing orders
            cursor.execute("SELECT id, total_amount, order_number, pickup_code FROM orders;")
            existing_orders = cursor.fetchall()
            for o_id, total, o_num, p_code in existing_orders:
                if not o_num:
                    new_order_num = f"ORD-20260902-LEGACY{o_id:04d}"
                    new_pickup = f"{random.randint(1000, 9999)}"
                    cursor.execute(
                        "UPDATE orders SET order_number = ?, pickup_code = ?, subtotal = ? WHERE id = ?;",
                        (new_order_num, new_pickup, total, o_id)
                    )

        # 5. Migrate `order_items` table
        if "order_items" in existing_tables:
            cols = get_existing_columns(cursor, "order_items")
            if "item_name" not in cols:
                print("[MIGRATION] Adding column order_items.item_name")
                cursor.execute("ALTER TABLE order_items ADD COLUMN item_name VARCHAR;")
            if "unit_price" not in cols:
                print("[MIGRATION] Adding column order_items.unit_price")
                cursor.execute("ALTER TABLE order_items ADD COLUMN unit_price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;")
            if "total_price" not in cols:
                print("[MIGRATION] Adding column order_items.total_price")
                cursor.execute("ALTER TABLE order_items ADD COLUMN total_price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;")

            # Backfill order_items from menu_items
            cursor.execute("""
                UPDATE order_items
                SET unit_price = price,
                    total_price = price * quantity,
                    item_name = COALESCE(
                        (SELECT name FROM menu_items WHERE menu_items.id = order_items.menu_item_id),
                        'Campus Meal Item'
                    )
                WHERE item_name IS NULL OR total_price = 0;
            """)

        # 6. Migrate `commission_ledgers` table
        if "commission_ledgers" in existing_tables:
            cols = get_existing_columns(cursor, "commission_ledgers")
            if "commission_rate" not in cols:
                print("[MIGRATION] Adding column commission_ledgers.commission_rate")
                cursor.execute("ALTER TABLE commission_ledgers ADD COLUMN commission_rate NUMERIC(5, 4) DEFAULT 0.05 NOT NULL;")

        conn.commit()
        conn.close()

    # Create all new tables using SQLAlchemy metadata
    Base.metadata.create_all(bind=engine)
    print("[MIGRATION] All table definitions verified and synced.")

    # Post-table creation: initialize inventory, wallets & seed college for existing records if missing
    with engine.begin() as db:
        # 1. Seed KIET University college
        db.execute(text("""
            INSERT OR IGNORE INTO colleges (id, name, code, location, is_active, created_at, updated_at)
            VALUES (1, 'KIET University', 'KIET', 'Ghaziabad, Delhi-NCR', 1, datetime('now'), datetime('now'));
        """))

        # Link any unlinked canteens to KIET University
        db.execute(text("""
            UPDATE canteens SET college_id = 1 WHERE college_id IS NULL;
        """))

        # 2. Wallets for users
        db.execute(text("""
            INSERT OR IGNORE INTO wallets (user_id, balance, currency, created_at, updated_at)
            SELECT id, 500.00, 'INR', datetime('now'), datetime('now')
            FROM users
            WHERE id NOT IN (SELECT user_id FROM wallets);
        """))

        # 3. Inventory for menu_items
        db.execute(text("""
            INSERT OR IGNORE INTO inventory (canteen_id, menu_item_id, quantity, minimum_stock, is_available, updated_at)
            SELECT canteen_id, id, 50, 5, 1, datetime('now')
            FROM menu_items
            WHERE id NOT IN (SELECT menu_item_id FROM inventory);
        """))

        # 4. Default Platform Commission Rate (5%)
        db.execute(text("""
            INSERT OR IGNORE INTO platform_settings (key, value, description, updated_at)
            VALUES ('commission_rate', '0.05', 'Platform commission percentage (0.05 = 5%)', datetime('now'));
        """))

    print("[MIGRATION] Safe migration completed successfully.")


if __name__ == "__main__":
    safe_migrate()
