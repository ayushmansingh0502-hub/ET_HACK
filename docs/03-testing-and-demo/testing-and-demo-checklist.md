# Testing and Demo Checklist

## API Smoke Tests

1. Use `backend/test_payload.json` as the fixed request body for all manual checks.
2. Run `python smoke_test.py` inside `backend/` for a fast local pass.
3. Run `FORCE_FALLBACK=1 python smoke_test.py` to confirm roadmap fallback behavior.
4. GET /health returns status ok.
5. POST /api/money-health returns score and breakdown.
6. POST /api/fire-roadmap returns roadmap with fallback metadata.

## Frontend Functional Tests

1. All steps in onboarding are navigable.
2. Numeric fields handle valid and zero values.
3. Goals can be added and removed.
4. Error message appears on API failure.

## Demo Reliability Checks

1. Confirm backend and frontend are both reachable.
2. Keep one fixed demo profile ready.
3. Keep screenshot backup of outputs.
4. Prepare fallback narrative if LLM response degrades.

## Demo Talk Track

1. Problem statement and user pain.
2. 5-minute onboarding walkthrough.
3. Money Health Score explanation.
4. FIRE roadmap and next-month actions.
5. Social impact and scalability.
