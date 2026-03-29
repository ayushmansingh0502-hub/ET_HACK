# Phase 1 - Backend Foundation

## Goals

- Implement deterministic Money Health scoring engine.
- Validate request schema strictly.
- Ensure API returns consistent shape.

## Tasks

1. Finalize pydantic schemas.
2. Implement scoring formulas with clamp logic.
3. Add actionable insights and top actions generation.
4. Expose endpoint POST /api/money-health.

## Done Criteria

- Endpoint responds correctly for happy path and edge inputs.
- No runtime errors for expected numeric bounds.
- Response contract matches docs.

## Status

- Status: Completed
- Completed: Scoring engine and endpoint implemented.
- Completed: Added automated backend core tests for validation, fallback behavior, and score bounds.
- Completed: Expanded test coverage with edge cases (grade mapping, breakdown keys, score bounds per category), CORS header assertions, health endpoint, 422 validation, fallback roadmap structure, and empty-goals handling.
- Risks: Formula weight calibration may need user feedback.
- Next Step: LLM roadmap stability hardening.
