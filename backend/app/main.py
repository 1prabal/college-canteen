import uuid
import random
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from .database import engine, Base, get_db
from . import models, schemas
from .websocket import manager
from .order_state import validate_transition, can_transition
from .payments import get_payment_gateway
from .migrate import safe_migrate

# Run safe database migration on startup
safe_migrate()

app = FastAPI(
    title="College Canteen Click & Collect API - Multi-Canteen Enterprise",
    version="2.0.0",
    description="Backend API supporting isolated multi-canteen operations, decimal ledger wallets, inventory tracking, role-based authorization, and secure pickup verification."
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# Helper Functions
# ==============================================================================

def generate_order_number() -> str:
    now_str = datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"ORD-{now_str}-{unique_suffix}"

def generate_pickup_code() -> str:
    return f"{random.randint(1000, 9999)}"

def generate_bill_number() -> str:
    now_str = datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"BILL-{now_str}-{unique_suffix}"

def get_platform_commission_rate(db: Session) -> Decimal:
    setting = db.query(models.PlatformSetting).filter(models.PlatformSetting.key == "commission_rate").first()
    if setting:
        try:
            return Decimal(setting.value)
        except Exception:
            return Decimal("0.05")
    return Decimal("0.05")

def format_order_response(order: models.Order) -> dict:
    return {
        "id": order.id,
        "order_number": order.order_number,
        "user_id": order.user_id,
        "canteen_id": order.canteen_id,
        "subtotal": float(order.subtotal),
        "discount_amount": float(order.discount_amount),
        "service_fee": float(order.service_fee),
        "total_amount": float(order.total_amount),
        "total_price": float(order.total_amount),  # Legacy frontend compatibility
        "status": order.status.value,
        "pickup_code": order.pickup_code,
        "estimated_preparation_minutes": order.estimated_preparation_minutes,
        "estimated_ready_at": order.estimated_ready_at.isoformat() if order.estimated_ready_at else None,
        "created_at": order.created_at.isoformat() if order.created_at else datetime.utcnow().isoformat(),
        "canteen_name": order.canteen.name if order.canteen else None,
        "user_name": order.user.name if order.user else None,
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "menu_item_id": item.menu_item_id,
                "item_name": item.item_name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price),
                "price": float(item.unit_price),  # Legacy frontend compatibility
                "menu_item_name": item.item_name,  # Legacy frontend compatibility
                "menu_item": {"name": item.item_name}  # Legacy OrderTracker compatibility
            }
            for item in order.order_items
        ],
        "status_history": [
            {
                "id": h.id,
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "changed_by": h.changed_by,
                "note": h.note,
                "created_at": h.created_at.isoformat()
            }
            for h in order.status_history
        ]
    }

