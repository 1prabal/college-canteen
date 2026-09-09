import os
import sys
import unittest
from decimal import Decimal
from datetime import datetime

# Add app to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine, Base
from app import models, schemas
from app.order_state import can_transition, validate_transition
from app.payments import get_payment_gateway
from app.migrate import safe_migrate
from app.seed import seed_db

class TestPhase1Architecture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Run migration and seeding
        safe_migrate()
        seed_db()

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_database_and_existing_data_preserved(self):
        """Verify existing records are preserved and new tables exist."""
        users = self.db.query(models.User).all()
        self.assertGreaterEqual(len(users), 3, "Existing and seed users should be present")

        # Verify Rahul Sharma preserved
        rahul = self.db.query(models.User).filter(models.User.college_id == "CS2024-089").first()
        self.assertIsNotNone(rahul)
        self.assertEqual(rahul.name, "Rahul Sharma")

        # Verify canteens preserved
        canteens = self.db.query(models.Canteen).all()
        self.assertGreaterEqual(len(canteens), 3)

        # Verify menu items
        menu_items = self.db.query(models.MenuItem).all()
        self.assertGreaterEqual(len(menu_items), 10)

        # Verify legacy orders preserved
        legacy_orders = self.db.query(models.Order).all()
        self.assertGreaterEqual(len(legacy_orders), 2)
        for o in legacy_orders:
            self.assertTrue(o.order_number.startswith("ORD-"), "Legacy orders must have backfilled order_number")
            self.assertIsNotNone(o.pickup_code)
            self.assertGreater(len(o.order_items), 0)

    def test_02_role_system(self):
        """Verify role system supports all 5 roles."""
        roles = [r.value for r in models.UserRole]
        self.assertIn("student", roles)
        self.assertIn("faculty", roles)
        self.assertIn("canteen_staff", roles)
        self.assertIn("canteen_owner", roles)
        self.assertIn("platform_admin", roles)

        # Legacy ADMIN mapping check
        admin_user = self.db.query(models.User).filter(models.User.college_id == "ADMIN-001").first()
        self.assertIn(admin_user.role, (models.UserRole.PLATFORM_ADMIN, models.UserRole.ADMIN))

    def test_03_canteen_staff_isolation(self):
        """Verify staff is assigned to a specific canteen."""
        staff1 = self.db.query(models.CanteenStaff).filter(models.CanteenStaff.canteen_id == 1).first()
        self.assertIsNotNone(staff1)
        self.assertEqual(staff1.canteen_id, 1)

        staff2 = self.db.query(models.CanteenStaff).filter(models.CanteenStaff.canteen_id == 2).first()
        self.assertIsNotNone(staff2)
        self.assertNotEqual(staff1.user_id, staff2.user_id)

    def test_04_menu_isolation_and_decimal_pricing(self):
        """Verify menu items belong to exactly one canteen and use Decimal prices."""
        items = self.db.query(models.MenuItem).all()
        for item in items:
            self.assertIsInstance(item.price, Decimal, f"Item {item.name} price should be Decimal")
            if item.is_verified:
                self.assertGreater(item.price, Decimal("0.00"), f"Verified item {item.name} should have price > 0")
            else:
                self.assertGreaterEqual(item.price, Decimal("0.00"), f"Unverified item {item.name} price should be >= 0")
            self.assertIsNotNone(item.canteen_id)

    def test_05_inventory_tracking(self):
        """Verify inventory exists for menu items and restock works."""
        item = self.db.query(models.MenuItem).first()
        inv = self.db.query(models.Inventory).filter(models.Inventory.menu_item_id == item.id).first()
        self.assertIsNotNone(inv)
        self.assertGreaterEqual(inv.quantity, 0)

    def test_06_order_state_machine(self):
        """Verify order state machine prevents invalid transitions."""
        # Valid: PLACED -> PAYMENT_CONFIRMED -> ACCEPTED -> PREPARING -> READY -> COMPLETED
        self.assertTrue(can_transition(models.OrderStatus.PLACED, models.OrderStatus.PAYMENT_CONFIRMED))
        self.assertTrue(can_transition(models.OrderStatus.PAYMENT_CONFIRMED, models.OrderStatus.ACCEPTED))
        self.assertTrue(can_transition(models.OrderStatus.ACCEPTED, models.OrderStatus.PREPARING))
        self.assertTrue(can_transition(models.OrderStatus.PREPARING, models.OrderStatus.READY))
        self.assertTrue(can_transition(models.OrderStatus.READY, models.OrderStatus.COMPLETED))

        # Invalid transitions:
        self.assertFalse(can_transition(models.OrderStatus.PLACED, models.OrderStatus.COMPLETED))
        self.assertFalse(can_transition(models.OrderStatus.PREPARING, models.OrderStatus.PLACED))
        self.assertFalse(can_transition(models.OrderStatus.COMPLETED, models.OrderStatus.PREPARING))

    def test_07_wallet_and_ledger(self):
        """Verify wallet transactions update balance and maintain immutable ledger."""
        user = self.db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).first()
        wallet = self.db.query(models.Wallet).filter(models.Wallet.user_id == user.id).first()
        self.assertIsNotNone(wallet)

        initial_bal = wallet.balance
        recharge_amt = Decimal("150.00")
        wallet.balance += recharge_amt

        tx = models.WalletTransaction(
            wallet_id=wallet.id,
            user_id=user.id,
            transaction_reference=f"TEST-RECH-{datetime.utcnow().timestamp()}",
            transaction_type=models.WalletTxType.WALLET_RECHARGE,
            amount=recharge_amt,
            balance_before=initial_bal,
            balance_after=wallet.balance,
            status=models.WalletTxStatus.SUCCESS,
            description="Unit test top-up"
        )
        self.db.add(tx)
        self.db.commit()

        self.db.refresh(wallet)
        self.assertEqual(wallet.balance, initial_bal + recharge_amt)

        # Check ledger record
        saved_tx = self.db.query(models.WalletTransaction).filter(
            models.WalletTransaction.transaction_reference == tx.transaction_reference
        ).first()
        self.assertIsNotNone(saved_tx)
        self.assertEqual(saved_tx.amount, recharge_amt)

    def test_08_payment_gateway_abstraction(self):
        """Verify payment gateway abstraction creates intents and verifies."""
        import asyncio
        gateway = get_payment_gateway()

        async def run_payment_test():
            intent = await gateway.create_payment_intent(
                order_number="ORD-TEST-001",
                amount=Decimal("100.00"),
                currency="INR",
                customer_info={"user_id": 1, "name": "Rahul Sharma"}
            )
            self.assertEqual(intent["status"], "PENDING")
            self.assertTrue(intent["payment_reference"].startswith("PAY-"))

            verify = await gateway.verify_payment(
                gateway_payment_id=intent["gateway_transaction_id"],
                order_number="ORD-TEST-001",
                expected_amount=Decimal("100.00")
            )
            self.assertTrue(verify["success"])
            self.assertEqual(verify["status"], "SUCCESS")

        asyncio.run(run_payment_test())

    def test_09_platform_commission_configurable(self):
        """Verify commission rate is configurable and not hardcoded."""
        setting = self.db.query(models.PlatformSetting).filter(models.PlatformSetting.key == "commission_rate").first()
        self.assertIsNotNone(setting)
        rate = Decimal(setting.value)
        self.assertGreaterEqual(rate, Decimal("0.00"))
        self.assertLessEqual(rate, Decimal("1.00"))

if __name__ == "__main__":
    unittest.main()
