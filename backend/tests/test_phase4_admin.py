import os
import sys
import unittest
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models
from app.seed import seed_db

client = TestClient(app)

class TestPhase4AdminPlatform(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_db()
        cls.db = SessionLocal()
        # Find admin user
        cls.admin_user = cls.db.query(models.User).filter(
            models.User.role == models.UserRole.PLATFORM_ADMIN
        ).first()
        assert cls.admin_user is not None, "Admin user must be seeded"
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_user.email}"}
        
        # Find student user
        cls.student_user = cls.db.query(models.User).filter(
            models.User.role == models.UserRole.STUDENT
        ).first()
        cls.student_headers = {"Authorization": f"Bearer {cls.student_user.email}"}

        # Find staff user
        cls.staff_user = cls.db.query(models.User).filter(
            models.User.role == models.UserRole.CANTEEN_STAFF
        ).first()
        cls.staff_headers = {"Authorization": f"Bearer {cls.staff_user.email}"}

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    # --------------------------------------------------------------------------
    # 1. RBAC & Security Tests
    # --------------------------------------------------------------------------
    def test_01_unauthenticated_request_rejected(self):
        """Unauthenticated requests to admin endpoints must return HTTP 401."""
        res = client.get("/api/admin/overview")
        self.assertEqual(res.status_code, 401)

        res2 = client.get("/api/admin/transactions")
        self.assertEqual(res2.status_code, 401)

        res3 = client.get("/api/admin/commission")
        self.assertEqual(res3.status_code, 401)

    def test_02_non_admin_role_forbidden(self):
        """Students and Canteen Staff attempting to access admin endpoints must receive HTTP 403."""
        res_student = client.get("/api/admin/overview", headers=self.student_headers)
        self.assertEqual(res_student.status_code, 403)
        self.assertIn("Platform Administrator privileges required", res_student.json()["detail"])

        res_staff = client.get("/api/admin/overview", headers=self.staff_headers)
        self.assertEqual(res_staff.status_code, 403)

        # Mutating endpoints must also forbid non-admin
        res_mut = client.patch(
            "/api/admin/commission",
            json={"commission_rate": "0.08", "reason": "Unauthorized attempt"},
            headers=self.student_headers
        )
        self.assertEqual(res_mut.status_code, 403)

    def test_03_admin_access_granted(self):
        """Platform Admin users must receive HTTP 200 on all admin endpoints."""
        res = client.get("/api/admin/overview", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("gross_sales", data)
        self.assertIn("platform_earnings", data)
        self.assertIn("total_canteens", data)

    # --------------------------------------------------------------------------
    # 2. Financial Analytics & Decimal Precision
    # --------------------------------------------------------------------------
    def test_04_admin_overview_metrics_accuracy(self):
        """Overview endpoint must aggregate accurate metrics with Decimal precision."""
        res = client.get("/api/admin/overview", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertGreaterEqual(data["total_canteens"], 3)
        self.assertGreaterEqual(data["total_users"], 3)
        self.assertGreaterEqual(data["total_orders"], 1)
        self.assertGreaterEqual(data["total_colleges"], 1)
        # Decimal serialization
        self.assertIsInstance(data["gross_sales"], str)
        self.assertGreaterEqual(Decimal(data["gross_sales"]), Decimal("0.00"))
        self.assertGreaterEqual(Decimal(data["platform_earnings"]), Decimal("0.00"))

    def test_05_canteen_analytics_aggregates(self):
        """Canteen analytics must return accurate per-canteen financial summaries."""
        res = client.get("/api/admin/analytics/canteens", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        canteens = res.json()
        self.assertGreaterEqual(len(canteens), 3)

        for c in canteens:
            self.assertIn("canteen_id", c)
            self.assertIn("name", c)
            self.assertIn("gross_sales", c)
            self.assertIn("platform_commission", c)
            self.assertIn("net_canteen_earnings", c)
            # Mathematical integrity: gross_sales >= net_canteen_earnings
            gross = Decimal(str(c["gross_sales"]))
            net = Decimal(str(c["net_canteen_earnings"]))
            self.assertGreaterEqual(gross, net)

    def test_06_owner_analytics_aggregates(self):
        """Owner analytics must return earnings broken down by canteen owner."""
        res = client.get("/api/admin/analytics/owners", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        owners = res.json()
        self.assertIsInstance(owners, list)
        if len(owners) > 0:
            owner = owners[0]
            self.assertIn("owner_id", owner)
            self.assertIn("owner_name", owner)
            self.assertIn("canteen_names", owner)
            self.assertIn("net_earnings", owner)

    def test_07_revenue_timeseries_analytics(self):
        """Revenue analytics endpoint returns time-series data with requested interval."""
        res = client.get("/api/admin/analytics/revenue?interval=daily", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["interval"], "daily")
        self.assertIn("total_gross_sales", data)
        self.assertIn("points", data)
        self.assertIsInstance(data["points"], list)

    # --------------------------------------------------------------------------
    # 3. Financial Ledger & Pagination
    # --------------------------------------------------------------------------
    def test_08_transactions_ledger_pagination(self):
        """Ledger endpoint must support pagination and return total count."""
        res = client.get("/api/admin/transactions?page=1&page_size=5", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("page", data)
        self.assertIn("total_pages", data)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["page_size"], 5)
        self.assertLessEqual(len(data["items"]), 5)

    def test_09_transactions_filter_by_type(self):
        """Ledger endpoint must filter by transaction type correctly."""
        res = client.get(
            "/api/admin/transactions?transaction_type=CUSTOMER_PAYMENT",
            headers=self.admin_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        for item in data["items"]:
            self.assertEqual(item["transaction_type"], "CUSTOMER_PAYMENT")

    # --------------------------------------------------------------------------
    # 4. Commission Rate Configuration & Snapshot Preservation
    # --------------------------------------------------------------------------
    def test_10_commission_rate_view_and_update(self):
        """Admin can view and update the commission rate; updates must be audited."""
        # View current rate
        res = client.get("/api/admin/commission", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        config = res.json()

        # Update rate to 6.5% (0.065)
        update_payload = {
            "commission_rate": "0.065",
            "reason": "Quarterly operational platform fee adjustment"
        }
        update_res = client.patch(
            "/api/admin/commission",
            json=update_payload,
            headers=self.admin_headers
        )
        self.assertEqual(update_res.status_code, 200)
        new_config = update_res.json()
        self.assertEqual(Decimal(str(new_config["current_commission_rate"])), Decimal("0.065"))
        self.assertEqual(new_config["effective_rate_percent"], 6.5)

        # Verify rate bounds validation (must be 0.0 <= rate <= 1.0)
        invalid_res = client.patch(
            "/api/admin/commission",
            json={"commission_rate": "1.5"},
            headers=self.admin_headers
        )
        self.assertEqual(invalid_res.status_code, 422)

        # Restore back to 5% (0.05)
        restore_res = client.patch(
            "/api/admin/commission",
            json={"commission_rate": "0.05", "reason": "Restore baseline test rate"},
            headers=self.admin_headers
        )
        self.assertEqual(restore_res.status_code, 200)

    # --------------------------------------------------------------------------
    # 5. User Management & Soft Deactivation
    # --------------------------------------------------------------------------
    def test_11_user_list_and_detail(self):
        """Admin can list and view campus user profiles."""
        res = client.get("/api/admin/users", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        users = res.json()
        self.assertGreaterEqual(len(users), 3)

        first_user_id = users[0]["id"]
        detail_res = client.get(f"/api/admin/users/{first_user_id}", headers=self.admin_headers)
        self.assertEqual(detail_res.status_code, 200)
        self.assertEqual(detail_res.json()["id"], first_user_id)

    def test_12_user_soft_deactivation_and_reactivation(self):
        """Admin can soft deactivate and reactivate a student user."""
        target_user = self.student_user
        self.assertTrue(target_user.is_active)

        # Deactivate
        deact_res = client.patch(
            f"/api/admin/users/{target_user.id}/status",
            json={"is_active": False, "reason": "Temporary suspension for conduct review"},
            headers=self.admin_headers
        )
        self.assertEqual(deact_res.status_code, 200)
        self.assertFalse(deact_res.json()["is_active"])

        # Reactivate
        react_res = client.patch(
            f"/api/admin/users/{target_user.id}/status",
            json={"is_active": True, "reason": "Suspension lifted"},
            headers=self.admin_headers
        )
        self.assertEqual(react_res.status_code, 200)
        self.assertTrue(react_res.json()["is_active"])

    def test_13_prevent_admin_self_deactivation(self):
        """Admin must not be allowed to deactivate their own account."""
        res = client.patch(
            f"/api/admin/users/{self.admin_user.id}/status",
            json={"is_active": False, "reason": "Accidental self-lockout"},
            headers=self.admin_headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("cannot deactivate your own administrator account", res.json()["detail"].lower())

    # --------------------------------------------------------------------------
    # 6. Canteen Management & Soft Deactivation
    # --------------------------------------------------------------------------
    def test_14_canteen_management_and_status_toggle(self):
        """Admin can view canteens and toggle active status."""
        res = client.get("/api/admin/canteens", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        canteens = res.json()
        self.assertGreaterEqual(len(canteens), 3)

        canteen_id = canteens[0]["id"]
        original_status = canteens[0]["is_active"]

        # Toggle status
        toggle_res = client.patch(
            f"/api/admin/canteens/{canteen_id}/status",
            json={"is_active": not original_status, "reason": "Administrative maintenance"},
            headers=self.admin_headers
        )
        self.assertEqual(toggle_res.status_code, 200)
        self.assertEqual(toggle_res.json()["is_active"], not original_status)

        # Revert back
        revert_res = client.patch(
            f"/api/admin/canteens/{canteen_id}/status",
            json={"is_active": original_status, "reason": "Maintenance complete"},
            headers=self.admin_headers
        )
        self.assertEqual(revert_res.status_code, 200)
        self.assertEqual(revert_res.json()["is_active"], original_status)

    # --------------------------------------------------------------------------
    # 7. Refund Queue & Decisions
    # --------------------------------------------------------------------------
    def test_15_refund_queue_and_processing(self):
        """Admin can list pending refunds and process approvals or rejections."""
        # List refunds
        res = client.get("/api/admin/refunds", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        refunds = res.json()
        self.assertIsInstance(refunds, list)

        # If there are any pending refunds, test processing
        pending = [r for r in refunds if r["status"] == "REQUESTED"]
        if pending:
            target_refund = pending[0]
            action_res = client.post(
                f"/api/admin/refunds/{target_refund['id']}/process",
                json={"action": "APPROVE", "notes": "Approved by Platform Admin during audit"},
                headers=self.admin_headers
            )
            self.assertEqual(action_res.status_code, 200)
            self.assertEqual(action_res.json()["status"], "COMPLETED")

    # --------------------------------------------------------------------------
    # 8. Audit Logs
    # --------------------------------------------------------------------------
    def test_16_audit_logs_recorded(self):
        """Administrative actions must generate immutable audit logs."""
        res = client.get("/api/admin/audit-logs", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        logs = res.json()
        self.assertIsInstance(logs, list)
        self.assertGreater(len(logs), 0)

        # Check fields
        log = logs[0]
        self.assertIn("admin_user_id", log)
        self.assertIn("admin_name", log)
        self.assertIn("action", log)
        self.assertIn("affected_object", log)
        self.assertIn("created_at", log)

    # --------------------------------------------------------------------------
    # 9. Multi-College Support
    # --------------------------------------------------------------------------
    def test_17_colleges_list_and_creation(self):
        """Admin can list campuses and register a new university campus."""
        res = client.get("/api/admin/colleges", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        colleges = res.json()
        self.assertGreaterEqual(len(colleges), 1)
        # Verify KIET University is present
        kiet = next((c for c in colleges if "KIET" in c["name"]), None)
        self.assertIsNotNone(kiet, "KIET University must be seeded as college #1")

        # Create a new college
        new_col_payload = {
            "name": "Delhi Technical Campus",
            "code": "DTC-DELHI",
            "location": "Greater Noida, UP"
        }
        create_res = client.post(
            "/api/admin/colleges",
            json=new_col_payload,
            headers=self.admin_headers
        )
        self.assertIn(create_res.status_code, (200, 400))  # 400 if already exists
        if create_res.status_code == 200:
            created = create_res.json()
            self.assertEqual(created["code"], "DTC-DELHI")

    def test_18_overview_filter_by_college(self):
        """Overview endpoint accepts college_id query param for multi-college filtering."""
        res = client.get("/api/admin/overview?college_id=1", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("gross_sales", data)
        self.assertIn("total_canteens", data)

    # --------------------------------------------------------------------------
    # 10. Financial Integrity & Invariants
    # --------------------------------------------------------------------------
    def test_19_historical_commission_snapshot_preservation(self):
        """Updating platform commission rate does not alter historical commission rates or ledger snapshots."""
        # Find an existing commission ledger entry
        existing_ledger = self.db.query(models.FinancialLedger).filter(
            models.FinancialLedger.transaction_type == models.FinancialLedgerTxType.PLATFORM_COMMISSION
        ).first()
        if existing_ledger:
            original_amount = existing_ledger.amount
            
            # Change global rate to 10%
            client.patch(
                "/api/admin/commission",
                json={"commission_rate": "0.10", "reason": "Rate hike simulation"},
                headers=self.admin_headers
            )

            # Re-read the historical ledger row from fresh DB session
            self.db.refresh(existing_ledger)
            self.assertEqual(existing_ledger.amount, original_amount, "Historical ledger entry must remain immutable")

            # Restore rate
            client.patch(
                "/api/admin/commission",
                json={"commission_rate": "0.05", "reason": "Restored baseline rate"},
                headers=self.admin_headers
            )

    def test_20_financial_ledger_idempotency_protection(self):
        """Attempting to record ledger entry with existing idempotency key must not duplicate rows."""
        import uuid
        from app.main import record_financial_ledger_entry
        test_key = f"IDEMP-TEST-LEDGER-{uuid.uuid4().hex[:8]}"
        
        entry1 = record_financial_ledger_entry(
            db=self.db,
            amount=Decimal("150.00"),
            transaction_type=models.FinancialLedgerTxType.CUSTOMER_PAYMENT,
            idempotency_key=test_key,
            notes="Initial test entry"
        )
        self.assertIsNotNone(entry1)

        # Second attempt with same key
        entry2 = record_financial_ledger_entry(
            db=self.db,
            amount=Decimal("150.00"),
            transaction_type=models.FinancialLedgerTxType.CUSTOMER_PAYMENT,
            idempotency_key=test_key,
            notes="Duplicate attempt"
        )
        self.assertEqual(entry1.id, entry2.id, "Should return existing record without creating duplicate")
        self.db.commit()

    def test_21_refund_rejection_workflow(self):
        """Admin can reject an eligible refund with audit trail."""
        import uuid
        # Create a pending refund in DB for testing
        order = self.db.query(models.Order).first()
        test_refund = models.Refund(
            refund_reference=f"REF-TEST-REJECT-{uuid.uuid4().hex[:8]}",
            order_id=order.id,
            user_id=order.user_id,
            canteen_id=order.canteen_id,
            amount=Decimal("25.00"),
            reason="Accidental duplicate charge request",
            status=models.RefundStatus.REQUESTED
        )
        self.db.add(test_refund)
        self.db.commit()
        self.db.refresh(test_refund)

        # Reject it
        reject_res = client.post(
            f"/api/admin/refunds/{test_refund.id}/process",
            json={"action": "REJECT", "notes": "Items already consumed according to CCTV"},
            headers=self.admin_headers
        )
        self.assertEqual(reject_res.status_code, 200)
        self.assertEqual(reject_res.json()["status"], "REJECTED")

if __name__ == "__main__":
    unittest.main()