async def create_and_send_notification(
    db: Session,
    user_id: int,
    order_id: Optional[int],
    notif_type: models.NotificationType,
    title: str,
    message: str
):
    notif = models.Notification(
        user_id=user_id,
        order_id=order_id,
        type=notif_type,
        title=title,
        message=message,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Push to real-time user notification WebSocket
    await manager.notify_user(user_id, {
        "type": "NEW_NOTIFICATION",
        "notification": {
            "id": notif.id,
            "order_id": notif.order_id,
            "type": notif.type.value,
            "title": notif.title,
            "message": notif.message,
            "created_at": notif.created_at.isoformat()
        }
    })
    return notif

# ==============================================================================
# Base / Health Route
# ==============================================================================
@app.get("/")
def read_root():
    return {
        "message": "Welcome to College Canteen Click & Collect Enterprise API",
        "version": "2.0.0",
        "status": "operational"
    }

# ==============================================================================
# User Management Routes
# ==============================================================================
@app.get("/api/users", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.get("/api/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/users", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.college_id == user.college_id).first()
    if existing:
        return existing

    db_user = models.User(
        name=user.name,
        college_id=user.college_id,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Initialize wallet for newly registered user
    wallet = models.Wallet(
        user_id=db_user.id,
        balance=Decimal("500.00"),  # Starter campus credit
        currency="INR"
    )
    db.add(wallet)
    db.commit()

    return db_user

# ==============================================================================
# Canteen Management Routes
# ==============================================================================
@app.get("/api/canteens", response_model=List[schemas.CanteenOut])
def get_canteens(db: Session = Depends(get_db)):
    canteens = db.query(models.Canteen).filter(models.Canteen.is_active == True).all()
    results = []
    for c in canteens:
        avail_count = db.query(models.MenuItem).filter(
            models.MenuItem.canteen_id == c.id,
            models.MenuItem.is_available == True
        ).count()
        items = db.query(models.MenuItem.preparation_time_minutes).filter(
            models.MenuItem.canteen_id == c.id
        ).all()
        avg_prep = round(sum(it[0] for it in items) / len(items)) if items else 10

        c_dict = schemas.CanteenOut(
            id=c.id,
            name=c.name,
            location=c.location,
            description=c.description,
            owner_id=c.owner_id,
            is_open=c.is_open,
            is_active=c.is_active,
            created_at=c.created_at,
            menu_items=[],
            available_items_count=avail_count,
            avg_prep_time=avg_prep
        )
        results.append(c_dict)
    return results

@app.get("/api/canteens/{canteen_id}", response_model=schemas.CanteenOut)
def get_canteen(canteen_id: int, db: Session = Depends(get_db)):
    canteen = db.query(models.Canteen).filter(models.Canteen.id == canteen_id).first()
    if not canteen:
        raise HTTPException(status_code=404, detail="Canteen not found")
    avail_count = db.query(models.MenuItem).filter(
        models.MenuItem.canteen_id == canteen.id,
        models.MenuItem.is_available == True
    ).count()
    items = db.query(models.MenuItem.preparation_time_minutes).filter(
        models.MenuItem.canteen_id == canteen.id
    ).all()
    avg_prep = round(sum(it[0] for it in items) / len(items)) if items else 10

    return schemas.CanteenOut(
        id=canteen.id,
        name=canteen.name,
        location=canteen.location,
        description=canteen.description,
        owner_id=canteen.owner_id,
        is_open=canteen.is_open,
        is_active=canteen.is_active,
        created_at=canteen.created_at,
        menu_items=[],
        available_items_count=avail_count,
        avg_prep_time=avg_prep
    )

@app.post("/api/canteens", response_model=schemas.CanteenOut)
def create_canteen(canteen: schemas.CanteenCreate, db: Session = Depends(get_db)):
    db_canteen = models.Canteen(
        name=canteen.name,
        location=canteen.location,
        description=canteen.description,
        owner_id=canteen.owner_id,
        is_open=canteen.is_open,
        is_active=canteen.is_active
    )
    db.add(db_canteen)
    db.commit()
    db.refresh(db_canteen)
    return db_canteen

@app.put("/api/canteens/{canteen_id}", response_model=schemas.CanteenOut)
def update_canteen(canteen_id: int, canteen_update: schemas.CanteenUpdate, db: Session = Depends(get_db)):
    canteen = db.query(models.Canteen).filter(models.Canteen.id == canteen_id).first()
    if not canteen:
        raise HTTPException(status_code=404, detail="Canteen not found")
    for key, value in canteen_update.model_dump(exclude_unset=True).items():
        setattr(canteen, key, value)
    db.commit()
    db.refresh(canteen)
    return canteen

# --- Canteen Staff Assignment ---
@app.get("/api/canteens/{canteen_id}/staff", response_model=List[schemas.CanteenStaffOut])
def get_canteen_staff(canteen_id: int, db: Session = Depends(get_db)):
    staff_entries = db.query(models.CanteenStaff).filter(models.CanteenStaff.canteen_id == canteen_id).all()
    results = []
    for s in staff_entries:
        results.append({
            "id": s.id,
            "canteen_id": s.canteen_id,
            "user_id": s.user_id,
            "user_name": s.user.name if s.user else None,
            "role": s.role,
            "is_active": s.is_active,
            "created_at": s.created_at
        })
    return results

@app.post("/api/canteens/{canteen_id}/staff", response_model=schemas.CanteenStaffOut)
def assign_canteen_staff(canteen_id: int, assign_data: schemas.CanteenStaffAssign, db: Session = Depends(get_db)):
    canteen = db.query(models.Canteen).filter(models.Canteen.id == canteen_id).first()
    if not canteen:
        raise HTTPException(status_code=404, detail="Canteen not found")
    user = db.query(models.User).filter(models.User.id == assign_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(models.CanteenStaff).filter(models.CanteenStaff.user_id == user.id).first()
    if existing:
        existing.canteen_id = canteen_id
        existing.role = assign_data.role
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "canteen_id": existing.canteen_id,
            "user_id": existing.user_id,
            "user_name": user.name,
            "role": existing.role,
            "is_active": existing.is_active,
            "created_at": existing.created_at
        }

    staff = models.CanteenStaff(
        canteen_id=canteen_id,
        user_id=user.id,
        role=assign_data.role,
        is_active=True
    )
    user.role = models.UserRole.CANTEEN_STAFF
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return {
        "id": staff.id,
        "canteen_id": staff.canteen_id,
        "user_id": staff.user_id,
        "user_name": user.name,
        "role": staff.role,
        "is_active": staff.is_active,
        "created_at": staff.created_at
    }

# ==============================================================================
# Menu Routes
# ==============================================================================
@app.get("/api/canteens/{canteen_id}/menu", response_model=List[schemas.MenuItemOut])
def get_canteen_menu(canteen_id: int, db: Session = Depends(get_db)):
    items = db.query(models.MenuItem).filter(models.MenuItem.canteen_id == canteen_id).all()
    out = []
    for it in items:
        stock = it.inventory.quantity if it.inventory else 0
        out.append({
            "id": it.id,
            "canteen_id": it.canteen_id,
            "name": it.name,
            "description": it.description,
            "price": it.price,
            "pricing_type": it.pricing_type.value if hasattr(it.pricing_type, "value") else str(it.pricing_type),
            "unit_info": it.unit_info,
            "is_verified": it.is_verified,
            "category": it.category,
            "is_available": it.is_available and (stock > 0),
            "image_url": it.image_url,
            "preparation_time_minutes": it.preparation_time_minutes,
            "stock_quantity": stock,
            "created_at": it.created_at
        })
    return out

@app.post("/api/menu-items", response_model=schemas.MenuItemOut)
def create_menu_item(item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    canteen = db.query(models.Canteen).filter(models.Canteen.id == item.canteen_id).first()
    if not canteen:
        raise HTTPException(status_code=404, detail="Canteen not found")

    p_type = models.PricingType.FIXED
    if item.pricing_type:
        try:
            p_type = models.PricingType(item.pricing_type)
        except ValueError:
            p_type = models.PricingType.FIXED

    db_item = models.MenuItem(
        canteen_id=item.canteen_id,
        name=item.name,
        description=item.description,
        price=Decimal(str(item.price)),
        pricing_type=p_type,
        unit_info=item.unit_info,
        is_verified=item.is_verified,
        category=item.category,
        is_available=item.is_available,
        image_url=item.image_url,
        preparation_time_minutes=item.preparation_time_minutes
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Initialize default inventory for the new dish
    inventory = models.Inventory(
        canteen_id=db_item.canteen_id,
        menu_item_id=db_item.id,
        quantity=50,
        minimum_stock=5,
        is_available=True
    )
    db.add(inventory)
    db.commit()
    db.refresh(inventory)

    return {
        "id": db_item.id,
        "canteen_id": db_item.canteen_id,
        "name": db_item.name,
        "description": db_item.description,
        "price": db_item.price,
        "pricing_type": db_item.pricing_type.value if hasattr(db_item.pricing_type, "value") else str(db_item.pricing_type),
        "unit_info": db_item.unit_info,
        "is_verified": db_item.is_verified,
        "category": db_item.category,
        "is_available": db_item.is_available,
        "image_url": db_item.image_url,
        "preparation_time_minutes": db_item.preparation_time_minutes,
        "stock_quantity": inventory.quantity,
        "created_at": db_item.created_at
    }

@app.put("/api/menu-items/{item_id}", response_model=schemas.MenuItemOut)
def update_menu_item(item_id: int, item_update: schemas.MenuItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    for key, value in item_update.model_dump(exclude_unset=True).items():
        if key == "price" and value is not None:
            setattr(db_item, key, Decimal(str(value)))
        elif key == "pricing_type" and value is not None:
            try:
                setattr(db_item, key, models.PricingType(value))
            except ValueError:
                pass
        else:
            setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    stock = db_item.inventory.quantity if db_item.inventory else 0
    return {
        "id": db_item.id,
        "canteen_id": db_item.canteen_id,
        "name": db_item.name,
        "description": db_item.description,
        "price": db_item.price,
        "pricing_type": db_item.pricing_type.value if hasattr(db_item.pricing_type, "value") else str(db_item.pricing_type),
        "unit_info": db_item.unit_info,
        "is_verified": db_item.is_verified,
        "category": db_item.category,
        "is_available": db_item.is_available,
        "image_url": db_item.image_url,
        "preparation_time_minutes": db_item.preparation_time_minutes,
        "stock_quantity": stock,
        "created_at": db_item.created_at
    }

@app.delete("/api/menu-items/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(db_item)
    db.commit()
    return {"detail": "Menu item deleted successfully"}

# ==============================================================================
# Inventory Routes
# ==============================================================================
@app.get("/api/canteens/{canteen_id}/inventory", response_model=List[schemas.InventoryOut])
def get_canteen_inventory(canteen_id: int, db: Session = Depends(get_db)):
    records = db.query(models.Inventory).filter(models.Inventory.canteen_id == canteen_id).all()
    return [
        {
            "id": r.id,
            "canteen_id": r.canteen_id,
            "menu_item_id": r.menu_item_id,
            "menu_item_name": r.menu_item.name if r.menu_item else "Unknown Item",
            "quantity": r.quantity,
            "minimum_stock": r.minimum_stock,
            "is_available": r.is_available and (r.quantity > 0),
            "updated_at": r.updated_at
        }
        for r in records
    ]

@app.post("/api/canteens/{canteen_id}/inventory/{item_id}/restock", response_model=schemas.InventoryOut)
def restock_inventory(
    canteen_id: int,
    item_id: int,
    restock: schemas.InventoryRestockRequest,
    db: Session = Depends(get_db)
):
    inv = db.query(models.Inventory).filter(
        models.Inventory.canteen_id == canteen_id,
        models.Inventory.menu_item_id == item_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    balance_before = inv.quantity
    balance_after = max(0, balance_before + restock.quantity_change)
    inv.quantity = balance_after
    inv.is_available = balance_after > 0

    tx = models.InventoryTransaction(
        inventory_id=inv.id,
        canteen_id=canteen_id,
        menu_item_id=item_id,
        change_type=models.InventoryTxType.RESTOCK if restock.quantity_change > 0 else models.InventoryTxType.MANUAL_ADJUSTMENT,
        quantity_change=restock.quantity_change,
        balance_before=balance_before,
        balance_after=balance_after,
        note=restock.note
    )
    db.add(tx)
    db.commit()
    db.refresh(inv)

    return {
        "id": inv.id,
        "canteen_id": inv.canteen_id,
        "menu_item_id": inv.menu_item_id,
        "menu_item_name": inv.menu_item.name if inv.menu_item else None,
        "quantity": inv.quantity,
        "minimum_stock": inv.minimum_stock,
        "is_available": inv.is_available,
        "updated_at": inv.updated_at
    }

# ==============================================================================
# Order Routes (Server-Side Calculation, Strict Validation & Isolation)
# ==============================================================================
@app.post("/api/orders")
async def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Duplicate Request Protection via Idempotency Key
    if order_data.idempotency_key:
        existing_order = db.query(models.Order).filter(
            models.Order.idempotency_key == order_data.idempotency_key
        ).first()
        if existing_order:
            return format_order_response(existing_order)

    # 2. Validate user
    user = db.query(models.User).filter(models.User.id == order_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. Validate canteen
    canteen = db.query(models.Canteen).filter(models.Canteen.id == order_data.canteen_id).first()
    if not canteen:
        raise HTTPException(status_code=404, detail="Canteen not found")
    if not canteen.is_open:
        raise HTTPException(status_code=400, detail="This canteen is currently closed.")

    if not order_data.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item.")

    # 4. Validate items, canteen isolation, availability & inventory
    subtotal = Decimal("0.00")
    order_items_to_create = []
    inventory_deductions = []
    max_prep_time = 10

    for item_req in order_data.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_req.menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item_req.menu_item_id} not found.")

        # Multi-Canteen Isolation Verification
        if menu_item.canteen_id != order_data.canteen_id:
            raise HTTPException(
                status_code=400,
                detail=f"Menu item '{menu_item.name}' belongs to Canteen #{menu_item.canteen_id}, not Canteen #{order_data.canteen_id}."
            )

        if not menu_item.is_verified:
            raise HTTPException(status_code=400, detail=f"Item '{menu_item.name}' requires manual price verification before ordering.")

        if not menu_item.is_available:
            raise HTTPException(status_code=400, detail=f"Item '{menu_item.name}' is currently unavailable.")

        # Inventory check
        inv = db.query(models.Inventory).filter(models.Inventory.menu_item_id == menu_item.id).first()
        if not inv or inv.quantity < item_req.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient inventory for '{menu_item.name}'. Available: {inv.quantity if inv else 0}."
            )

        # Server-side Decimal price calculation
        unit_price = Decimal(str(menu_item.price))
        item_total = unit_price * item_req.quantity
        subtotal += item_total
        max_prep_time = max(max_prep_time, menu_item.preparation_time_minutes)

        order_items_to_create.append(
            models.OrderItem(
                menu_item_id=menu_item.id,
                item_name=menu_item.name,  # Price & Name Snapshot
                quantity=item_req.quantity,
                unit_price=unit_price,
                total_price=item_total,
                price=unit_price  # Legacy column
            )
        )
        inventory_deductions.append((inv, item_req.quantity, menu_item.id))

    # Calculate final totals SERVER-SIDE (Zero trust in frontend sums)
    service_fee = Decimal("0.00")
    discount_amount = Decimal("0.00")
    total_amount = subtotal + service_fee - discount_amount

    order_num = generate_order_number()
    pickup = generate_pickup_code()
    est_ready = datetime.utcnow() + timedelta(minutes=max_prep_time)

    # Initial order status based on payment method
    initial_status = models.OrderStatus.PLACED
    initial_payment_status = models.PaymentStatus.PENDING

    # Create Order object
    db_order = models.Order(
        order_number=order_num,
        user_id=order_data.user_id,
        canteen_id=order_data.canteen_id,
        subtotal=subtotal,
        discount_amount=discount_amount,
        service_fee=service_fee,
        total_amount=total_amount,
        status=initial_status,
        pickup_code=pickup,
        estimated_preparation_minutes=max_prep_time,
        estimated_ready_at=est_ready,
        idempotency_key=order_data.idempotency_key,
        order_items=order_items_to_create
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Deduct Inventory and record transactions
    for inv, qty, m_id in inventory_deductions:
        b_before = inv.quantity
        b_after = b_before - qty
        inv.quantity = b_after
        inv.is_available = b_after > 0
        db.add(models.InventoryTransaction(
            inventory_id=inv.id,
            canteen_id=order_data.canteen_id,
            menu_item_id=m_id,
            change_type=models.InventoryTxType.ORDER_DEDUCTION,
            quantity_change=-qty,
            balance_before=b_before,
            balance_after=b_after,
            reference_id=order_num,
            note=f"Deduction for order #{order_num}"
        ))

    # Log initial order status in history
    db.add(models.OrderStatusHistory(
        order_id=db_order.id,
        previous_status=None,
        new_status=initial_status.value,
        changed_by=user.id,
        note="Order submitted by student"
    ))

    # Generate Bill
    bill = models.Bill(
        bill_number=generate_bill_number(),
        order_id=db_order.id,
        user_id=db_order.user_id,
        canteen_id=db_order.canteen_id,
        subtotal=subtotal,
        discount=discount_amount,
        service_fee=service_fee,
        total=total_amount,
        payment_status="PENDING",
        generated_at=datetime.utcnow()
    )
    db.add(bill)

    # Handle Payment Initiation / Mock Payment Execution
    gateway = get_payment_gateway()
    intent = await gateway.create_payment_intent(
        order_number=order_num,
        amount=total_amount,
        currency="INR",
        customer_info={"user_id": user.id, "name": user.name}
    )

    # Check if payment is via WALLET
    payment_method = (order_data.payment_method or "UPI").upper()
    payment_record = models.Payment(
        payment_reference=intent["payment_reference"],
        order_id=db_order.id,
        user_id=db_order.user_id,
        canteen_id=db_order.canteen_id,
        amount=total_amount,
        currency="INR",
        payment_method=payment_method,
        status=models.PaymentStatus.PENDING,
        gateway=intent["gateway"],
        gateway_transaction_id=intent["gateway_transaction_id"]
    )
    db.add(payment_record)
    db.commit()
    db.refresh(payment_record)

    # Process immediate confirmation if WALLET or auto-confirmed sandbox
    if "WALLET" in payment_method:
        user_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user.id).first()
        if not user_wallet or user_wallet.balance < total_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance. Current: ₹{user_wallet.balance if user_wallet else 0.00}, Required: ₹{total_amount}"
            )
        # Deduct wallet balance atomically
        bal_before = user_wallet.balance
        bal_after = bal_before - total_amount
        user_wallet.balance = bal_after

        # Ledger transaction
        db.add(models.WalletTransaction(
            wallet_id=user_wallet.id,
            user_id=user.id,
            transaction_reference=f"WTX-{uuid.uuid4().hex[:10].upper()}",
            transaction_type=models.WalletTxType.ORDER_PAYMENT,
            amount=-total_amount,
            balance_before=bal_before,
            balance_after=bal_after,
            order_id=db_order.id,
            status=models.WalletTxStatus.SUCCESS,
            description=f"Payment for order #{order_num}"
        ))
        payment_record.status = models.PaymentStatus.SUCCESS
        db_order.status = models.OrderStatus.PAYMENT_CONFIRMED
        bill.payment_status = "PAID"
    else:
        # For Sandbox / UPI simulation: verify mock payment
        verify_res = await gateway.verify_payment(
            gateway_payment_id=payment_record.gateway_transaction_id,
            order_number=order_num,
            expected_amount=total_amount
        )
        if verify_res.get("success"):
            payment_record.status = models.PaymentStatus.SUCCESS
            db_order.status = models.OrderStatus.PAYMENT_CONFIRMED
            bill.payment_status = "PAID"

    # Calculate and store platform commission
    commission_rate = get_platform_commission_rate(db)
    platform_fee = (total_amount * commission_rate).quantize(Decimal("0.01"))
    canteen_share = total_amount - platform_fee

    db.add(models.CommissionLedger(
        order_id=db_order.id,
        payment_id=payment_record.id,
        canteen_id=db_order.canteen_id,
        gross_amount=total_amount,
        platform_commission=platform_fee,
        payment_gateway_fee=Decimal("0.00"),
        canteen_amount=canteen_share
    ))

    # Log updated status in history if changed
    if db_order.status != initial_status:
        db.add(models.OrderStatusHistory(
            order_id=db_order.id,
            previous_status=initial_status.value,
            new_status=db_order.status.value,
            changed_by=user.id,
            note="Payment confirmed and verified"
        ))

    db.commit()
    db.refresh(db_order)

    # Real-time notification for student
    await create_and_send_notification(
        db,
        user_id=user.id,
        order_id=db_order.id,
        notif_type=models.NotificationType.ORDER_PLACED,
        title="Order Placed Successfully",
        message=f"Order #{order_num} has been sent to {canteen.name}. Pickup Code: {pickup}"
    )

    formatted_order = format_order_response(db_order)

    # Broadcast to Canteen Kitchen Queue via WebSocket
    # Sending both NEW_ORDER (frontend listener) and ORDER_CREATED
    await manager.broadcast_to_canteen(db_order.canteen_id, {
        "type": "NEW_ORDER",
        "order": formatted_order
    })
    await manager.broadcast_to_canteen(db_order.canteen_id, {
        "type": "ORDER_CREATED",
        "order": formatted_order
    })

    return formatted_order

@app.get("/api/canteens/{canteen_id}/orders")
def get_canteen_orders(
    canteen_id: int, 
    staff_user_id: Optional[int] = Query(None, description="Optional staff ID for strict isolation check"),
    db: Session = Depends(get_db)
):
    # Strict staff isolation check: if staff_user_id provided, verify assignment
    if staff_user_id is not None:
        staff_entry = db.query(models.CanteenStaff).filter(
            models.CanteenStaff.user_id == staff_user_id,
            models.CanteenStaff.canteen_id == canteen_id,
            models.CanteenStaff.is_active == True
        ).first()
        if not staff_entry:
            # Check if user is platform admin
            u = db.query(models.User).filter(models.User.id == staff_user_id).first()
            if not u or u.role not in (models.UserRole.PLATFORM_ADMIN, models.UserRole.ADMIN):
                raise HTTPException(
                    status_code=403,
                    detail=f"Access Denied: Staff #{staff_user_id} is not assigned to Canteen #{canteen_id}."
                )

    orders = db.query(models.Order).filter(
        models.Order.canteen_id == canteen_id
    ).order_by(models.Order.created_at.desc()).all()

    return [format_order_response(o) for o in orders]

@app.get("/api/orders/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return format_order_response(order)

@app.patch("/api/orders/{order_id}/status")
async def update_order_status(
    order_id: int, 
    status_update: schemas.OrderStatusUpdate, 
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # State Machine Transition Validation
    validate_transition(order.status, status_update.status)

    prev_status = order.status.value
    order.status = status_update.status

    # Log status history
    db.add(models.OrderStatusHistory(
        order_id=order.id,
        previous_status=prev_status,
        new_status=status_update.status.value,
        changed_by=status_update.changed_by,
        note=status_update.note or f"Status transitioned to {status_update.status.value}"
    ))

    # If status is READY or PREPARING, send specific push notification
    if status_update.status == models.OrderStatus.READY:
        await create_and_send_notification(
            db,
            user_id=order.user_id,
            order_id=order.id,
            notif_type=models.NotificationType.ORDER_READY,
            title="Order Ready for Pickup!",
            message=f"Your meal #{order.order_number} is ready at {order.canteen.name}! Show pickup code {order.pickup_code}."
        )
    elif status_update.status == models.OrderStatus.PREPARING:
        await create_and_send_notification(
            db,
            user_id=order.user_id,
            order_id=order.id,
            notif_type=models.NotificationType.ORDER_PREPARING,
            title="Order in Kitchen",
            message=f"The kitchen has started preparing your order #{order.order_number}."
        )

    # If order is CANCELLED or REJECTED, restore inventory
    if status_update.status in (models.OrderStatus.CANCELLED, models.OrderStatus.REJECTED):
        for item in order.order_items:
            inv = db.query(models.Inventory).filter(models.Inventory.menu_item_id == item.menu_item_id).first()
            if inv:
                b_before = inv.quantity
                b_after = b_before + item.quantity
                inv.quantity = b_after
                inv.is_available = True
                db.add(models.InventoryTransaction(
                    inventory_id=inv.id,
                    canteen_id=order.canteen_id,
                    menu_item_id=item.menu_item_id,
                    change_type=models.InventoryTxType.ORDER_RESTORE,
                    quantity_change=item.quantity,
                    balance_before=b_before,
                    balance_after=b_after,
                    reference_id=order.order_number,
                    note=f"Restored on order {status_update.status.value}"
                ))

    db.commit()
    db.refresh(order)

    formatted_order = format_order_response(order)

    # Broadcast to Canteen kitchen board and Student live tracker
    await manager.broadcast_to_canteen(order.canteen_id, {
        "type": "ORDER_STATUS_UPDATED",
        "order_id": order.id,
        "status": order.status.value,
        "order": formatted_order
    })
    await manager.broadcast_to_canteen(order.canteen_id, {
        "type": "STATUS_UPDATED",
        "order": formatted_order
    })
    await manager.notify_order_update(order.id, {
        "type": "ORDER_STATUS_UPDATED",
        "order_id": order.id,
        "status": order.status.value,
        "order": formatted_order
    })

    return formatted_order

@app.patch("/api/orders/{order_id}/prep-time")
async def update_preparation_time(
    order_id: int,
    prep_update: schemas.PrepTimeUpdate,
    staff_user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_minutes = prep_update.estimated_preparation_minutes
    order.estimated_preparation_minutes = new_minutes
    order.estimated_ready_at = datetime.utcnow() + timedelta(minutes=new_minutes)

    db.add(models.OrderStatusHistory(
        order_id=order.id,
        previous_status=order.status.value,
        new_status=order.status.value,
        changed_by=staff_user_id,
        note=f"Estimated preparation time adjusted to {new_minutes} minutes"
    ))
    db.commit()
    db.refresh(order)

    formatted_order = format_order_response(order)

    await create_and_send_notification(
        db,
        user_id=order.user_id,
        order_id=order.id,
        notif_type=models.NotificationType.PREPARATION_TIME_UPDATED,
        title="Preparation Time Updated",
        message=f"Estimated preparation time for #{order.order_number} is now {new_minutes} minutes."
    )

    # Broadcast
    await manager.broadcast_to_canteen(order.canteen_id, {
        "type": "PREPARATION_TIME_UPDATED",
        "order_id": order.id,
        "estimated_preparation_minutes": new_minutes,
        "estimated_ready_at": order.estimated_ready_at.isoformat(),
        "order": formatted_order
    })
    await manager.notify_order_update(order.id, {
        "type": "PREPARATION_TIME_UPDATED",
        "order_id": order.id,
        "estimated_preparation_minutes": new_minutes,
        "estimated_ready_at": order.estimated_ready_at.isoformat(),
        "order": formatted_order
    })

    return formatted_order

@app.get("/api/users/{user_id}/orders")
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(models.Order.user_id == user_id).order_by(models.Order.created_at.desc()).all()
    return [format_order_response(o) for o in orders]

# ==============================================================================
# Secure Pickup Verification Route
# ==============================================================================
@app.post("/api/orders/{order_id}/verify-pickup")
async def verify_pickup(
    order_id: int, 
    verify_req: schemas.PickupVerificationRequest, 
    staff_user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Prevent duplicate pickup of already completed order
    if order.status == models.OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Order #{order.order_number} has already been picked up and marked COMPLETED. Duplicate pickup rejected."
        )

    # Verify pickup code
    if order.pickup_code.strip() != verify_req.pickup_code.strip():
        raise HTTPException(status_code=400, detail="Invalid pickup verification code.")

    prev_status = order.status.value
    order.status = models.OrderStatus.COMPLETED

    db.add(models.OrderStatusHistory(
        order_id=order.id,
        previous_status=prev_status,
        new_status=models.OrderStatus.COMPLETED.value,
        changed_by=staff_user_id,
        note=f"Pickup verified successfully with code {verify_req.pickup_code}"
    ))
    db.commit()
    db.refresh(order)

    formatted_order = format_order_response(order)

    # Notify student
    await create_and_send_notification(
        db,
        user_id=order.user_id,
        order_id=order.id,
        notif_type=models.NotificationType.ORDER_READY,
        title="Meal Collected",
        message=f"Order #{order.order_number} marked COMPLETED. Enjoy your meal!"
    )

    # Broadcast
    await manager.notify_order_update(order.id, {
        "type": "ORDER_STATUS_UPDATED",
        "order_id": order.id,
        "status": models.OrderStatus.COMPLETED.value,
        "order": formatted_order
    })
    await manager.broadcast_to_canteen(order.canteen_id, {
        "type": "ORDER_STATUS_UPDATED",
        "order_id": order.id,
        "status": models.OrderStatus.COMPLETED.value,
        "order": formatted_order
    })

    return {
        "success": True,
        "message": f"Order #{order.order_number} successfully verified and handed over.",
        "order": formatted_order
    }

# ==============================================================================
# Wallet & Ledger Routes
# ==============================================================================
@app.get("/api/wallet", response_model=schemas.WalletOut)
def get_user_wallet(user_id: int = Query(..., description="User ID"), db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=user_id, balance=Decimal("0.00"), currency="INR")
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

@app.post("/api/wallet/recharge", response_model=schemas.WalletTransactionOut)
def recharge_wallet(recharge_req: schemas.WalletRechargeRequest, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == recharge_req.user_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=recharge_req.user_id, balance=Decimal("0.00"), currency="INR")
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    amount = Decimal(str(recharge_req.amount))
    balance_before = wallet.balance
    balance_after = balance_before + amount
    wallet.balance = balance_after

    tx = models.WalletTransaction(
        wallet_id=wallet.id,
        user_id=wallet.user_id,
        transaction_reference=f"RECH-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        transaction_type=models.WalletTxType.WALLET_RECHARGE,
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status=models.WalletTxStatus.SUCCESS,
        description=f"Wallet top-up via {recharge_req.payment_method}"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@app.get("/api/wallet/transactions", response_model=List[schemas.WalletTransactionOut])
def get_wallet_transactions(user_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(models.WalletTransaction).filter(
        models.WalletTransaction.user_id == user_id
    ).order_by(models.WalletTransaction.created_at.desc()).all()

# ==============================================================================
# Refund Routes
# ==============================================================================
@app.get("/api/refunds", response_model=List[schemas.RefundOut])
def list_refunds(canteen_id: Optional[int] = None, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Refund)
    if canteen_id:
        query = query.filter(models.Refund.canteen_id == canteen_id)
    if user_id:
        query = query.filter(models.Refund.user_id == user_id)
    return query.order_by(models.Refund.created_at.desc()).all()

@app.post("/api/refunds/request", response_model=schemas.RefundOut)
async def request_refund(refund_req: schemas.RefundCreateRequest, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == refund_req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if a refund has already been requested
    existing_refund = db.query(models.Refund).filter(
        models.Refund.order_id == order.id,
        models.Refund.status.in_([models.RefundStatus.REQUESTED, models.RefundStatus.APPROVED, models.RefundStatus.COMPLETED])
    ).first()
    if existing_refund:
        raise HTTPException(status_code=400, detail="A refund has already been requested or processed for this order.")

    refund_amount = Decimal(str(refund_req.amount)) if refund_req.amount is not None else order.total_amount
    if refund_amount > order.total_amount:
        raise HTTPException(status_code=400, detail="Refund amount cannot exceed total order amount.")

    payment = db.query(models.Payment).filter(
        models.Payment.order_id == order.id,
        models.Payment.status == models.PaymentStatus.SUCCESS
    ).first()

    refund = models.Refund(
        refund_reference=f"REF-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        order_id=order.id,
        payment_id=payment.id if payment else None,
        user_id=order.user_id,
        canteen_id=order.canteen_id,
        amount=refund_amount,
        reason=refund_req.reason,
        status=models.RefundStatus.REQUESTED
    )
    db.add(refund)

    # Transition order status to REFUND_REQUESTED if valid
    if can_transition(order.status, models.OrderStatus.REFUND_REQUESTED):
        order.status = models.OrderStatus.REFUND_REQUESTED
        db.add(models.OrderStatusHistory(
            order_id=order.id,
            previous_status=order.status.value,
            new_status=models.OrderStatus.REFUND_REQUESTED.value,
            changed_by=order.user_id,
            note=f"Refund requested: {refund_req.reason}"
        ))

    db.commit()
    db.refresh(refund)
    return refund

@app.post("/api/refunds/{refund_id}/process", response_model=schemas.RefundOut)
async def process_refund(refund_id: int, process_req: schemas.RefundProcessRequest, db: Session = Depends(get_db)):
    refund = db.query(models.Refund).filter(models.Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund record not found")

    if refund.status in (models.RefundStatus.COMPLETED, models.RefundStatus.REJECTED):
        raise HTTPException(status_code=400, detail=f"Refund is already in terminal status: {refund.status.value}")

    refund.status = process_req.status

    if process_req.status == models.RefundStatus.COMPLETED:
        order = db.query(models.Order).filter(models.Order.id == refund.order_id).first()
        payment = db.query(models.Payment).filter(models.Payment.id == refund.payment_id).first() if refund.payment_id else None

        # If payment was WALLET, credit wallet ledger
        if payment and "WALLET" in payment.payment_method:
            user_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == refund.user_id).first()
            if user_wallet:
                bal_before = user_wallet.balance
                bal_after = bal_before + refund.amount
                user_wallet.balance = bal_after
                db.add(models.WalletTransaction(
                    wallet_id=user_wallet.id,
                    user_id=refund.user_id,
                    transaction_reference=f"WTX-REF-{uuid.uuid4().hex[:8].upper()}",
                    transaction_type=models.WalletTxType.REFUND,
                    amount=refund.amount,
                    balance_before=bal_before,
                    balance_after=bal_after,
                    order_id=refund.order_id,
                    status=models.WalletTxStatus.SUCCESS,
                    description=f"Refund credited for order #{order.order_number if order else refund.order_id}"
                ))
        else:
            # External / Sandbox mock refund
            gateway = get_payment_gateway()
            await gateway.process_refund(
                gateway_payment_id=payment.gateway_transaction_id if payment else "UNKNOWN",
                amount=refund.amount,
                reason=refund.reason
            )

        if payment:
            payment.status = models.PaymentStatus.REFUNDED

        if order and can_transition(order.status, models.OrderStatus.REFUNDED):
            order.status = models.OrderStatus.REFUNDED
            db.add(models.OrderStatusHistory(
                order_id=order.id,
                previous_status=order.status.value,
                new_status=models.OrderStatus.REFUNDED.value,
                note=process_req.note or "Refund completed"
            ))

        await create_and_send_notification(
            db,
            user_id=refund.user_id,
            order_id=refund.order_id,
            notif_type=models.NotificationType.REFUND_COMPLETED,
            title="Refund Processed",
            message=f"Refund of ₹{refund.amount} has been successfully credited for order #{order.order_number if order else refund.order_id}."
        )

    db.commit()
    db.refresh(refund)
    return refund

# ==============================================================================
# Bill & Receipt Routes
# ==============================================================================
def format_bill_detail(bill: models.Bill) -> dict:
    order = bill.order
    user = order.user if order else None
    return {
        "id": bill.id,
        "bill_number": bill.bill_number,
        "order_id": bill.order_id,
        "user_id": bill.user_id,
        "canteen_id": bill.canteen_id,
        "subtotal": bill.subtotal,
        "discount": bill.discount,
        "service_fee": bill.service_fee,
        "total": bill.total,
        "payment_status": bill.payment_status,
        "generated_at": bill.generated_at,
        "canteen_name": order.canteen.name if order and order.canteen else None,
        "user_name": user.name if user else None,
        "user_college_id": user.college_id if user else None,
        "user_role": user.role.value if user else None,
        "order_number": order.order_number if order else None,
        "order_status": order.status.value if order else None,
        "pickup_code": order.pickup_code if order else None,
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "menu_item_id": item.menu_item_id,
                "item_name": item.item_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
                "price": item.unit_price,
                "menu_item_name": item.item_name,
                "menu_item": {"name": item.item_name}
            }
            for item in (order.order_items if order else [])
        ]
    }

@app.get("/api/bills/{order_id}", response_model=schemas.BillDetailOut)
def get_order_bill(order_id: int, db: Session = Depends(get_db)):
    bill = db.query(models.Bill).filter(models.Bill.order_id == order_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found for this order.")
    return format_bill_detail(bill)

@app.get("/api/canteens/{canteen_id}/bills", response_model=List[schemas.BillDetailOut])
def get_canteen_bills(canteen_id: int, db: Session = Depends(get_db)):
    bills = db.query(models.Bill).filter(models.Bill.canteen_id == canteen_id).order_by(models.Bill.generated_at.desc()).all()
    return [format_bill_detail(b) for b in bills]

@app.get("/api/canteens/{canteen_id}/categories", response_model=List[str])
def get_canteen_categories(canteen_id: int, db: Session = Depends(get_db)):
    cats = db.query(models.MenuItem.category).filter(
        models.MenuItem.canteen_id == canteen_id
    ).distinct().all()
    return [c[0] for c in cats if c[0]]

@app.get("/api/canteens/{canteen_id}/sales", response_model=schemas.CanteenSalesOut)
def get_canteen_sales(canteen_id: int, db: Session = Depends(get_db)):
    canteen = db.query(models.Canteen).filter(models.Canteen.id == canteen_id).first()
    if not canteen:
        raise HTTPException(status_code=404, detail="Canteen not found")
    orders = db.query(models.Order).filter(models.Order.canteen_id == canteen_id).all()
    
    today = datetime.utcnow().date()
    total_gross = Decimal("0.00")
    today_sales = Decimal("0.00")
    completed_orders = 0
    pending_orders = 0
    active_orders = 0
    today_orders_count = 0
    
    for o in orders:
        total_gross += o.total_amount
        if o.created_at and o.created_at.date() == today:
            today_sales += o.total_amount
            today_orders_count += 1
        if o.status == models.OrderStatus.COMPLETED:
            completed_orders += 1
        elif o.status in (models.OrderStatus.PLACED, models.OrderStatus.PAYMENT_PENDING, models.OrderStatus.PAYMENT_CONFIRMED):
            pending_orders += 1
        elif o.status in (models.OrderStatus.ACCEPTED, models.OrderStatus.PREPARING, models.OrderStatus.READY):
            active_orders += 1
            
    return {
        "canteen_id": canteen.id,
        "canteen_name": canteen.name,
        "total_gross_sales": total_gross,
        "today_sales": today_sales,
        "total_orders": len(orders),
        "today_orders": today_orders_count,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "active_orders": active_orders
    }

# ==============================================================================
# Notification Routes
# ==============================================================================
@app.get("/api/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(user_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.created_at.desc()).all()

@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"success": True}

# ==============================================================================
# Platform Commission & Admin Analytics
# ==============================================================================
@app.get("/api/admin/commission-rate")
def get_commission_rate(db: Session = Depends(get_db)):
    rate = get_platform_commission_rate(db)
    return {
        "commission_rate": float(rate),
        "percentage": f"{float(rate * 100):.1f}%"
    }

@app.put("/api/admin/commission-rate")
def update_commission_rate(rate: float = Query(..., ge=0.0, le=1.0), db: Session = Depends(get_db)):
    setting = db.query(models.PlatformSetting).filter(models.PlatformSetting.key == "commission_rate").first()
    if not setting:
        setting = models.PlatformSetting(key="commission_rate", value=str(rate), description="Platform commission percentage")
        db.add(setting)
    else:
        setting.value = str(rate)
    db.commit()
    return {
        "success": True,
        "new_commission_rate": rate,
        "percentage": f"{rate * 100:.1f}%"
    }

@app.get("/api/admin/overview", response_model=schemas.PlatformOverviewOut)
def get_platform_overview(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_students = db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).count()
    total_faculty = db.query(models.User).filter(models.User.role == models.UserRole.FACULTY).count()
    total_staff = db.query(models.User).filter(models.User.role.in_([models.UserRole.CANTEEN_STAFF, models.UserRole.CANTEEN_OWNER])).count()
    total_canteens = db.query(models.Canteen).filter(models.Canteen.is_active == True).count()
    orders = db.query(models.Order).all()
    today = datetime.utcnow().date()
    today_orders = sum(1 for o in orders if o.created_at and o.created_at.date() == today)
    total_tx_val = sum((o.total_amount for o in orders), Decimal("0.00"))
    rate = get_platform_commission_rate(db)
    platform_earnings = sum((l.platform_commission for l in db.query(models.CommissionLedger).all()), Decimal("0.00"))
    pending_refunds = db.query(models.Refund).filter(models.Refund.status == models.RefundStatus.REQUESTED).count()
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_canteen_staff": total_staff,
        "total_canteens": total_canteens,
        "total_orders": len(orders),
        "today_orders": today_orders,
        "total_transaction_value": total_tx_val,
        "total_platform_earnings": platform_earnings,
        "pending_refunds": pending_refunds,
        "commission_rate": float(rate)
    }

@app.get("/api/admin/canteen-analytics", response_model=List[schemas.CanteenAnalyticsOut])
def get_admin_canteen_analytics(db: Session = Depends(get_db)):
    canteens = db.query(models.Canteen).filter(models.Canteen.is_active == True).all()
    results = []
    for c in canteens:
        c_orders = db.query(models.Order).filter(models.Order.canteen_id == c.id).all()
        gross = sum((o.total_amount for o in c_orders), Decimal("0.00"))
        ledgers = db.query(models.CommissionLedger).filter(models.CommissionLedger.canteen_id == c.id).all()
        comm = sum((l.platform_commission for l in ledgers), Decimal("0.00"))
        c_refunds = sum((r.amount for r in db.query(models.Refund).filter(
            models.Refund.canteen_id == c.id,
            models.Refund.status == models.RefundStatus.COMPLETED
        ).all()), Decimal("0.00"))
        net_canteen = gross - comm - c_refunds
        results.append({
            "canteen_id": c.id,
            "name": c.name,
            "location": c.location,
            "owner_name": c.owner.name if c.owner else "Unassigned",
            "total_orders": len(c_orders),
            "gross_sales": gross,
            "platform_commission": comm,
            "payment_fees": Decimal("0.00"),
            "refunds": c_refunds,
            "net_canteen_earnings": net_canteen,
            "platform_earnings": comm
        })
    return results

# ==============================================================================
# WebSockets
# ==============================================================================
@app.websocket("/ws/canteen/{canteen_id}")
async def canteen_websocket(websocket: WebSocket, canteen_id: int):
    await manager.connect_canteen(canteen_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_canteen(canteen_id, websocket)

@app.websocket("/ws/order/{order_id}")
async def order_websocket(websocket: WebSocket, order_id: int):
    await manager.connect_order(order_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_order(order_id, websocket)

@app.websocket("/ws/user/{user_id}")
async def user_websocket(websocket: WebSocket, user_id: int):
    await manager.connect_user(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_user(user_id, websocket)
