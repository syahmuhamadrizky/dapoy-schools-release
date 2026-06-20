@echo off
title Start Dapoy Schools Server
color 0A

echo ========================================================
echo             MEMULAI SERVER DAPOY SCHOOLS
echo ========================================================
echo.

:: Daftar port yang biasanya digunakan oleh server dan Vite HMR
set PORTS=5001 24678 5173

for %%p in (%PORTS%) do (
    echo [*] Mengecek port %%p...
    for /f "tokens=5" %%a in ('netstat -aon ^| find "LISTENING" ^| find ":%%p"') do (
        if not "%%a"=="0" (
            echo [*] Port %%p sedang digunakan oleh PID: %%a. Mematikan proses...
            taskkill /F /PID %%a >nul 2>&1
            :: Beri waktu sebentar agar OS benar-benar melepaskan port
            timeout /t 1 /nobreak >nul
        )
    )
)

echo.
echo [*] Semua port sudah bersih!
echo [*] Menjalankan npm run dev...
echo ========================================================
echo.

npm run dev

echo.
pause
