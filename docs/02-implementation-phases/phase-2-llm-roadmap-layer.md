# Phase 2 - LLM Roadmap Layer

## Goals

- Generate FIRE roadmap using Gemini API.
- Guarantee fallback roadmap when LLM output fails.

## Tasks

1. Add Gemini client setup from environment.
2. Create strict prompt for JSON roadmap output.
3. Parse and validate JSON response.
4. Return deterministic fallback on LLM or parsing failure.

## Done Criteria

- Endpoint POST /api/fire-roadmap always returns usable roadmap.
- model_used and fallback_used fields accurately reflect execution path.

## Status

- Status: Completed
- Completed: Gemini integration with fallback.
- Pending: Add provider abstraction for future OpenAI/Claude support.
- Risks: LLM occasionally returns fenced text or malformed JSON.
- Next Step: Frontend enhancement for demo speed and clarity.
