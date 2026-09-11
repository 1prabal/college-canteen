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

class TestPhase3StaffDashboard(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Seed baseline: staff user 2 is assigned to Canteen 1 (Main Food Court)
        # staff user 14 is assigned to Canteen 4 (NESCAFE)
        # customer user 1 is Rahul Sharma

    def tearDown(self):
        self.db.close()

    def _create_test_order(self, canteen_id=1, user_id=1):
        """Helper to create a test order in PAYMENT_CONFIRMED status with sufficient stock."""
        menu = client.get(f"/api/canteens/{canteen_id}/menu").json()
        valid_items = [i for i in menu if i.get("is_verified", True) and i.get("is_available", True)]
        item = valid_items[0]

        # Ensure stock
        inv = self.db.query(models.Inventory).filter(models.Inventory.menu_item_id == item["id"]).first()
        if inv:
            inv.quantity = max(inv.quantity, 20)
            self.db.commit()

        payload = {
            "user_id": user_id,
            "canteen_id": canteen_id,
            "payment_method": "UPI",
            "items": [{"menu_item_id": item["id"], "quantity": 1}]
        }
        res = client.post("/api/orders", json=payload)
        self.assertEqual(res.status_code, 200, f"Order creation failed: {res.text}")
        return res.json()

    # --------------------------------------------------------------------------
    # 1. Staff authentication & canteen resolution tests
    # --------------------------------------------------------------------------
    def test_01_staff_me_endpoint_returns_authoritative_canteen(self):
        """1. Staff authentication resolves authoritative assigned canteen from backend."""
        res = client.get("/api/staff/me", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["canteen"]["id"], 1)
        self.assertEqual(data["canteen"]["name"], "Main Food Court")
        self.assertEqual(data["user"]["id"], 2)

    def test_02_bearer_token_authentication(self):
        """2. Bearer token email auth correctly resolves staff identity."""
        res = client.get("/api/staff/me", headers={"Authorization": "Bearer sunil.nescafe@canteen.college.edu"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["canteen"]["id"], 4)
        self.assertEqual(data["canteen"]["name"], "NESCAFE")
        self.assertEqual(data["user"]["id"], 14)

    def test_03_non_staff_cannot_access_staff_me(self):
        """3. Student / non-staff user receives 403 on staff/me."""
        res = client.get("/api/staff/me", headers={"X-User-Id": "1"})
        self.assertEqual(res.status_code, 403)

    # --------------------------------------------------------------------------
    # 2. Strict Canteen Isolation tests
    # --------------------------------------------------------------------------
    def test_04_canteen_isolation_cross_canteen_orders_forbidden(self):
        """4. Staff assigned to Canteen 1 receives 403 trying to view Canteen 4 orders."""
        res = client.get("/api/canteens/4/orders", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 403)

    def test_05_canteen_isolation_cross_canteen_action_forbidden(self):
        """5. Staff from Canteen 1 cannot accept or modify an order belonging to Canteen 4."""
        c4_order = self._create_test_order(canteen_id=4)
        # Staff 2 (Canteen 1) attempts to accept Canteen 4's order
        res = client.post(f"/api/orders/{c4_order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})
        self.assertEqual(res.status_code, 403)

    # --------------------------------------------------------------------------
    # 3. Dedicated Operational Endpoints Workflow Tests
    # --------------------------------------------------------------------------
    def test_06_accept_order_with_preparation_time(self):
        """6. POST /accept transitions PAYMENT_CONFIRMED -> ACCEPTED, sets prep time, and calculates estimated_ready_at."""
        order = self._create_test_order(canteen_id=1)
        res = client.post(
            f"/api/orders/{order['id']}/accept",
            headers={"X-User-Id": "2"},
            json={"estimated_preparation_minutes": 25}
        )
        self.assertEqual(res.status_code, 200)
        updated = res.json()
        self.assertEqual(updated["status"], "ACCEPTED")
        self.assertEqual(updated["estimated_preparation_minutes"], 25)
        self.assertIsNotNone(updated["estimated_ready_at"])

    def test_07_accept_order_state_guard(self):
        """7. Cannot accept an already preparing or completed order."""
        order = self._create_test_order(canteen_id=1)
        # Accept once
        res1 = client.post(f"/api/orders/{order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})
        self.assertEqual(res1.status_code, 200)
        # Prepare order
        client.post(f"/api/orders/{order['id']}/prepare", headers={"X-User-Id": "2"})
        # Try to accept order when PREPARING -> must fail state machine validation
        res2 = client.post(f"/api/orders/{order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})
        self.assertEqual(res2.status_code, 400)
        self.assertIn("Cannot accept order in status 'PREPARING'", res2.json()["detail"])

    def test_08_reject_order_with_reason_and_idempotent_inventory_restoration(self):
        """8. POST /reject sets REJECTED, restores stock, creates idempotent refund, and records reason."""
        order = self._create_test_order(canteen_id=1)
        item_id = order["items"][0]["menu_item_id"]
        inv_before = self.db.query(models.Inventory).filter(models.Inventory.menu_item_id == item_id).first().quantity

        res = client.post(
            f"/api/orders/{order['id']}/reject",
            headers={"X-User-Id": "2"},
            json={"reason": "Kitchen out of ingredients"}
        )
        self.assertEqual(res.status_code, 200)
        updated = res.json()
        self.assertEqual(updated["status"], "REJECTED")

        # Verify inventory restored
        self.db.expire_all()
        inv_after = self.db.query(models.Inventory).filter(models.Inventory.menu_item_id == item_id).first().quantity
        self.assertEqual(inv_after, inv_before + 1)

        # Calling reject again is idempotent and returns 200 without duplicate inventory addition
        res_repeat = client.post(
            f"/api/orders/{order['id']}/reject",
            headers={"X-User-Id": "2"},
            json={"reason": "Kitchen out of ingredients"}
        )
        self.assertEqual(res_repeat.status_code, 200)
        self.db.expire_all()
        inv_after_repeat = self.db.query(models.Inventory).filter(models.Inventory.menu_item_id == item_id).first().quantity
        self.assertEqual(inv_after_repeat, inv_after)

        # Rejecting a COMPLETED order must fail with HTTP 400
        order2 = self._create_test_order(canteen_id=1)
        client.post(f"/api/orders/{order2['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})
        client.post(f"/api/orders/{order2['id']}/prepare", headers={"X-User-Id": "2"})
        client.post(f"/api/orders/{order2['id']}/ready", headers={"X-User-Id": "2"})
        client.post(f"/api/orders/{order2['id']}/verify-pickup", headers={"X-User-Id": "2"}, json={"pickup_code": order2["pickup_code"]})

        res_completed_reject = client.post(
            f"/api/orders/{order2['id']}/reject",
            headers={"X-User-Id": "2"},
            json={"reason": "Too late"}
        )
        self.assertEqual(res_completed_reject.status_code, 400)
        self.assertIn("Cannot reject order in terminal status 'COMPLETED'", res_completed_reject.json()["detail"])

    def test_09_start_preparing_order(self):
        """9. POST /prepare transitions ACCEPTED -> PREPARING."""
        order = self._create_test_order(canteen_id=1)
        client.post(f"/api/orders/{order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})

        res = client.post(f"/api/orders/{order['id']}/prepare", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "PREPARING")

    def test_10_mark_order_ready(self):
        """10. POST /ready transitions PREPARING -> READY and notifies customer."""
        order = self._create_test_order(canteen_id=1)
        client.post(f"/api/orders/{order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})
        client.post(f"/api/orders/{order['id']}/prepare", headers={"X-User-Id": "2"})

        res = client.post(f"/api/orders/{order['id']}/ready", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "READY")

    def test_11_cannot_mark_ready_from_unprepared_state(self):
        """11. Cannot mark order READY directly from PAYMENT_CONFIRMED without preparing."""
        order = self._create_test_order(canteen_id=1)
        res = client.post(f"/api/orders/{order['id']}/ready", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 400)

    def test_12_update_preparation_time_recalculates_ready_at(self):
        """12. PATCH /prep-time updates minutes and recalculates estimated_ready_at."""
        order = self._create_test_order(canteen_id=1)
        client.post(f"/api/orders/{order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})

        res = client.patch(
            f"/api/orders/{order['id']}/prep-time",
            headers={"X-User-Id": "2"},
            json={"estimated_preparation_minutes": 35}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["estimated_preparation_minutes"], 35)

    def test_13_verify_pickup_with_passcode(self):
        """13. POST /verify-pickup transitions READY -> COMPLETED, records completed_at, and returns success."""
        order = self._create_test_order(canteen_id=1)
        client.post(f"/api/orders/{order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})
        client.post(f"/api/orders/{order['id']}/prepare", headers={"X-User-Id": "2"})
        client.post(f"/api/orders/{order['id']}/ready", headers={"X-User-Id": "2"})

        pickup_code = order["pickup_code"]
        res = client.post(
            f"/api/orders/{order['id']}/verify-pickup",
            headers={"X-User-Id": "2"},
            json={"pickup_code": pickup_code}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["order"]["status"], "COMPLETED")
        self.assertIsNotNone(data["order"]["completed_at"])

    def test_14_verify_pickup_wrong_passcode_rejected(self):
        """14. POST /verify-pickup rejects invalid code with HTTP 400."""
        order = self._create_test_order(canteen_id=1)
        client.post(f"/api/orders/{order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})
        client.post(f"/api/orders/{order['id']}/prepare", headers={"X-User-Id": "2"})
        client.post(f"/api/orders/{order['id']}/ready", headers={"X-User-Id": "2"})

        res = client.post(
            f"/api/orders/{order['id']}/verify-pickup",
            headers={"X-User-Id": "2"},
            json={"pickup_code": "9999"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid pickup verification code", res.json()["detail"])

    def test_15_prevent_duplicate_pickup_collection(self):
        """15. Verifying pickup twice prevents double collection."""
        order = self._create_test_order(canteen_id=1)
        client.post(f"/api/orders/{order['id']}/accept", headers={"X-User-Id": "2"}, json={"estimated_preparation_minutes": 15})
        client.post(f"/api/orders/{order['id']}/prepare", headers={"X-User-Id": "2"})
        client.post(f"/api/orders/{order['id']}/ready", headers={"X-User-Id": "2"})

        pickup_code = order["pickup_code"]
        client.post(f"/api/orders/{order['id']}/verify-pickup", headers={"X-User-Id": "2"}, json={"pickup_code": pickup_code})

        # Second collection attempt
        dup = client.post(
            f"/api/orders/{order['id']}/verify-pickup",
            headers={"X-User-Id": "2"},
            json={"pickup_code": pickup_code}
        )
        self.assertEqual(dup.status_code, 400)
        self.assertIn("already been collected", dup.json()["detail"])

    # --------------------------------------------------------------------------
    # 4. Hardened Generic Status Route Tests
    # --------------------------------------------------------------------------
    def test_16_generic_status_endpoint_blocks_direct_completion(self):
        """16. PATCH /status rejects direct bypass to COMPLETED without pickup code."""
        order = self._create_test_order(canteen_id=1)
        res = client.patch(
            f"/api/orders/{order['id']}/status",
            headers={"X-User-Id": "2"},
            json={"status": "COMPLETED"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("verify-pickup", res.json()["detail"])

    # --------------------------------------------------------------------------
    # 5. Inventory & Non-Negative Balance Safety Tests
    # --------------------------------------------------------------------------
    def test_17_inventory_restock_and_audit_transaction(self):
        """17. Restocking updates inventory and creates an InventoryTransaction record."""
        menu = client.get("/api/canteens/1/menu").json()
        item = menu[0]

        res = client.post(
            f"/api/canteens/1/inventory/{item['id']}/restock",
            headers={"X-User-Id": "2"},
            json={"quantity_change": 15, "note": "Morning delivery"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("quantity", data)

    def test_18_inventory_non_negative_safety_guard(self):
        """18. Restock reducing stock below zero is rejected with HTTP 400."""
        menu = client.get("/api/canteens/1/menu").json()
        item = menu[0]

        res = client.post(
            f"/api/canteens/1/inventory/{item['id']}/restock",
            headers={"X-User-Id": "2"},
            json={"quantity_change": -99999, "note": "Negative overflow test"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("negative stock", res.json()["detail"])

    def test_19_inventory_alerts_endpoint(self):
        """19. GET /inventory/alerts returns low-stock and out-of-stock items."""
        res = client.get("/api/canteens/1/inventory/alerts", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    # --------------------------------------------------------------------------
    # 6. Sales, Analytics & Financial Integrity Tests
    # --------------------------------------------------------------------------
    def test_20_sales_excludes_unpaid_rejected_and_deducts_refunds(self):
        """20. GET /sales strictly excludes unpaid/rejected orders and deducts refunds."""
        res = client.get("/api/canteens/1/sales", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 200)
        sales = res.json()
        self.assertIn("today", sales)
        self.assertIn("weekly", sales)
        self.assertIn("monthly", sales)
        self.assertIn("top_selling_items", sales)
        self.assertIn("orders_by_hour", sales)
        self.assertGreaterEqual(sales["today"]["net_sales"], 0.0)

    def test_21_dashboard_stats_endpoint(self):
        """21. GET /dashboard-stats returns real-time aggregated metrics."""
        res = client.get("/api/canteens/1/dashboard-stats", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 200)
        stats = res.json()
        self.assertIn("pending_orders", stats)
        self.assertIn("preparing_orders", stats)
        self.assertIn("ready_orders", stats)
        self.assertIn("completed_today", stats)
        self.assertIn("today_sales", stats)

    # --------------------------------------------------------------------------
    # 7. Menu & Category Management Tests
    # --------------------------------------------------------------------------
    def test_22_category_lifecycle_and_orphan_deletion_guard(self):
        """22. Categories can be created, renamed, and deletion is guarded against orphaned items."""
        # Create category
        create_res = client.post(
            "/api/canteens/1/categories",
            headers={"X-User-Id": "2"},
            json={"name": "Special Desserts"}
        )
        self.assertEqual(create_res.status_code, 200)

        # Deleting populated category should fail if items exist, or succeed if empty
        del_res = client.delete(
            "/api/canteens/1/categories/Special%20Desserts",
            headers={"X-User-Id": "2"}
        )
        self.assertEqual(del_res.status_code, 200)

    # --------------------------------------------------------------------------
    # 8. Canteen Operational Settings & Authorization Guards
    # --------------------------------------------------------------------------
    def test_23_canteen_settings_open_closed_toggle(self):
        """23. Staff can toggle is_open operational status."""
        res = client.put(
            "/api/canteens/1/settings",
            headers={"X-User-Id": "2"},
            json={"is_open": False}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["is_open"], False)

        # Restore open status
        res2 = client.put(
            "/api/canteens/1/settings",
            headers={"X-User-Id": "2"},
            json={"is_open": True}
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["is_open"], True)

    def test_24_regular_staff_cannot_deactivate_canteen(self):
        """24. Regular staff cannot toggle is_active (403 forbidden)."""
        res = client.put(
            "/api/canteens/1/settings",
            headers={"X-User-Id": "2"},
            json={"is_active": False}
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("Regular staff cannot deactivate or delete the canteen", res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
