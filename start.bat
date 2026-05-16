@echo off
echo Starting InvoiceIQ AI...

echo Starting Backend Server...
start cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo InvoiceIQ AI is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause