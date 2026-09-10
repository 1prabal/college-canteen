from decimal import Decimal
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from . import models
from .migrate import safe_migrate
from .real_canteens_data import REAL_CANTEEN_MENUS

def seed_db():
    safe_migrate()
    db: Session = SessionLocal()

    try:
        print("[SEED] Verifying and populating development seed data...")

        # ----------------------------------------------------------------------
        # 1. Seed Users Across All Roles
        # ----------------------------------------------------------------------
        users_to_seed = [
            {
                "name": "Rahul Sharma",
                "college_id": "CS2024-089",
                "email": "rahul.sharma@college.edu",
                "phone": "+91 98765 43210",
                "role": models.UserRole.STUDENT,
            },
            {
                "name": "Prof. Ananya Sen",
                "college_id": "FACULTY-901",
                "email": "ananya.sen@college.edu",
                "phone": "+91 98765 43211",
                "role": models.UserRole.FACULTY,
            },
            {
                "name": "Suresh Kumar",
                "college_id": "STAFF-001",
                "email": "suresh.staff@canteen.college.edu",
                "phone": "+91 98765 43212",
                "role": models.UserRole.CANTEEN_STAFF,
            },
            {
                "name": "Ramesh Patel",
                "college_id": "STAFF-002",
                "email": "ramesh.staff@canteen.college.edu",
                "phone": "+91 98765 43213",
                "role": models.UserRole.CANTEEN_STAFF,
            },
            {
                "name": "Priya Nair",
                "college_id": "STAFF-003",
                "email": "priya.staff@canteen.college.edu",
                "phone": "+91 98765 43214",
                "role": models.UserRole.CANTEEN_STAFF,
            },
            {
                "name": "Chef Vikram",
                "college_id": "OWNER-001",
                "email": "vikram.owner@campusbites.edu",
                "phone": "+91 98765 43215",
                "role": models.UserRole.CANTEEN_OWNER,
            },
            {
                "name": "Anita Roy",
                "college_id": "OWNER-002",
                "email": "anita.owner@campusbites.edu",
                "phone": "+91 98765 43216",
                "role": models.UserRole.CANTEEN_OWNER,
            },
            {
                "name": "David Wilson",
                "college_id": "OWNER-003",
                "email": "david.owner@campusbites.edu",
                "phone": "+91 98765 43217",
                "role": models.UserRole.CANTEEN_OWNER,
            },
            {
                "name": "Admin User",
                "college_id": "ADMIN-001",
                "email": "admin@campusbites.edu",
                "phone": "+91 98765 43299",
                "role": models.UserRole.PLATFORM_ADMIN,
            },
            # Real Canteen Owners
            {
                "name": "Nescafe Manager",
                "college_id": "OWNER-NESCAFE",
                "email": "nescafe.owner@campusbites.edu",
                "phone": "+91 98765 43220",
                "role": models.UserRole.CANTEEN_OWNER,
            },
            {
                "name": "Hungry Nites Manager",
                "college_id": "OWNER-HUNGRY",
                "email": "hungrynites.owner@campusbites.edu",
                "phone": "+91 98765 43221",
                "role": models.UserRole.CANTEEN_OWNER,
            },
            {
                "name": "Big Treat Cafe Manager",
                "college_id": "OWNER-BIGTREAT",
                "email": "bigtreat.owner@campusbites.edu",
                "phone": "+91 98765 43222",
                "role": models.UserRole.CANTEEN_OWNER,
            },
            {
                "name": "The Healthy Hut Manager",
                "college_id": "OWNER-HEALTHY",
                "email": "healthyhut.owner@campusbites.edu",
                "phone": "+91 98765 43223",
                "role": models.UserRole.CANTEEN_OWNER,
            },
            # Real Canteen Staff
            {
                "name": "Sunil Sharma",
                "college_id": "STAFF-NES-01",
                "email": "sunil.nescafe@canteen.college.edu",
                "phone": "+91 98765 43224",
                "role": models.UserRole.CANTEEN_STAFF,
            },
            {
                "name": "Manoj Tiwari",
                "college_id": "STAFF-HN-01",
                "email": "manoj.hungrynites@canteen.college.edu",
                "phone": "+91 98765 43225",
                "role": models.UserRole.CANTEEN_STAFF,
            },
            {
                "name": "Rajesh Verma",
                "college_id": "STAFF-BT-01",
                "email": "rajesh.bigtreat@canteen.college.edu",
                "phone": "+91 98765 43226",
                "role": models.UserRole.CANTEEN_STAFF,
            },
            {
                "name": "Kavita Rao",
                "college_id": "STAFF-HH-01",
                "email": "kavita.healthyhut@canteen.college.edu",
                "phone": "+91 98765 43227",
                "role": models.UserRole.CANTEEN_STAFF,
            },
        ]

        user_map = {}
        for u_data in users_to_seed:
            user = db.query(models.User).filter(models.User.college_id == u_data["college_id"]).first()
            if not user:
                user = models.User(**u_data)
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"  [+] Created user: {user.name} ({user.role.value})")
            else:
                user.email = u_data["email"]
                user.role = u_data["role"]
                db.commit()
                db.refresh(user)
            user_map[user.college_id] = user

            # Ensure wallet exists
            wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user.id).first()
            if not wallet:
                wallet = models.Wallet(user_id=user.id, balance=Decimal("500.00"), currency="INR")
                db.add(wallet)
                db.commit()

        # ----------------------------------------------------------------------
        # ----------------------------------------------------------------------
        # 2. Seed Canteens with Owners (Legacy + 4 Real Canteens)
        # ----------------------------------------------------------------------
        canteens_data = [
            {
                "id": 1,
                "name": "Main Food Court",
                "location": "Block A, Ground Floor",
                "description": "The central campus food court serving fresh rolls, burgers, dosa and beverages.",
                "owner_id": user_map["OWNER-001"].id,
                "is_open": True,
                "is_active": True,
            },
            {
                "id": 2,
                "name": "Library Cafe",
                "location": "Block C, Ground Floor (Near Library)",
                "description": "Quiet gourmet cafe with South Indian specialties, freshly brewed filter coffee and healthy thalis.",
                "owner_id": user_map["OWNER-002"].id,
                "is_open": True,
                "is_active": True,
            },
            {
                "id": 3,
                "name": "Hostel Canteen",
                "location": "Hostel Quadrangle, Block D",
                "description": "Late-night student hub serving espresso coffees, grilled toasties, snacks and desserts.",
                "owner_id": user_map["OWNER-003"].id,
                "is_open": True,
                "is_active": True,
            },
            # Real College Canteen 1
            {
                "id": 4,
                "name": "NESCAFE",
                "location": "Campus Quadrangle, Kiosk Zone",
                "description": "Official campus Nescafe kiosk serving signature hot and iced coffees, hot chocolate, Maggi magic bowls, fresh patties, and chilled beverages.",
                "owner_id": user_map["OWNER-NESCAFE"].id,
                "is_open": True,
                "is_active": True,
            },
            # Real College Canteen 2
            {
                "id": 5,
                "name": "HUNGRY NITES",
                "location": "Hostel Avenue, Night Food Street",
                "description": "Favorite student hangout for quick bites, fries, spicy nuggets, burgers, shakes, and late night munchies.",
                "owner_id": user_map["OWNER-HUNGRY"].id,
                "is_open": True,
                "is_active": True,
            },
            # Real College Canteen 3
            {
                "id": 6,
                "name": "BIG TREAT CAFE",
                "location": "Student Activity Centre, Ground Floor",
                "description": "Multi-cuisine cafe featuring continental specials, loaded wraps, fresh pastries, celebration cakes, and refreshing fruit coolers.",
                "owner_id": user_map["OWNER-BIGTREAT"].id,
                "is_open": True,
                "is_active": True,
            },
            # Real College Canteen 4
            {
                "id": 7,
                "name": "THE HEALTHY HUT",
                "location": "Sports Complex & Gymnasium Wing",
                "description": "Nutritious campus hub serving fresh cold-pressed juices, protein bowls, seasonal fruit salads, sprouts, and wholesome wellness drinks.",
                "owner_id": user_map["OWNER-HEALTHY"].id,
                "is_open": True,
                "is_active": True,
            },
        ]

        canteen_map = {}
        for c_data in canteens_data:
            # First match by name (to support existing or new canteens idempotently)
            canteen = db.query(models.Canteen).filter(models.Canteen.name == c_data["name"]).first()
            if not canteen:
                # Then check by id if provided
                canteen = db.query(models.Canteen).filter(models.Canteen.id == c_data["id"]).first()
            if not canteen:
                canteen = models.Canteen(**c_data)
                db.add(canteen)
                db.commit()
                db.refresh(canteen)
                print(f"  [+] Created Canteen #{canteen.id}: {canteen.name}")
            else:
                canteen.description = c_data["description"]
                canteen.owner_id = c_data["owner_id"]
                canteen.is_open = c_data["is_open"]
                canteen.is_active = c_data["is_active"]
                canteen.location = c_data["location"]
                db.commit()
                db.refresh(canteen)
            canteen_map[canteen.name] = canteen
            canteen_map[canteen.id] = canteen

        # ----------------------------------------------------------------------
        # 3. Staff Assignments per Canteen
        # ----------------------------------------------------------------------
        staff_assignments = [
            (canteen_map[1].id, user_map["STAFF-001"].id, "MANAGER"),
            (canteen_map[2].id, user_map["STAFF-002"].id, "MANAGER"),
            (canteen_map[3].id, user_map["STAFF-003"].id, "MANAGER"),
            (canteen_map["NESCAFE"].id, user_map["STAFF-NES-01"].id, "MANAGER"),
            (canteen_map["HUNGRY NITES"].id, user_map["STAFF-HN-01"].id, "MANAGER"),
            (canteen_map["BIG TREAT CAFE"].id, user_map["STAFF-BT-01"].id, "MANAGER"),
            (canteen_map["THE HEALTHY HUT"].id, user_map["STAFF-HH-01"].id, "MANAGER"),
        ]

        for c_id, u_id, role in staff_assignments:
            staff = db.query(models.CanteenStaff).filter(models.CanteenStaff.user_id == u_id).first()
            if not staff:
                staff = models.CanteenStaff(canteen_id=c_id, user_id=u_id, role=role, is_active=True)
                db.add(staff)
                db.commit()
                print(f"  [+] Assigned staff user {u_id} to canteen {c_id}")
            else:
                staff.canteen_id = c_id
                staff.role = role
                db.commit()

        # ----------------------------------------------------------------------
        # 4. Seed Distinct Menu Items per Canteen
        # ----------------------------------------------------------------------
        menu_items_to_seed = [
            # Canteen 1: Main Food Court
            {
                "canteen_id": 1,
                "name": "Paneer Butter Masala Roll",
                "price": Decimal("85.00"),
                "category": "Fast Food",
                "description": "Flaky paratha stuffed with rich cottage cheese masala and fresh onions.",
                "preparation_time_minutes": 10,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80"
            },
            {
                "canteen_id": 1,
                "name": "Crispy Veg Burger + Fries",
                "price": Decimal("110.00"),
                "category": "Fast Food",
                "description": "Herb seasoned vegetable patty topped with lettuce, house sauce and crispy salted fries.",
                "preparation_time_minutes": 12,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
            },
            {
                "canteen_id": 1,
                "name": "Cold Coffee with Ice Cream",
                "price": Decimal("60.00"),
                "category": "Beverages",
                "description": "Blended chilled espresso with a scoop of creamy vanilla ice cream.",
                "preparation_time_minutes": 5,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80"
            },
            {
                "canteen_id": 1,
                "name": "Masala Dosa with Chutney",
                "price": Decimal("70.00"),
                "category": "South Indian",
                "description": "Crisp golden crepe filled with spiced potato mash served with sambar & coconut chutney.",
                "preparation_time_minutes": 8,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80"
            },

            # Canteen 2: Library Cafe
            {
                "canteen_id": 2,
                "name": "Idli Vada Combo (2+1)",
                "price": Decimal("50.00"),
                "category": "South Indian",
                "description": "Two steamed rice cakes and one crisp medu vada with hot lentil sambar.",
                "preparation_time_minutes": 5,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80"
            },
            {
                "canteen_id": 2,
                "name": "Traditional Filter Coffee",
                "price": Decimal("25.00"),
                "category": "Beverages",
                "description": "South Indian chicory brew frothed with boiling whole milk in brass tumbler.",
                "preparation_time_minutes": 4,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"
            },
            {
                "canteen_id": 2,
                "name": "Special Campus Veg Thali",
                "price": Decimal("120.00"),
                "category": "Meals",
                "description": "Balanced lunch platter with paneer gravy, dal tadka, rice, chapati, curd and sweet.",
                "preparation_time_minutes": 15,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&q=80"
            },

            # Canteen 3: Hostel Canteen
            {
                "canteen_id": 3,
                "name": "Cappuccino Espresso",
                "price": Decimal("75.00"),
                "category": "Beverages",
                "description": "Double espresso shot with velvety microfoam and cocoa dust.",
                "preparation_time_minutes": 5,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1572442388796-11668ba69e54?auto=format&fit=crop&w=400&q=80"
            },
            {
                "canteen_id": 3,
                "name": "Grilled Triple Cheese Sandwich",
                "price": Decimal("65.00"),
                "category": "Snacks",
                "description": "Sourdough toast loaded with mozzarella, cheddar and spiced jalapeño relish.",
                "preparation_time_minutes": 8,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80"
            },
            {
                "canteen_id": 3,
                "name": "Warm Chocolate Lava Cake",
                "price": Decimal("90.00"),
                "category": "Desserts",
                "description": "Decadent dark chocolate sponge with a molten fudge core.",
                "preparation_time_minutes": 6,
                "is_available": True,
                "image_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80"
            }
        ]

        for m_data in menu_items_to_seed:
            item = db.query(models.MenuItem).filter(
                models.MenuItem.canteen_id == m_data["canteen_id"],
                models.MenuItem.name == m_data["name"]
            ).first()
            if not item:
                item = models.MenuItem(**m_data)
                db.add(item)
                db.commit()
                db.refresh(item)
                print(f"  [+] Created Menu Item #{item.id}: {item.name} for Canteen #{item.canteen_id}")

            # Ensure inventory record exists
            inv = db.query(models.Inventory).filter(models.Inventory.menu_item_id == item.id).first()
            if not inv:
                inv = models.Inventory(
                    canteen_id=item.canteen_id,
                    menu_item_id=item.id,
                    quantity=60,
                    minimum_stock=10,
                    is_available=True
                )
                db.add(inv)
                db.commit()
            elif inv.quantity < 10:
                inv.quantity = 60
                inv.is_available = True
                db.commit()

        # ----------------------------------------------------------------------
        # 5. Seed Real Canteen Menus & Inventories
        # ----------------------------------------------------------------------
        print("[SEED] Populating real canteen menus (NESCAFE, HUNGRY NITES, BIG TREAT CAFE, THE HEALTHY HUT)...")
        for canteen_name, items in REAL_CANTEEN_MENUS.items():
            canteen_obj = canteen_map.get(canteen_name)
            if not canteen_obj:
                print(f"  [!] Warning: Canteen '{canteen_name}' not found in canteen_map!")
                continue

            for item_data in items:
                initial_stock = item_data.pop("initial_stock", 35)
                # Idempotent check: query by canteen_id and item name
                item = db.query(models.MenuItem).filter(
                    models.MenuItem.canteen_id == canteen_obj.id,
                    models.MenuItem.name == item_data["name"]
                ).first()

                if not item:
                    item = models.MenuItem(
                        canteen_id=canteen_obj.id,
                        name=item_data["name"],
                        category=item_data["category"],
                        price=item_data["price"],
                        pricing_type=item_data["pricing_type"],
                        unit_info=item_data.get("unit_info"),
                        is_verified=item_data["is_verified"],
                        description=item_data.get("description"),
                        preparation_time_minutes=item_data.get("preparation_time_minutes", 10),
                        is_available=item_data.get("is_available", True),
                        image_url=item_data.get("image_url")
                    )
                    db.add(item)
                    db.commit()
                    db.refresh(item)
                    print(f"  [+] Created [{canteen_name}] {item.name} (INR {item.price})")
                else:
                    item.price = item_data["price"]
                    item.pricing_type = item_data["pricing_type"]
                    item.unit_info = item_data.get("unit_info")
                    item.is_verified = item_data["is_verified"]
                    item.category = item_data["category"]
                    item.description = item_data.get("description")
                    item.preparation_time_minutes = item_data.get("preparation_time_minutes", item.preparation_time_minutes)
                    item.is_available = item_data.get("is_available", item.is_available)
                    if item_data.get("image_url"):
                        item.image_url = item_data["image_url"]
                    db.commit()
                    db.refresh(item)

                # Ensure inventory record exists and is synced
                inv = db.query(models.Inventory).filter(models.Inventory.menu_item_id == item.id).first()
                if not inv:
                    inv = models.Inventory(
                        canteen_id=canteen_obj.id,
                        menu_item_id=item.id,
                        quantity=initial_stock,
                        minimum_stock=max(5, int(initial_stock * 0.2)),
                        is_available=item.is_available
                    )
                    db.add(inv)
                    db.commit()
                elif inv.quantity < 5:
                    inv.quantity = initial_stock
                    inv.is_available = True
                    db.commit()
                else:
                    if not item.is_verified:
                        inv.quantity = 0
                        inv.is_available = False
                        db.commit()

        print("[SEED] Database seeding and synchronization completed successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
