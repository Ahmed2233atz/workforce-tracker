@echo off
title WorkForce Tracker - Starting...
echo.
echo  ================================
echo   WorkForce Tracker
echo  ================================
echo.

:: Kill anything on ports 3001 and 5173
echo [1/3] Clearing ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " 2^>nul') do taskkill /f /pid %%a >nul 2>&1
timeout /t 1 /nobreak >nul

:: Start backend
echo [2/3] Starting backend (port 3001)...
start "Backend - WorkForce API" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak >nul

:: Start frontend
echo [3/3] Starting frontend (port 5173)...
start "Frontend - WorkForce UI" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo  ================================
echo   App is ready!
echo  ================================
echo.
echo   Local:   http://localhost:5173
echo.
echo   Accounts:
echo   - ahmed@company.com   / admin123  (Admin)
echo   - abdo@company.com    / admin123  (Admin)
echo   - alice@company.com   / worker123 (Worker)
echo   - bob@company.com     / worker123 (Worker)
echo   - carol@company.com   / worker123 (Worker)
echo   - david@company.com   / worker123 (Worker)
echo   - eve@company.com     / worker123 (Worker)
echo.
echo   Press any key to open in browser...
pause >nul
start http://localhost:5173
