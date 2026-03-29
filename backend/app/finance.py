from __future__ import annotations

from typing import Dict, List

from .schemas import UserProfileInput


def _clamp_score(value: float) -> int:
    return max(0, min(100, int(round(value))))


def _monthly_income(profile: UserProfileInput) -> float:
    return profile.monthly_salary + profile.monthly_side_income


def _monthly_expense(profile: UserProfileInput) -> float:
    annual_monthly = profile.annual_expenses / 12
    return profile.fixed_expenses + profile.variable_expenses + annual_monthly


def calculate_money_health(profile: UserProfileInput) -> Dict:
    income = _monthly_income(profile)
    monthly_expense = _monthly_expense(profile)
    annual_income = income * 12

    emergency_target = monthly_expense * 6
    emergency_ratio = profile.emergency_savings / emergency_target if emergency_target else 1
    emergency_score = _clamp_score(emergency_ratio * 100)

    term_required = annual_income * 10
    health_required = 500000
    term_ratio = profile.term_insurance_cover / term_required if term_required else 1
    health_ratio = profile.health_insurance_cover / health_required if health_required else 1
    insurance_score = _clamp_score(((term_ratio + health_ratio) / 2) * 100)

    investment_ratio = profile.existing_investments / (annual_income * 0.5) if annual_income else 0
    investments_score = _clamp_score(min(1, investment_ratio) * 100)

    dti = (profile.annual_debt_payment / annual_income) if annual_income else 0
    debt_score = _clamp_score(100 - (dti * 200))

    tax_target = 150000 + 25000 + 50000
    tax_used = profile.tax_saving_80c + profile.tax_saving_80d + profile.nps_investment
    tax_score = _clamp_score((tax_used / tax_target) * 100)

    years_to_retire = max(1, profile.retirement_age - profile.age)
    target_corpus = annual_income * 20
    future_needed_per_year = target_corpus / years_to_retire
    current_savings_per_year = max(0, (income - monthly_expense) * 12)
    retirement_ratio = current_savings_per_year / future_needed_per_year if future_needed_per_year else 1
    retirement_score = _clamp_score(retirement_ratio * 100)

    breakdown = {
        "emergency_fund": emergency_score,
        "insurance": insurance_score,
        "investments": investments_score,
        "debt": debt_score,
        "tax_planning": tax_score,
        "retirement": retirement_score,
    }

    total_score = _clamp_score(sum(breakdown.values()) / len(breakdown))

    if total_score >= 80:
        grade = "EXCELLENT"
    elif total_score >= 65:
        grade = "GOOD"
    elif total_score >= 50:
        grade = "FAIR"
    else:
        grade = "NEEDS ATTENTION"

    insights: List[str] = []
    if emergency_score < 60:
        gap = max(0, emergency_target - profile.emergency_savings)
        insights.append(f"Emergency fund is below target by INR {gap:,.0f}.")
    if insurance_score < 60:
        insights.append("Insurance cover is insufficient. Prioritize term and health cover.")
    if debt_score < 60:
        insights.append("Debt servicing ratio is high. Reduce high-interest debt first.")
    if tax_score < 60:
        insights.append("Tax-saving buckets are underutilized (80C, 80D, NPS).")
    if retirement_score < 60:
        insights.append("Retirement corpus trajectory is behind your expected target.")

    if not insights:
        insights.append("Strong base across core money fundamentals. Keep reviewing every quarter.")

    quick_actions: List[str] = []
    if emergency_score < 70:
        quick_actions.append("Auto-transfer a fixed amount monthly to build a 6-month emergency fund.")
    if insurance_score < 70:
        quick_actions.append("Buy term insurance close to 10x your annual income and add family health cover.")
    if tax_score < 70:
        quick_actions.append("Use remaining 80C and NPS limits before year-end for tax efficiency.")
    if debt_score < 70:
        quick_actions.append("Create a debt payoff plan and stop revolving credit card balances.")
    if retirement_score < 70:
        quick_actions.append("Increase monthly SIP toward retirement before lifestyle upgrades.")

    top_actions = quick_actions[:3] if quick_actions else ["Continue monthly SIP and rebalance portfolio twice a year."]

    return {
        "total_score": total_score,
        "grade": grade,
        "breakdown": breakdown,
        "insights": insights,
        "top_actions": top_actions,
    }


def build_fallback_roadmap(profile: UserProfileInput) -> Dict:
    income = _monthly_income(profile)
    monthly_expense = _monthly_expense(profile)
    surplus = max(0, income - monthly_expense)
    emergency_target = monthly_expense * 6
    emergency_gap = max(0, emergency_target - profile.emergency_savings)

    retirement_sip = int(max(0, surplus * 0.4))
    goals_sip_pool = int(max(0, surplus * 0.5))

    goal_plan = []
    per_goal = int(goals_sip_pool / len(profile.goals)) if profile.goals else 0
    for goal in profile.goals:
        goal_plan.append(
            {
                "goal": goal.name,
                "target_amount": goal.target_amount,
                "timeline_months": goal.timeline_months,
                "suggested_monthly_sip": per_goal,
            }
        )

    return {
        "summary": {
            "monthly_income": income,
            "monthly_expenses": monthly_expense,
            "monthly_surplus": surplus,
            "emergency_fund_target": emergency_target,
            "emergency_fund_gap": emergency_gap,
        },
        "emergency_fund_plan": {
            "target_amount": emergency_target,
            "current_amount": profile.emergency_savings,
            "monthly_contribution": int(max(0, emergency_gap / 12)),
        },
        "year_1_action_plan": [
            f"Build emergency fund with monthly contribution of INR {int(max(0, emergency_gap / 12)):,.0f}.",
            f"Start retirement SIP of INR {retirement_sip:,.0f} in low-cost index funds.",
            "Review term and health insurance coverage in first 30 days.",
            "Create monthly tax-saving tracker for 80C, 80D, and NPS.",
        ],
        "sip_plan": {
            "retirement_monthly_sip": retirement_sip,
            "goal_sips": goal_plan,
        },
        "insurance_recommendations": {
            "term_insurance_target": int((income * 12) * 10),
            "health_insurance_target": 500000,
        },
        "tax_moves": [
            "Maximize 80C up to INR 1,50,000.",
            "Use 80D for health insurance premium deductions.",
            "Consider NPS contribution for additional tax benefit under 80CCD(1B).",
        ],
        "risks": [
            "High discretionary spending can reduce SIP consistency.",
            "Insurance shortfall can derail long-term goals if not corrected early.",
        ],
    }
