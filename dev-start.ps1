# FinMentor Dev Server Starter - Simplified

Write-Host "🚀 FinMentor Development Server Starter" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\.venv312\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 2

Write-Host "Starting Frontend (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ Both servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan

