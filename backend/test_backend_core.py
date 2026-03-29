import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.finance import build_fallback_roadmap, calculate_money_health
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


class HealthEndpointTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_returns_ok(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_money_health_returns_required_fields(self):
        response = self.client.post("/api/money-health", json=build_profile())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for field in ("total_score", "grade", "breakdown", "insights", "top_actions"):
            self.assertIn(field, data)

    def test_money_health_returns_422_for_invalid_input(self):
        response = self.client.post("/api/money-health", json={"name": "X", "age": 200})
        self.assertEqual(response.status_code, 422)

    def test_cors_header_present_for_allowed_origin(self):
        origin = "http://localhost:5173"
        response = self.client.get("/health", headers={"Origin": origin})
        self.assertEqual(response.status_code, 200)
        self.assertIn("access-control-allow-origin", response.headers)

    def test_cors_preflight_returns_200(self):
        origin = "http://localhost:5173"
        response = self.client.options(
            "/api/money-health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        self.assertIn(response.status_code, (200, 204))


class MoneyHealthEdgeCaseTests(unittest.TestCase):
    def test_grade_excellent_for_high_scores(self):
        profile = UserProfileInput(**build_profile(
            emergency_savings=500000,
            term_insurance_cover=15000000,
            health_insurance_cover=1000000,
            existing_investments=2000000,
            annual_debt_payment=0,
            outstanding_debt=0,
            tax_saving_80c=150000,
            tax_saving_80d=25000,
            nps_investment=50000,
        ))
        result = calculate_money_health(profile)
        self.assertIn(result["grade"], ("EXCELLENT", "GOOD"))

    def test_grade_needs_attention_for_zero_profile(self):
        profile = UserProfileInput(**build_profile(
            monthly_salary=30000,
            monthly_side_income=0,
            emergency_savings=0,
            existing_investments=0,
            term_insurance_cover=0,
            health_insurance_cover=0,
            tax_saving_80c=0,
            tax_saving_80d=0,
            nps_investment=0,
            annual_debt_payment=60000,
        ))
        result = calculate_money_health(profile)
        self.assertIn(result["grade"], ("NEEDS ATTENTION", "FAIR"))

    def test_all_score_breakdown_keys_present(self):
        profile = UserProfileInput(**build_profile())
        result = calculate_money_health(profile)
        expected_keys = {"emergency_fund", "insurance", "investments", "debt", "tax_planning", "retirement"}
        self.assertEqual(set(result["breakdown"].keys()), expected_keys)

    def test_all_breakdown_scores_within_bounds(self):
        profile = UserProfileInput(**build_profile())
        result = calculate_money_health(profile)
        for key, value in result["breakdown"].items():
            self.assertGreaterEqual(value, 0, f"{key} score below 0")
            self.assertLessEqual(value, 100, f"{key} score above 100")

    def test_top_actions_not_empty(self):
        profile = UserProfileInput(**build_profile())
        result = calculate_money_health(profile)
        self.assertTrue(len(result["top_actions"]) > 0)

    def test_insights_not_empty(self):
        profile = UserProfileInput(**build_profile())
        result = calculate_money_health(profile)
        self.assertTrue(len(result["insights"]) > 0)


class FallbackRoadmapTests(unittest.TestCase):
    def test_fallback_roadmap_keys_present(self):
        profile = UserProfileInput(**build_profile())
        roadmap = build_fallback_roadmap(profile)
        for key in ("summary", "emergency_fund_plan", "year_1_action_plan", "sip_plan",
                    "insurance_recommendations", "tax_moves", "risks"):
            self.assertIn(key, roadmap)

    def test_fallback_roadmap_with_no_goals(self):
        profile = UserProfileInput(**build_profile(goals=[]))
        roadmap = build_fallback_roadmap(profile)
        self.assertEqual(roadmap["sip_plan"]["goal_sips"], [])

    def test_fallback_roadmap_surplus_non_negative(self):
        profile = UserProfileInput(**build_profile(fixed_expenses=200000, variable_expenses=200000))
        roadmap = build_fallback_roadmap(profile)
        self.assertGreaterEqual(roadmap["summary"]["monthly_surplus"], 0)

    def test_fire_roadmap_endpoint_fallback_structure(self):
        client = TestClient(app)
        with patch("app.main._gemini_generate_roadmap", side_effect=RuntimeError("llm down")):
            response = client.post("/api/fire-roadmap", json=build_profile())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("roadmap", data)
        self.assertIn("model_used", data)
        self.assertIn("fallback_used", data)
        self.assertTrue(data["fallback_used"])


if __name__ == "__main__":
    unittest.main()
