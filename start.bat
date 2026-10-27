@echo off
echo ========================================================
echo Starting AICTE Complaint Intelligence Hub (CIH) System
echo ========================================================

start "AICTE CIH Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "AICTE CIH Frontend (Vite React)" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Both servers launched!
echo Backend:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://127.0.0.1:5173
echo.
