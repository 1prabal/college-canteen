from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .models import UserRole, OrderStatus

# User Schemas
class UserBase(BaseModel):
    name: str
    college_id: str
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

# MenuItem Schemas
class MenuItemBase(BaseModel):
    name: str
    price: float
    category: Optional[str] = "General"
    is_available: bool = True
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    canteen_id: int

class MenuItemOut(MenuItemBase):
    id: int
    canteen_id: int
    class Config:
        from_attributes = True

# Canteen Schemas
class CanteenBase(BaseModel):
    name: str
    location: str
    is_open: bool = True

class CanteenCreate(CanteenBase):
    pass

class CanteenOut(CanteenBase):
    id: int
    menu_items: List[MenuItemOut] = []
    class Config:
        from_attributes = True

# OrderItem Schemas
class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int

class OrderItemOut(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    price: float
    menu_item_name: Optional[str] = None

    class Config:
        from_attributes = True

# Order Schemas
class OrderCreate(BaseModel):
    user_id: int
    canteen_id: int
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderOut(BaseModel):
    id: int
    user_id: int
    canteen_id: int
    total_amount: float
    status: OrderStatus
    created_at: datetime
    canteen_name: Optional[str] = None
    user_name: Optional[str] = None
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True
