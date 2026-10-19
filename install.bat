@echo off
setlocal enabledelayedexpansion
title ONIModManager - Install

echo.
echo ===========================================
echo   ONI Mod Manager - One-Click Install
echo ===========================================
echo.

echo [1/3] Checking Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+ first.
    echo         Download: https://www.python.org/downloads/
    echo         Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo        Python %PYVER% detected.

for /f "tokens=1,2 delims=." %%a in ("%PYVER%") do (
    set MAJOR=%%a
    set MINOR=%%b
)
if %MAJOR% LSS 3 goto :ver_fail
if %MAJOR% EQU 3 if %MINOR% LSS 8 goto :ver_fail
goto :ver_ok

:ver_fail
echo [ERROR] Python version too low (current: %PYVER%). Need 3.8+.
pause
exit /b 1

:ver_ok
echo [2/3] Setting up virtual environment...
set VENV_DIR=%~dp0venv
if exist "%VENV_DIR%" (
    echo        Virtual environment already exists, skipping.
) else (
    python -m venv "%VENV_DIR%"
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo        Virtual environment created.
)

echo [3/3] Installing dependencies (Tsinghua mirror)...
set PIP=%VENV_DIR%\Scripts\pip.exe
"%PIP%" install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple >nul 2>&1
"%PIP%" install -r "%~dp0requirements.txt" -i https://pypi.tuna.tsinghua.edu.cn/simple
if !errorlevel! neq 0 (
    echo [WARN] Mirror failed, trying default source...
    "%PIP%" install -r "%~dp0requirements.txt"
    if !errorlevel! neq 0 (
        echo [ERROR] Dependency install failed. Check network and retry.
        pause
        exit /b 1
    )
)

echo.
echo ===========================================
echo   Install Complete! Double-click start.bat
echo ===========================================
echo.
pause
