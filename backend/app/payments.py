import uuid
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Dict, Any, Optional
from datetime import datetime

class PaymentGatewayInterface(ABC):
    """
    Abstract interface for payment gateway integrations (Mock, Razorpay, Cashfree, Stripe, UPI Intent, etc.)
    """

    @abstractmethod
    async def create_payment_intent(
        self,
        order_number: str,
        amount: Decimal,
        currency: str,
        customer_info: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Initiate payment session or intent with gateway."""
        pass

    @abstractmethod
    async def verify_payment(
        self,
        gateway_payment_id: str,
        order_number: str,
        expected_amount: Decimal,
        signature: Optional[str] = None
    ) -> Dict[str, Any]:
        """Verify transaction authenticity and status."""
        pass

    @abstractmethod
    async def process_refund(
        self,
        gateway_payment_id: str,
        amount: Decimal,
        reason: str
    ) -> Dict[str, Any]:
        """Initiate refund through gateway."""
        pass


class SandboxPaymentGateway(PaymentGatewayInterface):
    """
    Safe sandbox / mock payment gateway for campus development and testing.
    Never collects or stores PCI/CVV/UPI PIN data.
    """

    GATEWAY_NAME = "CAMPUS_SANDBOX_MOCK"

    async def create_payment_intent(
        self,
        order_number: str,
        amount: Decimal,
        currency: str,
        customer_info: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        ref = f"PAY-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        gateway_tx_id = f"GTW-MOCK-{uuid.uuid4().hex[:12].upper()}"
        return {
            "gateway": self.GATEWAY_NAME,
            "payment_reference": ref,
            "gateway_transaction_id": gateway_tx_id,
            "order_number": order_number,
            "amount": float(amount),
            "currency": currency,
            "status": "PENDING",
            "mock_confirmation_token": f"TOKEN-{uuid.uuid4().hex[:16]}",
            "message": "Sandbox payment intent created. Ready for simulated authorization."
        }

    async def verify_payment(
        self,
        gateway_payment_id: str,
        order_number: str,
        expected_amount: Decimal,
        signature: Optional[str] = None
    ) -> Dict[str, Any]:
        # In sandbox, simulates verification
        return {
            "success": True,
            "gateway": self.GATEWAY_NAME,
            "gateway_transaction_id": gateway_payment_id,
            "verified_at": datetime.utcnow().isoformat(),
            "status": "SUCCESS",
            "amount_verified": float(expected_amount),
            "note": "Payment verified via Sandbox mock provider (Development mode)."
        }

    async def process_refund(
        self,
        gateway_payment_id: str,
        amount: Decimal,
        reason: str
    ) -> Dict[str, Any]:
        refund_id = f"REF-GTW-{uuid.uuid4().hex[:10].upper()}"
        return {
            "success": True,
            "gateway": self.GATEWAY_NAME,
            "gateway_refund_id": refund_id,
            "original_transaction_id": gateway_payment_id,
            "amount_refunded": float(amount),
            "status": "COMPLETED",
            "processed_at": datetime.utcnow().isoformat(),
            "note": f"Sandbox mock refund processed: {reason}"
        }


# Singleton factory
_gateway_instance = SandboxPaymentGateway()

def get_payment_gateway() -> PaymentGatewayInterface:
    return _gateway_instance
