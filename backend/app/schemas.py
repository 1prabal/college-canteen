from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from .models import (
    UserRole, OrderStatus, PaymentStatus, WalletTxType, 
    WalletTxStatus, RefundStatus, NotificationType, InventoryTxType
)

# ==============================================================================
# User Schemas
# ==============================================================================
class UserBase(BaseModel):
    name: str
    college_id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: int
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Canteen & Staff Schemas
# ==============================================================================
class CanteenBase(BaseModel):
    name: str
    location: str
    description: Optional[str] = None
    owner_id: Optional[int] = None
    is_open: bool = True
    is_active: bool = True

class CanteenCreate(CanteenBase):
    pass

class CanteenUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    owner_id: Optional[int] = None
    is_open: Optional[bool] = None
    is_active: Optional[bool] = None

class CanteenStaffAssign(BaseModel):
    user_id: int
    role: str = "STAFF"  # "STAFF" or "MANAGER"

class CanteenStaffOut(BaseModel):
    id: int
    canteen_id: int
    user_id: int
    user_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# MenuItem Schemas
# ==============================================================================
class MenuItemBase(BaseModel):
    name: str
    price: Decimal
    pricing_type: Optional[str] = "FIXED"  # "FIXED", "MRP", "VARIABLE"
    unit_info: Optional[str] = None
    is_verified: bool = True
    description: Optional[str] = None
    category: Optional[str] = "General"
    is_available: bool = True
    image_url: Optional[str] = None
    preparation_time_minutes: int = 10

class MenuItemCreate(MenuItemBase):
    canteen_id: int

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    pricing_type: Optional[str] = None
    unit_info: Optional[str] = None
    is_verified: Optional[bool] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    preparation_time_minutes: Optional[int] = None

class MenuItemOut(MenuItemBase):
    id: int
    canteen_id: int
    stock_quantity: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CanteenOut(CanteenBase):
    id: int
    created_at: Optional[datetime] = None
    menu_items: List[MenuItemOut] = []
    available_items_count: Optional[int] = 0
    avg_prep_time: Optional[int] = 10

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Inventory Schemas
# ==============================================================================
class InventoryOut(BaseModel):
    id: int
    canteen_id: int
    menu_item_id: int
    menu_item_name: Optional[str] = None
    quantity: int
    minimum_stock: int
    is_available: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InventoryRestockRequest(BaseModel):
    quantity_change: int = Field(..., description="Quantity to add (positive) or deduct (negative)")
    note: Optional[str] = "Manual restock"


# ==============================================================================
# OrderItem Schemas
# ==============================================================================
class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[Decimal] = None  # Ignored by server; server calculates price

class OrderItemOut(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    item_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    price: Decimal  # Backward compatibility alias
    menu_item_name: str  # Backward compatibility alias
    menu_item: Dict[str, Any]  # Backward compatibility object with {name: item_name}

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Order Schemas
# ==============================================================================
class OrderCreate(BaseModel):
    user_id: int
    canteen_id: int
    items: List[OrderItemCreate]
    payment_method: Optional[str] = "UPI"
    idempotency_key: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: Optional[str] = None
    changed_by: Optional[int] = None

class PickupVerificationRequest(BaseModel):
    pickup_code: str

class PrepTimeUpdate(BaseModel):
    estimated_preparation_minutes: int = Field(..., ge=1, le=180)

class OrderStatusHistoryOut(BaseModel):
    id: int
    previous_status: Optional[str] = None
    new_status: str
    changed_by: Optional[int] = None
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrderOut(BaseModel):
    id: int
    order_number: str
    user_id: int
    canteen_id: int
    subtotal: Decimal
    discount_amount: Decimal
    service_fee: Decimal
    total_amount: Decimal
    total_price: Decimal  # Backward compatibility alias
    status: OrderStatus
    pickup_code: str
    estimated_preparation_minutes: int
    estimated_ready_at: Optional[datetime] = None
    created_at: datetime
    canteen_name: Optional[str] = None
    user_name: Optional[str] = None
    items: List[OrderItemOut] = []
    status_history: List[OrderStatusHistoryOut] = []

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Payment Schemas
# ==============================================================================
class PaymentInitiateRequest(BaseModel):
    order_id: int
    payment_method: str = "UPI"

class PaymentConfirmRequest(BaseModel):
    payment_reference: str
    gateway_transaction_id: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    payment_reference: str
    order_id: int
    user_id: int
    canteen_id: int
    amount: Decimal
    currency: str
    payment_method: str
    status: PaymentStatus
    gateway: str
    gateway_transaction_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Wallet Schemas
# ==============================================================================
class WalletRechargeRequest(BaseModel):
    user_id: int
    amount: Decimal = Field(..., gt=0)
    payment_method: str = "UPI"

class WalletOut(BaseModel):
    id: int
    user_id: int
    balance: Decimal
    currency: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WalletTransactionOut(BaseModel):
    id: int
    wallet_id: int
    user_id: int
    transaction_reference: str
    transaction_type: WalletTxType
    amount: Decimal
    balance_before: Decimal
    balance_after: Decimal
    order_id: Optional[int] = None
    status: WalletTxStatus
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Refund Schemas
# ==============================================================================
class RefundCreateRequest(BaseModel):
    order_id: int
    amount: Optional[Decimal] = None  # None for full order refund
    reason: str

class RefundProcessRequest(BaseModel):
    status: RefundStatus
    note: Optional[str] = None

class RefundOut(BaseModel):
    id: int
    refund_reference: str
    order_id: int
    payment_id: Optional[int] = None
    user_id: int
    canteen_id: int
    amount: Decimal
    reason: str
    status: RefundStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Bill Schemas
# ==============================================================================
class BillOut(BaseModel):
    id: int
    bill_number: str
    order_id: int
    user_id: int
    canteen_id: int
    subtotal: Decimal
    discount: Decimal
    service_fee: Decimal
    total: Decimal
    payment_status: str
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Notification Schemas
# ==============================================================================
class NotificationOut(BaseModel):
    id: int
    user_id: int
    order_id: Optional[int] = None
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Analytics & Detailed Reporting Schemas
# ==============================================================================
class BillDetailOut(BillOut):
    canteen_name: Optional[str] = None
    user_name: Optional[str] = None
    user_college_id: Optional[str] = None
    user_role: Optional[str] = None
    order_number: Optional[str] = None
    order_status: Optional[str] = None
    pickup_code: Optional[str] = None
    items: List[OrderItemOut] = []

class CanteenSalesOut(BaseModel):
    canteen_id: int
    canteen_name: str
    total_gross_sales: Decimal
    today_sales: Decimal
    total_orders: int
    today_orders: int
    completed_orders: int
    pending_orders: int
    active_orders: int

class CanteenAnalyticsOut(BaseModel):
    canteen_id: int
    name: str
    location: str
    owner_name: Optional[str] = None
    total_orders: int
    gross_sales: Decimal
    platform_commission: Decimal
    payment_fees: Decimal
    refunds: Decimal
    net_canteen_earnings: Decimal
    platform_earnings: Decimal

class PlatformOverviewOut(BaseModel):
    total_users: int
    total_students: int
    total_faculty: int
    total_canteen_staff: int
    total_canteens: int
    total_orders: int
    today_orders: int
    total_transaction_value: Decimal
    total_platform_earnings: Decimal
    pending_refunds: int
    commission_rate: float

