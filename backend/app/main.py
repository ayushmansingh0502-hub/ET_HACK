import json
import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.generativeai import GenerativeModel, configure

from .finance import build_fallback_roadmap, calculate_money_health
from .schemas import FireRoadmapResponse, MoneyHealthResponse, UserProfileInput

load_dotenv()
logger = logging.getLogger(__name__)

app = FastAPI(title="FinMentor API", version="0.1.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_gemini_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    placeholder_markers = ("your_", "placeholder", "add_your_real_key")
    if not api_key or any(marker in api_key.lower() for marker in placeholder_markers):
        raise RuntimeError("Missing GEMINI_API_KEY")
    return api_key


def _gemini_generate_roadmap(profile: UserProfileInput) -> dict:
    api_key = _get_gemini_api_key()
    llm_model = os.getenv("LLM_MODEL", "gemini-1.5-flash")

    configure(api_key=api_key)
    model = GenerativeModel(llm_model)

    serialized_goals = [goal.model_dump() if hasattr(goal, "model_dump") else goal.dict() for goal in profile.goals]

    prompt = f"""
You are a certified financial mentor for Indian salaried users.
Create a detailed but practical financial roadmap in strict JSON.

User profile:
- Name: {profile.name}
- Age: {profile.age}
- City: {profile.city}
- Monthly salary: {profile.monthly_salary}
- Monthly side income: {profile.monthly_side_income}
- Expected salary growth rate (%): {profile.expected_salary_growth_rate}
- Fixed expenses: {profile.fixed_expenses}
- Variable expenses: {profile.variable_expenses}
- Annual expenses: {profile.annual_expenses}
- Emergency savings: {profile.emergency_savings}
- Existing investments: {profile.existing_investments}
- Outstanding debt: {profile.outstanding_debt}
- Annual debt payment: {profile.annual_debt_payment}
- Term insurance cover: {profile.term_insurance_cover}
- Health insurance cover: {profile.health_insurance_cover}
- Tax saving under 80C: {profile.tax_saving_80c}
- Tax saving under 80D: {profile.tax_saving_80d}
- NPS investment: {profile.nps_investment}
- Retirement age: {profile.retirement_age}
- Goals: {json.dumps(serialized_goals)}

Return JSON with keys:
summary, emergency_fund_plan, sip_plan, insurance_recommendations, tax_moves, risks, year_1_action_plan
Use numeric values in INR where relevant.
""".strip()

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0,
            "top_p": 1,
        },
    )
    text = (response.text or "").strip()

    cleaned = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(cleaned)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/money-health", response_model=MoneyHealthResponse)
def money_health(profile: UserProfileInput) -> dict:
    return calculate_money_health(profile)


@app.post("/api/fire-roadmap", response_model=FireRoadmapResponse)
def fire_roadmap(profile: UserProfileInput) -> dict:
    fallback = build_fallback_roadmap(profile)
    llm_model = os.getenv("LLM_MODEL", "gemini-1.5-flash")

    try:
        roadmap = _gemini_generate_roadmap(profile)
        return {
            "roadmap": roadmap,
            "model_used": llm_model,
            "fallback_used": False,
            "notes": "Generated using configured LLM provider.",
        }
    except (RuntimeError, ValueError, json.JSONDecodeError):
        logger.exception("Gemini unavailable or returned invalid JSON. Using fallback roadmap.")
        return {
            "roadmap": fallback,
            "model_used": "rule-based-fallback",
            "fallback_used": True,
            "notes": "Roadmap generated in fallback mode due to temporary LLM unavailability.",
        }
    except Exception:
        logger.exception("Unexpected Gemini request failure. Using fallback roadmap.")
        return {
            "roadmap": fallback,
            "model_used": "rule-based-fallback",
            "fallback_used": True,
            "notes": "Roadmap generated in fallback mode due to temporary request failure.",
        }
