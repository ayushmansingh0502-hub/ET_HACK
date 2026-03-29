@echo off
REM FinMentor Dev Server Starter (Windows Batch)
REM Starts both backend (FastAPI) and frontend (React/Vite) simultaneously

setlocal enabledelayedexpansion

echo.
echo ===========================================
echo.
echo   FinMentor Development Server Starter
echo.
echo ===========================================
echo.

REM Get the current directory
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

REM Check if backend .env exists
if not exist "backend\.env" (
    echo Checking backend\.env...
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [OK] Created backend\.env from .env.example
    ) else (
        echo [ERROR] backend\.env.example not found!
        pause
        exit /b 1
    )
)

REM Check if Node modules are installed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd "%ROOT_DIR%"
    echo.
)

REM Check if Python venv exists
if not exist "backend\.venv312" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv .venv312
    call .\.venv312\Scripts\pip.exe install -q --upgrade pip
    call .\.venv312\Scripts\pip.exe install -q -r requirements.txt
    cd "%ROOT_DIR%"
    echo.
)

echo Starting servers...
echo.

REM Start backend in a new window
echo Launching Backend (FastAPI on http://localhost:8000)...
start "FinMentor Backend" cmd /k ^
    "cd /d "%ROOT_DIR%backend" && ^
    .\.venv312\Scripts\activate.bat && ^
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 2 /nobreak

REM Start frontend in a new window
echo Launching Frontend (Vite on http://localhost:5173)...
start "FinMentor Frontend" cmd /k ^
    "cd /d "%ROOT_DIR%frontend" && ^
    npm run dev"

echo.
echo ============================================
echo Both servers are starting!
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:8000
echo API Docs:  http://localhost:8000/docs
echo ============================================
echo.
echo Tips:
echo  * Both servers will auto-reload on code changes
echo  * Close either window to stop that server
echo  * Press Ctrl+C in the terminal to stop servers
echo.

endlocal
