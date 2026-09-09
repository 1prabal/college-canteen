import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, 
    Numeric, Text, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from .database import Base

# --- Role System ---
class UserRole(str, enum.Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    CANTEEN_STAFF = "canteen_staff"
    CANTEEN_OWNER = "canteen_owner"
    PLATFORM_ADMIN = "platform_admin"
    ADMIN = "admin"  # Legacy support: logically treated as platform_admin

# --- Order Status State Machine ---
class OrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    REFUND_REQUESTED = "REFUND_REQUESTED"
    REFUNDED = "REFUNDED"
    PENDING = "PENDING"  # Legacy compatibility alias for PLACED

# --- Payment Enums ---
class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"

# --- Wallet Ledger Enums ---
class WalletTxType(str, enum.Enum):
    WALLET_RECHARGE = "WALLET_RECHARGE"
    ORDER_PAYMENT = "ORDER_PAYMENT"
    REFUND = "REFUND"
    ADJUSTMENT = "ADJUSTMENT"

class WalletTxStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

# --- Refund Enums ---
class RefundStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"

# --- Notification Enums ---
class NotificationType(str, enum.Enum):
    ORDER_PLACED = "ORDER_PLACED"
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    ORDER_ACCEPTED = "ORDER_ACCEPTED"
    ORDER_PREPARING = "ORDER_PREPARING"
    PREPARATION_TIME_UPDATED = "PREPARATION_TIME_UPDATED"
    ORDER_READY = "ORDER_READY"
    ORDER_REJECTED = "ORDER_REJECTED"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    REFUND_COMPLETED = "REFUND_COMPLETED"

# --- Inventory Transaction Types ---
class InventoryTxType(str, enum.Enum):
    INITIAL_STOCK = "INITIAL_STOCK"
    RESTOCK = "RESTOCK"
    ORDER_DEDUCTION = "ORDER_DEDUCTION"
    ORDER_RESTORE = "ORDER_RESTORE"
    SPOILAGE = "SPOILAGE"
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT"


# ==============================================================================
# Database Models
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    college_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    orders = relationship("Order", back_populates="user")
    staff_assignment = relationship("CanteenStaff", back_populates="user", uselist=False)
    owned_canteens = relationship("Canteen", back_populates="owner")
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Canteen(Base):
    __tablename__ = "canteens"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_open = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="owned_canteens", foreign_keys=[owner_id])
    staff_members = relationship("CanteenStaff", back_populates="canteen", cascade="all, delete-orphan")
    menu_items = relationship("MenuItem", back_populates="canteen", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="canteen", cascade="all, delete-orphan")
    inventories = relationship("Inventory", back_populates="canteen", cascade="all, delete-orphan")


class CanteenStaff(Base):
    __tablename__ = "canteen_staff"

    id = Column(Integer, primary_key=True, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    role = Column(String, default="STAFF", nullable=False)  # "STAFF", "MANAGER"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    canteen = relationship("Canteen", back_populates="staff_members")
    user = relationship("User", back_populates="staff_assignment")


# --- Pricing Type Enum ---
class PricingType(str, enum.Enum):
    FIXED = "FIXED"
    MRP = "MRP"
    VARIABLE = "VARIABLE"


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)  # Numeric for monetary values
    pricing_type = Column(SQLEnum(PricingType), default=PricingType.FIXED, nullable=False)
    unit_info = Column(String, nullable=True)  # e.g., "15 pcs", "6 pcs", "Half (₹290) / Full (₹549)"
    is_verified = Column(Boolean, default=True, nullable=False)  # False if price is obscured/unclear
    category = Column(String, default="General", nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    image_url = Column(String, nullable=True)
    preparation_time_minutes = Column(Integer, default=10, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    canteen = relationship("Canteen", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")
    inventory = relationship("Inventory", back_populates="menu_item", uselist=False, cascade="all, delete-orphan")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False, unique=True, index=True)
    quantity = Column(Integer, default=0, nullable=False)
    minimum_stock = Column(Integer, default=5, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    canteen = relationship("Canteen", back_populates="inventories")
    menu_item = relationship("MenuItem", back_populates="inventory")
    transactions = relationship("InventoryTransaction", back_populates="inventory", cascade="all, delete-orphan")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=False, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False, index=True)
    change_type = Column(SQLEnum(InventoryTxType), nullable=False)
    quantity_change = Column(Integer, nullable=False)
    balance_before = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    reference_id = Column(String, nullable=True)  # e.g., order_number or restock_id
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    inventory = relationship("Inventory", back_populates="transactions")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)  # e.g. ORD-20260908-7F42A1
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    subtotal = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    service_fee = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PLACED, nullable=False, index=True)
    pickup_code = Column(String(10), nullable=False)  # 4-6 digit secure pickup pass
    estimated_preparation_minutes = Column(Integer, default=15, nullable=False)
    estimated_ready_at = Column(DateTime, nullable=True)
    idempotency_key = Column(String, unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="orders")
    canteen = relationship("Canteen", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    bill = relationship("Bill", back_populates="order", uselist=False, cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    item_name = Column(String, nullable=False)  # Snapshot of name at order time
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)  # Snapshot of unit price
    total_price = Column(Numeric(10, 2), nullable=False)  # Snapshot of total (unit_price * quantity)
    price = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))  # Legacy column compatibility

    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    previous_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="status_history")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_reference = Column(String, unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    payment_method = Column(String, default="UPI", nullable=False)  # e.g. "UPI", "WALLET", "CARD"
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    gateway = Column(String, default="SANDBOX_MOCK", nullable=False)
    gateway_transaction_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="payments")
    commission = relationship("CommissionLedger", back_populates="payment", uselist=False)
    refunds = relationship("Refund", back_populates="payment")


class CommissionLedger(Base):
    __tablename__ = "commission_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    gross_amount = Column(Numeric(10, 2), nullable=False)
    platform_commission = Column(Numeric(10, 2), nullable=False)
    payment_gateway_fee = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    canteen_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    payment = relationship("Payment", back_populates="commission")


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    balance = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet", cascade="all, delete-orphan")


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    transaction_reference = Column(String, unique=True, index=True, nullable=False)
    transaction_type = Column(SQLEnum(WalletTxType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    balance_before = Column(Numeric(10, 2), nullable=False)
    balance_after = Column(Numeric(10, 2), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    status = Column(SQLEnum(WalletTxStatus), default=WalletTxStatus.SUCCESS, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    wallet = relationship("Wallet", back_populates="transactions")


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    refund_reference = Column(String, unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(SQLEnum(RefundStatus), default=RefundStatus.REQUESTED, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="refunds")
    payment = relationship("Payment", back_populates="refunds")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    bill_number = Column(String, unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False, index=True)
    subtotal = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    service_fee = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String, default="PAID", nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="bill")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")
