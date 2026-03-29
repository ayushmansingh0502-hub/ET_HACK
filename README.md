# FinMentor Hackathon MVP (Gemini API + FastAPI + React)

This is a ready-to-run MVP based on your PRD:
- Money Health Score (rule-based, deterministic)
- FIRE Roadmap (Gemini API-first, rule-based fallback)
- Multi-step onboarding + dashboard UI

## ⚡ Quick Start (One-Click)

**Option 1: PowerShell (Recommended for Windows)**
```powershell
.\dev-start.ps1
```

**Option 2: Batch File**
```cmd
dev-start.bat
```

Both scripts will:
- ✅ Check and create `.env` file if missing
- ✅ Install frontend dependencies (npm)
- ✅ Create Python virtual environment
- ✅ Start backend on `http://localhost:8000`
- ✅ Start frontend on `http://localhost:5173`
- ✅ Show quick access links and tips

When you see both windows running, your dev environment is ready! Close either window to stop that server.

---

## Planning and Execution Docs

Use [docs/README.md](docs/README.md) as the primary reference for planning-first execution.
All significant work should be tracked through the folder-based markdown workflow in docs.

## Project Structure

- `frontend/` React + Vite app
- `backend/` FastAPI service

## Manual Setup (if not using one-click scripts)

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Add your Gemini key in `backend/.env`:

```env
GEMINI_API_KEY=your_real_key
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=http://localhost:5173
```

Run backend:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173` and calls backend on `http://localhost:8000`.

## API Endpoints

- `GET /health`
- `POST /api/money-health`
- `POST /api/fire-roadmap`

Both POST endpoints accept the same onboarding payload.

## Demo Script (for Judges)

1. Fill onboarding in 5 steps with sample user.
2. Click **Generate Money Health + FIRE Plan**.
3. Show score breakdown and top 3 actions.
4. Show roadmap output and mention Gemini fallback safety.

## Quick Notes

- If Gemini key is missing or response JSON is invalid, roadmap still works using fallback logic.
- Here Gemini is only used as an LLM API provider for roadmap generation, not as an agent mode.
- Use this as MVP base; later you can add charts, auth, DB persistence, and WhatsApp integration.
