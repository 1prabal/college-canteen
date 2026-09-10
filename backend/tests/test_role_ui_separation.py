import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models

client = TestClient(app)

class TestRoleSeparationAndCanteenIsolation(unittest.TestCase):
    """
    Automated backend tests validating authoritative staff assignment,
    canteen isolation, student exclusion from staff endpoints, and
    cross-canteen barrier enforcement.
    """

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_student_cannot_access_staff_me(self):
        """Student (user 1: Rahul Sharma) gets HTTP 403 trying to access /api/staff/me."""
        res = client.get("/api/staff/me", headers={"X-User-Id": "1"})
        self.assertEqual(res.status_code, 403)
        self.assertIn("Access Denied", res.json()["detail"])

    def test_02_faculty_cannot_access_staff_me(self):
        """Faculty (user 4: Prof. Ananya Sen) gets HTTP 403 trying to access /api/staff/me."""
        res = client.get("/api/staff/me", headers={"X-User-Id": "4"})
        self.assertEqual(res.status_code, 403)
        self.assertIn("Access Denied", res.json()["detail"])

    def test_03_staff_suresh_assigned_to_main_food_court(self):
        """Staff user 2 (Suresh Kumar) authoritatively resolves Canteen #1 (Main Food Court)."""
        res = client.get("/api/staff/me", headers={"X-User-Id": "2"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["id"], 2)
        self.assertEqual(data["user"]["role"], "canteen_staff")
        self.assertEqual(data["canteen"]["id"], 1)
        self.assertEqual(data["canteen"]["name"], "Main Food Court")

    def test_04_staff_sunil_assigned_to_nescafe(self):
        """Staff user 14 (Sunil Sharma) authoritatively resolves Canteen #4 (NESCAFE)."""
        res = client.get("/api/staff/me", headers={"Authorization": "Bearer sunil.nescafe@canteen.college.edu"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["id"], 14)
        self.assertEqual(data["user"]["role"], "canteen_staff")
        self.assertEqual(data["canteen"]["id"], 4)
        self.assertEqual(data["canteen"]["name"], "NESCAFE")

    def test_05_canteen_isolation_suresh_cannot_manage_nescafe(self):
        """Staff from Canteen 1 cannot access Canteen 4 orders, categories, or inventory."""
        # 1. Orders
        res_orders = client.get("/api/canteens/4/orders", headers={"X-User-Id": "2"})
        self.assertEqual(res_orders.status_code, 403)

        # 2. Inventory
        res_inv = client.get("/api/canteens/4/inventory", headers={"X-User-Id": "2"})
        self.assertEqual(res_inv.status_code, 403)

        # 3. Settings
        res_settings = client.get("/api/canteens/4/settings", headers={"X-User-Id": "2"})
        self.assertEqual(res_settings.status_code, 403)

    def test_06_canteen_isolation_sunil_cannot_manage_main_food_court(self):
        """Staff from Canteen 4 (NESCAFE) cannot access Canteen 1 orders or inventory."""
        res_orders = client.get("/api/canteens/1/orders", headers={"Authorization": "Bearer sunil.nescafe@canteen.college.edu"})
        self.assertEqual(res_orders.status_code, 403)

        res_sales = client.get("/api/canteens/1/sales", headers={"Authorization": "Bearer sunil.nescafe@canteen.college.edu"})
        self.assertEqual(res_sales.status_code, 403)

    def test_07_unauthenticated_staff_me_rejected(self):
        """Accessing staff/me without headers returns 401."""
        res = client.get("/api/staff/me")
        self.assertEqual(res.status_code, 401)

if __name__ == "__main__":
    unittest.main()
