from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from . import models, schemas
from .websocket import manager

# Create tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="College Canteen Click & Collect API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to College Canteen Click & Collect API"}

# --- User Routes ---
@app.post("/api/users", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.college_id == user.college_id).first()
    if existing:
        return existing
    db_user = models.User(name=user.name, college_id=user.college_id, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Canteen Routes ---
@app.get("/api/canteens", response_model=List[schemas.CanteenOut])
def get_canteens(db: Session = Depends(get_db)):
    return db.query(models.Canteen).all()

@app.get("/api/canteens/{canteen_id}", response_model=schemas.CanteenOut)
def get_canteen(canteen_id: int, db: Session = Depends(get_db)):
    canteen = db.query(models.Canteen).filter(models.Canteen.id == canteen_id).first()
    if not canteen:
        raise HTTPException(status_code=404, detail="Canteen not found")
    return canteen

@app.post("/api/canteens", response_model=schemas.CanteenOut)
def create_canteen(canteen: schemas.CanteenCreate, db: Session = Depends(get_db)):
    db_canteen = models.Canteen(**canteen.model_dump())
    db.add(db_canteen)
    db.commit()
    db.refresh(db_canteen)
    return db_canteen

# --- Menu Routes ---
@app.get("/api/canteens/{canteen_id}/menu", response_model=List[schemas.MenuItemOut])
def get_canteen_menu(canteen_id: int, db: Session = Depends(get_db)):
    return db.query(models.MenuItem).filter(models.MenuItem.canteen_id == canteen_id).all()

@app.post("/api/menu-items", response_model=schemas.MenuItemOut)
def create_menu_item(item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    db_item = models.MenuItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put("/api/menu-items/{item_id}", response_model=schemas.MenuItemOut)
def update_menu_item(item_id: int, item: schemas.MenuItemBase, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for key, value in item.model_dump().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/menu-items/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(db_item)
    db.commit()
    return {"detail": "Menu item deleted"}

# Helper to format order dictionary
def format_order_response(order: models.Order) -> dict:
    return {
        "id": order.id,
        "user_id": order.user_id,
        "canteen_id": order.canteen_id,
        "total_amount": order.total_amount,
        "status": order.status.value,
        "created_at": order.created_at.isoformat(),
        "canteen_name": order.canteen.name if order.canteen else None,
        "user_name": order.user.name if order.user else None,
        "items": [
            {
                "id": item.id,
                "menu_item_id": item.menu_item_id,
                "quantity": item.quantity,
                "price": item.price,
                "menu_item_name": item.menu_item.name if item.menu_item else "Unknown Item"
            }
            for item in order.order_items
        ]
    }

# --- Order Routes ---
@app.post("/api/orders")
async def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == order_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    canteen = db.query(models.Canteen).filter(models.Canteen.id == order_data.canteen_id).first()
    if not canteen:
        raise HTTPException(status_code=404, detail="Canteen not found")

    total_amount = 0.0
    order_items_to_create = []

    for item in order_data.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item.menu_item_id).first()
        if not menu_item or not menu_item.is_available:
            raise HTTPException(status_code=400, detail=f"Menu item {item.menu_item_id} is unavailable")
        item_total = menu_item.price * item.quantity
        total_amount += item_total
        order_items_to_create.append(
            models.OrderItem(
                menu_item_id=menu_item.id,
                quantity=item.quantity,
                price=menu_item.price
            )
        )

    db_order = models.Order(
        user_id=order_data.user_id,
        canteen_id=order_data.canteen_id,
        total_amount=round(total_amount, 2),
        status=models.OrderStatus.PENDING,
        order_items=order_items_to_create
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    formatted_order = format_order_response(db_order)

    # Broadcast new order to canteen dashboard via WebSocket
    await manager.broadcast_to_canteen(db_order.canteen_id, {
        "type": "ORDER_CREATED",
        "order": formatted_order
    })

    return formatted_order

@app.get("/api/canteens/{canteen_id}/orders")
def get_canteen_orders(canteen_id: int, db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(models.Order.canteen_id == canteen_id).order_by(models.Order.created_at.desc()).all()
    return [format_order_response(o) for o in orders]

@app.get("/api/orders/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return format_order_response(order)

@app.patch("/api/orders/{order_id}/status")
async def update_order_status(order_id: int, status_update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_update.status
    db.commit()
    db.refresh(order)

    formatted_order = format_order_response(order)

    # Send real-time notification to canteen dashboard & tracking student
    await manager.broadcast_to_canteen(order.canteen_id, {
        "type": "STATUS_UPDATED",
        "order": formatted_order
    })
    await manager.notify_order_update(order.id, {
        "type": "STATUS_UPDATED",
        "order": formatted_order
    })

    return formatted_order

# --- WebSockets ---
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
