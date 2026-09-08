import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from .database import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    CANTEEN_STAFF = "canteen_staff"
    ADMIN = "admin"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PREPARING = "PREPARING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    college_id = Column(String, unique=True, index=True, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)

    orders = relationship("Order", back_populates="user")

class Canteen(Base):
    __tablename__ = "canteens"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    is_open = Column(Boolean, default=True)

    menu_items = relationship("MenuItem", back_populates="canteen", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="canteen", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, default="General")
    is_available = Column(Boolean, default=True)
    image_url = Column(String, nullable=True)

    canteen = relationship("Canteen", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    canteen_id = Column(Integer, ForeignKey("canteens.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    canteen = relationship("Canteen", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False, default=0.0)

    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")
