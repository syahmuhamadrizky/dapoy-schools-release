@echo off
title Dapoy Schools Server
color 0A

:: ============================================================
::  Dapoy Schools - Universal Start Script
:: ============================================================

cd /d "%~dp0"

:: Kill existing server on port 5001
echo [*] Mengecek port 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
    echo [x] Menghentikan PID %%a pada port 5001...
    taskkill //F //PID %%a >nul 2>&1
)
ping 127.0.0.1 -n 3 >nul 2>&1

echo.
echo =======================================================
echo               DAPOY SCHOOLS SERVER
echo =======================================================
echo.

if exist "dist\server.cjs" (
    echo [*] Mode: PRODUCTION (dist/server.cjs ditemukan)
    set NODE_ENV=production
    echo [*] Memulai server...
    echo [*] Buka browser dan akses: http://localhost:5001
    echo.
    node "%~dp0dist\server.cjs"
) else (
    echo [*] Mode: DEVELOPMENT (Source Code)
    echo [*] Memulai server Vite ^& Node...
    echo [*] Buka browser dan akses: http://localhost:5001
    echo.
    npm run dev
)

pause
