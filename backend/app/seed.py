from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from . import models

def seed_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(models.Canteen).first():
            print("Database already contains data.")
            return

        print("Seeding sample data...")

        # 1. Create Default Users
        student_user = models.User(name="Rahul Sharma", college_id="CS2024-089", role=models.UserRole.STUDENT)
        staff_user = models.User(name="Suresh Kumar", college_id="STAFF-001", role=models.UserRole.CANTEEN_STAFF)
        admin_user = models.User(name="Admin User", college_id="ADMIN-001", role=models.UserRole.ADMIN)

        db.add_all([student_user, staff_user, admin_user])
        db.commit()

        # 2. Create Canteens
        canteen1 = models.Canteen(name="Main Food Court", location="Block A, Ground Floor", is_open=True)
        canteen2 = models.Canteen(name="South Canteen", location="Block C, Near Library", is_open=True)
        canteen3 = models.Canteen(name="Tech Park Cafe", location="Engineering Wing, 2nd Floor", is_open=True)

        db.add_all([canteen1, canteen2, canteen3])
        db.commit()

        # 3. Create Menu Items
        menu_items = [
            # Main Food Court Items
            models.MenuItem(
                canteen_id=canteen1.id,
                name="Paneer Butter Masala Roll",
                price=85.0,
                category="Fast Food",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80"
            ),
            models.MenuItem(
                canteen_id=canteen1.id,
                name="Crispy Veg Burger + Fries",
                price=110.0,
                category="Fast Food",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
            ),
            models.MenuItem(
                canteen_id=canteen1.id,
                name="Cold Coffee with Ice Cream",
                price=60.0,
                category="Beverages",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80"
            ),
            models.MenuItem(
                canteen_id=canteen1.id,
                name="Masala Dosa with Chutney",
                price=70.0,
                category="South Indian",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80"
            ),

            # South Canteen Items
            models.MenuItem(
                canteen_id=canteen2.id,
                name="Idli Vada Combo (2+1)",
                price=50.0,
                category="South Indian",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80"
            ),
            models.MenuItem(
                canteen_id=canteen2.id,
                name="Filter Coffee",
                price=25.0,
                category="Beverages",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"
            ),
            models.MenuItem(
                canteen_id=canteen2.id,
                name="Special Veg Thali",
                price=120.0,
                category="Meals",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&q=80"
            ),

            # Tech Park Cafe Items
            models.MenuItem(
                canteen_id=canteen3.id,
                name="Cappuccino Espresso",
                price=75.0,
                category="Beverages",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1572442388796-11668ba69e54?auto=format&fit=crop&w=400&q=80"
            ),
            models.MenuItem(
                canteen_id=canteen3.id,
                name="Grilled Cheese Sandwich",
                price=65.0,
                category="Snacks",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80"
            ),
            models.MenuItem(
                canteen_id=canteen3.id,
                name="Chocolate Lava Cake",
                price=90.0,
                category="Desserts",
                is_available=True,
                image_url="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80"
            )
        ]

        db.add_all(menu_items)
        db.commit()
        print("Database seeded successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
