@echo off
title SDN Tangerang 2 - E-Learning Server
color 0A

:: ============================================================
::  SDN Tangerang 2 - Portable Start Script (Production Mode)
:: ============================================================

cd /d "%~dp0"

:: Kill existing server on port 5001
echo [*] Checking for existing servers on port 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
    echo [x] Stopping PID %%a on port 5001...
    taskkill //F //PID %%a >nul 2>&1
)
ping 127.0.0.1 -n 3 >nul 2>&1

:: Set production mode
set NODE_ENV=production

echo.
echo =======================================================
echo   SDN TANGERANG 2 - E-LEARNING SERVER
echo   Mode: PRODUCTION (Vite Dev Server Disabled)
echo =======================================================
echo.
echo [*] Starting server...
echo [*] Open: http://localhost:5001
echo [*] E-Learning: http://localhost:5001/el/login
echo.

node "%~dp0dist\server.cjs"

pause