# Deployment Runbook

## Backend Deployment (Render or Railway)

1. Preferred path: use the repo-level `render.yaml` for Render so build/start commands are prefilled.
2. If configuring manually, set backend root directory to `backend/`.
3. Set start command:
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables:
   `GEMINI_API_KEY`, `LLM_MODEL`, `ALLOWED_ORIGINS`
5. Verify the public health endpoint returns:
   `{"status":"ok"}`

## Frontend Deployment (Vercel)

1. Import the `frontend/` directory as the Vercel project root.
2. The included `frontend/vercel.json` marks this as a Vite app.
3. Set environment variable:
   `VITE_API_BASE_URL=<deployed backend URL>`
4. Deploy and verify API calls from production UI.

## Pre-Demo Final Checks

1. Validate CORS origin list includes frontend URL (set `ALLOWED_ORIGINS` first, then redeploy backend).
2. Run backend smoke test from `backend/`:
   `python smoke_test.py`
3. Validate fallback behavior from `backend/`:
   `FORCE_FALLBACK=1 python smoke_test.py`
4. Run one complete onboarding-to-roadmap flow in deployed frontend.
5. Freeze sample inputs for predictable output.
6. Keep one backup deployment link.

## Incident Response

- If Gemini fails: demonstrate fallback roadmap with transparency.
- If backend fails: switch to backup deployment URL.
- If frontend fails: use API response screenshots and explain architecture.
