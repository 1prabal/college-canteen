import unittest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Canteen, MenuItem, Order, User, Wallet

class TestPhase2Flow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_canteens_dynamic_metrics(self):
        """Test GET /api/canteens returns available_items_count and avg_prep_time"""
        response = self.client.get("/api/canteens")
        self.assertEqual(response.status_code, 200)
        canteens = response.json()
        self.assertGreaterEqual(len(canteens), 4)
        for c in canteens:
            self.assertIn("available_items_count", c)
            self.assertIn("avg_prep_time", c)
            self.assertGreaterEqual(c["available_items_count"], 0)

    def test_02_canteen_menu_details(self):
        """Test GET /api/canteens/{id}/menu returns dishes with variant attributes, prep time, verification"""
        canteens_res = self.client.get("/api/canteens")
        first_canteen = canteens_res.json()[0]
        canteen_id = first_canteen["id"]

        response = self.client.get(f"/api/canteens/{canteen_id}/menu")
        self.assertEqual(response.status_code, 200)
        items = response.json()
        self.assertGreater(len(items), 0)
        for item in items:
            self.assertIn("id", item)
            self.assertIn("name", item)
            self.assertIn("price", item)
            self.assertIn("is_available", item)
            self.assertIn("is_verified", item)

    def test_03_student_place_order_and_bill(self):
        """Test student placing an order with single canteen items, bill generation, and user order history"""
        canteens_res = self.client.get("/api/canteens")
        canteen = canteens_res.json()[0]
        canteen_id = canteen["id"]

        # Get an available verified item from this canteen
        menu_res = self.client.get(f"/api/canteens/{canteen_id}/menu")
        menu_items = menu_res.json()
        available_items = [i for i in menu_items if i.get("is_available", True) and i.get("is_verified", True)]
        self.assertGreater(len(available_items), 0)
        test_item = available_items[0]

        # Ensure user 1 wallet has funds
        self.client.post("/api/wallet/recharge", json={
            "user_id": 1,
            "amount": 500.0,
            "payment_method": "UPI"
        })

        # Place order
        order_payload = {
            "canteen_id": canteen_id,
            "user_id": 1,
            "payment_method": "WALLET",
            "items": [
                {
                    "menu_item_id": test_item["id"],
                    "quantity": 2,
                    "unit_price": float(test_item["price"])
                }
            ]
        }

        order_res = self.client.post("/api/orders", json=order_payload)
        self.assertEqual(order_res.status_code, 200)
        order_data = order_res.json()
        self.assertIn("id", order_data)
        self.assertIn("pickup_code", order_data)
        self.assertEqual(len(order_data["pickup_code"]), 4)
        order_id = order_data["id"]

        # Verify bill generation
        bill_res = self.client.get(f"/api/bills/{order_id}")
        self.assertEqual(bill_res.status_code, 200)
        bill_data = bill_res.json()
        self.assertIn("bill_number", bill_data)
        self.assertIn("total", bill_data)
        self.assertIn("canteen_name", bill_data)

        # Verify user order history
        user_orders_res = self.client.get("/api/users/1/orders")
        self.assertEqual(user_orders_res.status_code, 200)
        user_orders = user_orders_res.json()
        order_ids = [o["id"] for o in user_orders]
        self.assertIn(order_id, order_ids)

    def test_04_notifications_retrieval(self):
        """Test GET /api/notifications for student"""
        res = self.client.get("/api/notifications?user_id=1")
        self.assertEqual(res.status_code, 200)
        notifications = res.json()
        self.assertIsInstance(notifications, list)

if __name__ == "__main__":
    unittest.main()
