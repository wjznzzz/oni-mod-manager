@echo off
title ONIModManager - Running

cd /d "%~dp0"
set VENV_DIR=%~dp0venv
set PYTHON=%VENV_DIR%\Scripts\python.exe

if not exist "%PYTHON%" (
    echo [ERROR] Virtual environment not found. Run install.bat first.
    pause
    exit /b 1
)

echo Starting ONI Mod Manager...
echo.

start "ONIModManager Backend" /min "%PYTHON%" "%~dp0app.py"

echo Waiting for server to be ready...
set /a count=0
:waitloop
timeout /t 1 /nobreak >nul
set /a count+=1
netstat -ano | findstr "127.0.0.1:9420" | findstr "LISTENING" >nul
if %errorlevel% equ 0 goto :server_ready
if %count% geq 30 goto :timeout
goto :waitloop

:server_ready
echo Server is ready!
start http://127.0.0.1:9420
echo.
echo Backend running at http://127.0.0.1:9420
echo Close the backend window to stop.
echo.
pause

:timeout
echo [WARN] Server did not start within 30s.
echo Please check the backend window for errors.
pause
