@echo off
setlocal enabledelayedexpansion
title [Management Hub] Platform Server
cd /d "%~dp0"

echo =========================================================
echo   [Management Hub] - Platform Server (Node.js Backend)
echo =========================================================
echo.

:: Check node_modules
if not exist "node_modules\" (
    echo [1/2] Installing dependencies...
    call npm install
)

echo [2/2] Starting server at http://127.0.0.1:5000 ...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5000"
node server.js

pause
