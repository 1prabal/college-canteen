from typing import Set, Dict
from fastapi import HTTPException
from .models import OrderStatus

# Strict state machine transition map
VALID_TRANSITIONS: Dict[OrderStatus, Set[OrderStatus]] = {
    OrderStatus.PLACED: {
        OrderStatus.PAYMENT_PENDING,
        OrderStatus.PAYMENT_CONFIRMED,
        OrderStatus.CANCELLED,
        OrderStatus.REJECTED,
    },
    OrderStatus.PENDING: {  # Legacy compatibility alias for PLACED
        OrderStatus.PAYMENT_PENDING,
        OrderStatus.PAYMENT_CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
        OrderStatus.REJECTED,
    },
    OrderStatus.PAYMENT_PENDING: {
        OrderStatus.PAYMENT_CONFIRMED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.PAYMENT_CONFIRMED: {
        OrderStatus.ACCEPTED,
        OrderStatus.PREPARING,  # Fast-track prep allowed
        OrderStatus.CANCELLED,
        OrderStatus.REFUND_REQUESTED,
    },
    OrderStatus.ACCEPTED: {
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
        OrderStatus.REJECTED,
        OrderStatus.REFUND_REQUESTED,
    },
    OrderStatus.PREPARING: {
        OrderStatus.READY,
        OrderStatus.CANCELLED,
        OrderStatus.REFUND_REQUESTED,
    },
    OrderStatus.READY: {
        OrderStatus.COMPLETED,
        OrderStatus.REFUND_REQUESTED,
    },
    OrderStatus.COMPLETED: {
        OrderStatus.REFUND_REQUESTED,
    },
    OrderStatus.CANCELLED: {
        OrderStatus.REFUND_REQUESTED,
        OrderStatus.REFUNDED,
    },
    OrderStatus.REJECTED: {
        OrderStatus.REFUND_REQUESTED,
        OrderStatus.REFUNDED,
    },
    OrderStatus.REFUND_REQUESTED: {
        OrderStatus.REFUNDED,
        OrderStatus.REJECTED,
    },
    OrderStatus.REFUNDED: set(),  # Terminal state
}

def can_transition(current_status: OrderStatus, target_status: OrderStatus) -> bool:
    if current_status == target_status:
        return True
    return target_status in VALID_TRANSITIONS.get(current_status, set())

def validate_transition(current_status: OrderStatus, target_status: OrderStatus):
    if not can_transition(current_status, target_status):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid order status transition from '{current_status.value}' to '{target_status.value}'.",
        )
