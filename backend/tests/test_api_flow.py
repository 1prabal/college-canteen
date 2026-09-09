import os
import sys
import unittest
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models

client = TestClient(app)

class TestApiOrderFlow(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_health_check(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "operational")

    def test_02_canteens_and_menu_isolation(self):
        res = client.get("/api/canteens")
        self.assertEqual(res.status_code, 200)
        canteens = res.json()
        self.assertGreaterEqual(len(canteens), 3)

        # Canteen 1 menu
        res1 = client.get(f"/api/canteens/{canteens[0]['id']}/menu")
        self.assertEqual(res1.status_code, 200)
        menu1 = res1.json()
        self.assertGreater(len(menu1), 0)

        # Canteen 2 menu
        res2 = client.get(f"/api/canteens/{canteens[1]['id']}/menu")
        self.assertEqual(res2.status_code, 200)
        menu2 = res2.json()
        self.assertGreater(len(menu2), 0)

        # Cross-canteen item order rejection test
        item_from_canteen2 = menu2[0]["id"]
        order_payload = {
            "user_id": 1,
            "canteen_id": canteens[0]["id"],  # Ordering from Canteen 1 with Canteen 2 item
            "items": [{"menu_item_id": item_from_canteen2, "quantity": 1}],
            "payment_method": "UPI"
        }
        order_res = client.post("/api/orders", json=order_payload)
        self.assertEqual(order_res.status_code, 400, "Should reject cross-canteen ordering")

    def test_03_order_creation_price_snapshots_and_pickup_code(self):
        # Place valid order from Canteen 1
        res = client.get("/api/canteens/1/menu")
        menu = res.json()
        item = menu[0]

        order_payload = {
            "user_id": 1,
            "canteen_id": 1,
            "items": [
                {
                    "menu_item_id": item["id"],
                    "quantity": 2,
                    "unit_price": 0.01  # Client fake price; server MUST ignore
                }
            ],
            "payment_method": "UPI"
        }

        order_res = client.post("/api/orders", json=order_payload)
        self.assertEqual(order_res.status_code, 200)
        order = order_res.json()

        # Verify human-readable order number
        self.assertTrue(order["order_number"].startswith("ORD-"))
        self.assertIsNotNone(order["pickup_code"])
        self.assertEqual(len(order["pickup_code"]), 4)

        # Verify server-side price calculation
        expected_total = float(item["price"]) * 2
        self.assertAlmostEqual(order["total_amount"], expected_total, places=2)

        # Verify snapshots
        saved_item = order["items"][0]
        self.assertEqual(saved_item["item_name"], item["name"])
        self.assertAlmostEqual(saved_item["unit_price"], float(item["price"]), places=2)
        self.assertAlmostEqual(saved_item["total_price"], expected_total, places=2)

        order_id = order["id"]
        pickup_code = order["pickup_code"]

        # Verify Bill was created
        bill_res = client.get(f"/api/bills/{order_id}")
        self.assertEqual(bill_res.status_code, 200)
        bill = bill_res.json()
        self.assertTrue(bill["bill_number"].startswith("BILL-"))
        self.assertAlmostEqual(float(bill["total"]), expected_total, places=2)

        # Update order status: ACCEPTED -> PREPARING -> READY
        st1 = client.patch(f"/api/orders/{order_id}/status", json={"status": "ACCEPTED"})
        self.assertEqual(st1.status_code, 200)

        # Update preparation time
        prep_res = client.patch(f"/api/orders/{order_id}/prep-time", json={"estimated_preparation_minutes": 20})
        self.assertEqual(prep_res.status_code, 200)
        self.assertEqual(prep_res.json()["estimated_preparation_minutes"], 20)

        st2 = client.patch(f"/api/orders/{order_id}/status", json={"status": "PREPARING"})
        self.assertEqual(st2.status_code, 200)

        st3 = client.patch(f"/api/orders/{order_id}/status", json={"status": "READY"})
        self.assertEqual(st3.status_code, 200)

        # Verify pickup code
        # Wrong code
        wrong_pickup = client.post(f"/api/orders/{order_id}/verify-pickup", json={"pickup_code": "0000"})
        self.assertEqual(wrong_pickup.status_code, 400)

        # Correct code
        correct_pickup = client.post(f"/api/orders/{order_id}/verify-pickup", json={"pickup_code": pickup_code})
        self.assertEqual(correct_pickup.status_code, 200)
        self.assertEqual(correct_pickup.json()["order"]["status"], "COMPLETED")

        # Duplicate pickup attempt must be rejected
        dup_pickup = client.post(f"/api/orders/{order_id}/verify-pickup", json={"pickup_code": pickup_code})
        self.assertEqual(dup_pickup.status_code, 400, "Must prevent double collection of completed order")

    def test_04_wallet_payment_and_ledger(self):
        # Check initial balance
        w_res = client.get("/api/wallet?user_id=1")
        self.assertEqual(w_res.status_code, 200)
        initial_bal = float(w_res.json()["balance"])

        # Recharge wallet
        recharge_res = client.post("/api/wallet/recharge", json={"user_id": 1, "amount": 200.0, "payment_method": "UPI"})
        self.assertEqual(recharge_res.status_code, 200)
        new_bal = float(recharge_res.json()["balance_after"])
        self.assertAlmostEqual(new_bal, initial_bal + 200.0, places=2)

        # Order using WALLET
        menu = client.get("/api/canteens/1/menu").json()
        item = menu[0]
        order_payload = {
            "user_id": 1,
            "canteen_id": 1,
            "items": [{"menu_item_id": item["id"], "quantity": 1}],
            "payment_method": "WALLET"
        }
        order_res = client.post("/api/orders", json=order_payload)
        self.assertEqual(order_res.status_code, 200)
        order = order_res.json()
        self.assertEqual(order["status"], "PAYMENT_CONFIRMED")

        # Check balance decremented in wallet
        w_res2 = client.get("/api/wallet?user_id=1")
        bal_after_order = float(w_res2.json()["balance"])
        self.assertAlmostEqual(bal_after_order, new_bal - float(item["price"]), places=2)

    def test_05_admin_overview_and_canteen_analytics(self):
        overview_res = client.get("/api/admin/overview")
        self.assertEqual(overview_res.status_code, 200)
        data = overview_res.json()
        self.assertGreaterEqual(data["total_canteens"], 3)
        self.assertGreaterEqual(data["total_users"], 3)
        self.assertGreaterEqual(data["total_orders"], 2)
        self.assertGreaterEqual(data["commission_rate"], 0.0)

        analytics_res = client.get("/api/admin/canteen-analytics")
        self.assertEqual(analytics_res.status_code, 200)
        c_analytics = analytics_res.json()
        self.assertGreaterEqual(len(c_analytics), 3)
        for c in c_analytics:
            self.assertIn("name", c)
            self.assertIn("gross_sales", c)
            self.assertIn("platform_commission", c)
            self.assertIn("net_canteen_earnings", c)

    def test_06_real_canteens_and_unverified_guard(self):
        """Verify the 4 real canteens, MRP items, and that unverified items cannot be ordered."""
        res = client.get("/api/canteens")
        self.assertEqual(res.status_code, 200)
        canteen_names = [c["name"] for c in res.json()]
        for expected in ["NESCAFE", "HUNGRY NITES", "BIG TREAT CAFE", "THE HEALTHY HUT"]:
            self.assertIn(expected, canteen_names)

        # Verify NESCAFE menu contains MRP item and unverified item
        nescafe = next(c for c in res.json() if c["name"] == "NESCAFE")
        nescafe_menu = client.get(f"/api/canteens/{nescafe['id']}/menu").json()
        
        mrp_items = [i for i in nescafe_menu if i.get("pricing_type") == "MRP"]
        self.assertGreater(len(mrp_items), 0)

        unverified_items = [i for i in nescafe_menu if not i.get("is_verified", True)]
        self.assertGreater(len(unverified_items), 0)

        # Attempt to order unverified item -> expect HTTP 400 rejection
        unverified_item = unverified_items[0]
        order_payload = {
            "user_id": 1,
            "canteen_id": nescafe["id"],
            "payment_method": "WALLET",
            "items": [{"menu_item_id": unverified_item["id"], "quantity": 1}]
        }
        ord_res = client.post("/api/orders", json=order_payload)
        self.assertEqual(ord_res.status_code, 400)
        self.assertIn("requires manual price verification", ord_res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
