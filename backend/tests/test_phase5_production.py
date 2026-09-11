import os
import sys
import json
import hmac
import hashlib
import unittest
from datetime import datetime, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models
from app.config import settings
from app.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.payments import verify_webhook_signature
from app.rate_limit import pickup_rate_limiter
from app.email_service import send_email_notification
from app.seed import seed_db

client = TestClient(app)

class TestPhase5Production(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_db()
        cls.db = SessionLocal()
        
        # Admin user
        cls.admin_user = cls.db.query(models.User).filter(
            models.User.role == models.UserRole.PLATFORM_ADMIN
        ).first()
        assert cls.admin_user is not None

        # Staff user (Canteen 1)
        cls.staff_user = cls.db.query(models.User).filter(
            models.User.id == 2
        ).first()
        assert cls.staff_user is not None

        # Student user
        cls.student_user = cls.db.query(models.User).filter(
            models.User.id == 1
        ).first()
        assert cls.student_user is not None

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def _create_test_order(self, canteen_id=1, user_id=1):
        menu_item = self.db.query(models.MenuItem).filter(
            models.MenuItem.canteen_id == canteen_id,
            models.MenuItem.is_available == True
        ).first()
        assert menu_item is not None

        res = client.post("/api/orders", json={
            "user_id": user_id,
            "canteen_id": canteen_id,
            "items": [{"menu_item_id": menu_item.id, "quantity": 1}],
            "payment_method": "UPI"
        })
        self.assertEqual(res.status_code, 200)
        return res.json()

    # --------------------------------------------------------------------------
    # 1. Health and Readiness Endpoints
    # --------------------------------------------------------------------------
    def test_01_health_endpoint(self):
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("version", data)

    def test_02_readiness_endpoint(self):
        res = client.get("/health/ready")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ready")
        self.assertEqual(data["database"], "connected")

    def test_03_security_headers_present(self):
        res = client.get("/health")
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("X-Frame-Options"), "DENY")
        self.assertIn("mode=block", res.headers.get("X-XSS-Protection", ""))

    # --------------------------------------------------------------------------
    # 2. Authentication: Password Hashing & Signed JWT Tokens
    # --------------------------------------------------------------------------
    def test_04_password_hashing_and_verification(self):
        pwd = "CampusSecurePassword2026!"
        hashed = hash_password(pwd)
        self.assertTrue(hashed.startswith("pbkdf2_sha256$"))
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))
        self.assertFalse(verify_password("", None))

    def test_05_jwt_creation_and_decoding(self):
        token = create_access_token({"sub": "1", "email": "test@campus.edu", "role": "student"})
        self.assertIsInstance(token, str)
        payload = decode_access_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], "1")
        self.assertEqual(payload["email"], "test@campus.edu")

    def test_06_expired_jwt_rejected(self):
        expired_token = create_access_token(
            {"sub": "1"}, 
            expires_delta=timedelta(seconds=-10)
        )
        payload = decode_access_token(expired_token)
        self.assertIsNone(payload)

    def test_07_auth_token_endpoint_and_bearer_access(self):
        # Login using college_id
        res = client.post("/api/auth/token", json={"college_id": self.student_user.college_id})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")

        # Use the returned JWT token to access protected endpoint
        jwt_token = data["access_token"]
        auth_res = client.get(
            f"/api/wallet?user_id={self.student_user.id}", 
            headers={"Authorization": f"Bearer {jwt_token}"}
        )
        self.assertEqual(auth_res.status_code, 200)

    def test_08_inactive_user_rejected_with_403(self):
        # Create an inactive user with unique ID
        import uuid
        db = SessionLocal()
        unique_cid = f"INACT-{uuid.uuid4().hex[:8].upper()}"
        inactive_user = models.User(
            name="Deactivated Student",
            college_id=unique_cid,
            email=f"{unique_cid.lower()}@campus.edu",
            role=models.UserRole.STUDENT,
            is_active=False
        )
        db.add(inactive_user)
        db.commit()
        db.refresh(inactive_user)

        # Generate token for inactive user
        token = create_access_token({"sub": str(inactive_user.id)})

        # Request with this token on an authenticated endpoint must be rejected with 403
        res = client.get("/api/staff/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 403)
        self.assertIn("deactivated", res.json()["detail"].lower())
        db.close()

    # --------------------------------------------------------------------------
    # 3. Payment Gateway Webhook & HMAC Verification
    # --------------------------------------------------------------------------
    def test_09_webhook_signature_verification(self):
        secret = "test-webhook-secret-key"
        payload_bytes = b'{"event":"payment.captured","amount":150}'
        valid_sig = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()

        self.assertTrue(verify_webhook_signature(payload_bytes, valid_sig, secret))
        self.assertFalse(verify_webhook_signature(payload_bytes, "invalid_sig_hex", secret))

    def test_10_webhook_invalid_signature_rejected(self):
        res = client.post(
            "/api/payments/webhook",
            headers={"X-Webhook-Signature": "invalid_hex_signature"},
            json={"event": "payment.captured", "order_number": "ORD-TEST-DUMMY"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid webhook signature", res.json()["detail"])

    def test_11_webhook_payment_captured_and_idempotency(self):
        order = self._create_test_order()
        order_num = order["order_number"]

        # Reset order to PAYMENT_PENDING to test webhook confirmation transition
        db = SessionLocal()
        db_order = db.query(models.Order).filter(models.Order.order_number == order_num).first()
        db_order.status = models.OrderStatus.PAYMENT_PENDING
        db_payment = db.query(models.Payment).filter(models.Payment.order_id == db_order.id).first()
        if db_payment:
            db_payment.status = models.PaymentStatus.PENDING
        db.commit()
        db.close()

        payload = {
            "event": "payment.captured",
            "order_number": order_num,
            "amount": float(order["total_amount"])
        }
        body_bytes = json.dumps(payload).encode("utf-8")
        sig = hmac.new(settings.PAYMENT_WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()

        # First webhook delivery
        res1 = client.post(
            "/api/payments/webhook",
            headers={"X-Webhook-Signature": sig, "Content-Type": "application/json"},
            content=body_bytes
        )
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["status"], "success")

        # Second delivery must be recognized as duplicate (idempotent)
        res2 = client.post(
            "/api/payments/webhook",
            headers={"X-Webhook-Signature": sig, "Content-Type": "application/json"},
            content=body_bytes
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["status"], "already_processed")

    def test_12_webhook_payment_failed_cancels_and_restores_inventory(self):
        order = self._create_test_order()
        order_num = order["order_number"]

        payload = {
            "event": "payment.failed",
            "order_number": order_num,
            "amount": float(order["total_amount"])
        }
        body_bytes = json.dumps(payload).encode("utf-8")
        sig = hmac.new(settings.PAYMENT_WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()

        res = client.post(
            "/api/payments/webhook",
            headers={"X-Webhook-Signature": sig, "Content-Type": "application/json"},
            content=body_bytes
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["order_status"], "CANCELLED")

        # Verify order in DB
        db = SessionLocal()
        db_order = db.query(models.Order).filter(models.Order.order_number == order_num).first()
        self.assertEqual(db_order.status, models.OrderStatus.CANCELLED)
        self.assertTrue(db_order.inventory_restored)
        db.close()

    # --------------------------------------------------------------------------
    # 4. Automatic Preparation Countdown (Sections 34–44)
    # --------------------------------------------------------------------------
    def test_13_accept_order_records_accepted_at_and_estimated_ready_at(self):
        order = self._create_test_order(canteen_id=1)
        res = client.post(
            f"/api/orders/{order['id']}/accept",
            headers={"X-User-Id": "2"},
            json={"estimated_preparation_minutes": 20}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ACCEPTED")
        self.assertIsNotNone(data["accepted_at"])
        self.assertIsNotNone(data["estimated_ready_at"])
        self.assertEqual(data["estimated_preparation_minutes"], 20)

    def test_14_duplicate_accept_never_restarts_countdown(self):
        order = self._create_test_order(canteen_id=1)
        res1 = client.post(
            f"/api/orders/{order['id']}/accept",
            headers={"X-User-Id": "2"},
            json={"estimated_preparation_minutes": 25}
        )
        first_accepted_at = res1.json()["accepted_at"]
        first_ready_at = res1.json()["estimated_ready_at"]

        # Duplicate accept request
        res2 = client.post(
            f"/api/orders/{order['id']}/accept",
            headers={"X-User-Id": "2"},
            json={"estimated_preparation_minutes": 10}
        )
        self.assertEqual(res2.status_code, 200)
        # Authoritative timestamps must remain exactly identical
        self.assertEqual(res2.json()["accepted_at"], first_accepted_at)
        self.assertEqual(res2.json()["estimated_ready_at"], first_ready_at)

    def test_15_mark_ready_records_ready_at_timestamp(self):
        order = self._create_test_order(canteen_id=1)
        client.post(
            f"/api/orders/{order['id']}/accept",
            headers={"X-User-Id": "2"},
            json={"estimated_preparation_minutes": 15}
        )
        client.post(f"/api/orders/{order['id']}/prepare", headers={"X-User-Id": "2"})
        res_ready = client.post(f"/api/orders/{order['id']}/ready", headers={"X-User-Id": "2"})
        self.assertEqual(res_ready.status_code, 200)
        data = res_ready.json()
        self.assertEqual(data["status"], "READY")
        self.assertIsNotNone(data["ready_at"])

    def test_16_pickup_rate_limiting_locks_out_after_5_failures(self):
        order = self._create_test_order(canteen_id=1)
        order_id = order["id"]
        # Accept, prepare, ready
        client.post(f"/api/orders/{order_id}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 10})
        client.post(f"/api/orders/{order_id}/prepare", headers={"X-User-Id": "2"})
        client.post(f"/api/orders/{order_id}/ready", headers={"X-User-Id": "2"})

        # Reset any prior rate limiter state for this order
        pickup_rate_limiter.reset(order_id)

        # 4 failed attempts -> 400 Bad Request
        for _ in range(4):
            res = client.post(
                f"/api/orders/{order_id}/verify-pickup",
                headers={"X-User-Id": "2"},
                json={"pickup_code": "0000"}
            )
            self.assertEqual(res.status_code, 400)

        # 5th failed attempt -> 429 Too Many Requests (Lockout triggered)
        res5 = client.post(
            f"/api/orders/{order_id}/verify-pickup",
            headers={"X-User-Id": "2"},
            json={"pickup_code": "0000"}
        )
        self.assertEqual(res5.status_code, 429)
        self.assertIn("locked", res5.json()["detail"].lower())

        # Cleanup limiter state
        pickup_rate_limiter.reset(order_id)

    # --------------------------------------------------------------------------
    # 5. Notifications & Email Dispatch
    # --------------------------------------------------------------------------
    def test_17_notifications_scoped_and_read_all(self):
        # Fetch notifications for student
        res = client.get(
            f"/api/notifications?user_id={self.student_user.id}",
            headers={"X-User-Id": str(self.student_user.id)}
        )
        self.assertEqual(res.status_code, 200)

        # Mark all as read
        patch_res = client.patch(
            "/api/notifications/read-all",
            headers={"X-User-Id": str(self.student_user.id)}
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertTrue(patch_res.json()["success"])

    def test_18_email_notification_service_async(self):
        import asyncio
        # Verify async email dispatch executes without exceptions in simulation mode
        asyncio.run(send_email_notification(
            "student@college.edu",
            "Order Ready",
            "Your meal is waiting at the counter."
        ))
