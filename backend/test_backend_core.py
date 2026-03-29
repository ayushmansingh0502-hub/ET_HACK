import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.finance import calculate_money_health
from app.main import app
from app.schemas import UserProfileInput


def build_profile(**overrides):
    base = {
        "name": "Aarav",
        "age": 31,
        "city": "Pune",
        "monthly_salary": 98000,
        "monthly_side_income": 12000,
        "expected_salary_growth_rate": 10,
        "fixed_expenses": 32000,
        "variable_expenses": 18000,
        "annual_expenses": 90000,
        "emergency_savings": 210000,
        "existing_investments": 420000,
        "outstanding_debt": 140000,
        "annual_debt_payment": 72000,
        "term_insurance_cover": 6000000,
        "health_insurance_cover": 800000,
        "tax_saving_80c": 150000,
        "tax_saving_80d": 25000,
        "nps_investment": 30000,
        "retirement_age": 58,
        "goals": [
            {"name": "Home", "target_amount": 3500000, "timeline_months": 72},
            {"name": "Retirement", "target_amount": 30000000, "timeline_months": 324},
        ],
    }
    base.update(overrides)
    return base


class BackendCoreTests(unittest.TestCase):
    def test_retirement_age_must_be_greater_than_age(self):
        with self.assertRaises(ValidationError):
            UserProfileInput(**build_profile(age=58, retirement_age=58))

    def test_money_health_score_stays_within_bounds(self):
        profile = UserProfileInput(**build_profile(monthly_salary=0, monthly_side_income=0))
        response = calculate_money_health(profile)
        self.assertGreaterEqual(response["total_score"], 0)
        self.assertLessEqual(response["total_score"], 100)

    def test_fire_roadmap_fallback_hides_internal_error(self):
        client = TestClient(app)

        with patch("app.main._gemini_generate_roadmap", side_effect=ValueError("internal parse failure details")):
            response = client.post("/api/fire-roadmap", json=build_profile())

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["fallback_used"])
        self.assertEqual(data["model_used"], "rule-based-fallback")
        self.assertIn("fallback mode", data.get("notes", "").lower())
        self.assertNotIn("internal parse failure details", data.get("notes", ""))


if __name__ == "__main__":
    unittest.main()
