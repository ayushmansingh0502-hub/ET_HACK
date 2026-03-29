# API Contracts

## Base URL

- Local: http://localhost:8000

## GET /health

Response:

```json
{
  "status": "ok"
}
```

## POST /api/money-health

Request body:

```json
{
  "name": "Ayush",
  "age": 28,
  "city": "Bengaluru",
  "monthly_salary": 70000,
  "monthly_side_income": 0,
  "expected_salary_growth_rate": 8,
  "fixed_expenses": 28000,
  "variable_expenses": 14000,
  "annual_expenses": 60000,
  "emergency_savings": 80000,
  "existing_investments": 120000,
  "outstanding_debt": 200000,
  "annual_debt_payment": 84000,
  "term_insurance_cover": 0,
  "health_insurance_cover": 250000,
  "tax_saving_80c": 60000,
  "tax_saving_80d": 8000,
  "nps_investment": 0,
  "retirement_age": 58,
  "goals": [
    {
      "name": "Home Down Payment",
      "target_amount": 3000000,
      "timeline_months": 84
    }
  ]
}
```

Response body:

```json
{
  "total_score": 62,
  "grade": "FAIR",
  "breakdown": {
    "emergency_fund": 35,
    "insurance": 60,
    "investments": 75,
    "debt": 55,
    "tax_planning": 50,
    "retirement": 45
  },
  "insights": ["..."],
  "top_actions": ["...", "...", "..."]
}
```

## POST /api/fire-roadmap

Request body: same as money-health.

Response body:

```json
{
  "roadmap": {
    "summary": {
      "monthly_income": 110000,
      "monthly_expenses": 57500,
      "monthly_surplus": 52500,
      "emergency_fund_target": 345000,
      "emergency_fund_gap": 135000
    },
    "emergency_fund_plan": {
      "target_amount": 345000,
      "current_amount": 210000,
      "monthly_contribution": 11250
    },
    "year_1_action_plan": ["..."],
    "sip_plan": {
      "retirement_monthly_sip": 21000,
      "goal_sips": [
        {
          "goal": "Home Down Payment",
          "target_amount": 3500000,
          "timeline_months": 72,
          "suggested_monthly_sip": 13125
        }
      ]
    },
    "insurance_recommendations": {
      "term_insurance_target": 13200000,
      "health_insurance_target": 500000
    },
    "tax_moves": ["..."],
    "risks": ["..."]
  },
  "model_used": "gemini-1.5-flash",
  "fallback_used": false,
  "notes": "Generated using configured LLM provider."
}
```

## Error Handling Expectations

- Validation errors return 422.
- Fatal generation errors return 500.
- Missing/invalid LLM output returns deterministic fallback roadmap with fallback_used=true and a safe non-sensitive note.
