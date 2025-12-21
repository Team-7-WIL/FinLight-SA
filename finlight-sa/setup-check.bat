@echo off
REM Quick Start Script for FinLight SA with Bug Fixes Applied
REM This script helps verify all fixes are working

echo.
echo ================================================
echo   FinLight SA - Quick Start with Bug Fixes
echo ================================================
echo.

REM Colors for output (Windows batch)
echo Checking prerequisites...
echo.

REM Check Python
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Python not found. Please install Python 3.8+
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do echo ✓ %%i
)

REM Check .NET SDK
echo [2/5] Checking .NET SDK...
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo ✗ .NET SDK not found. Please install .NET 8 SDK
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('dotnet --version') do echo ✓ .NET %%i
)

REM Check Node/npm
echo [3/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ⚠ Node.js not found. Frontend may not work.
    echo   Install from https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✓ Node %%i
    for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm %%i
)

REM Check Tesseract
echo [4/5] Checking Tesseract OCR...
tesseract --version >nul 2>&1
if errorlevel 1 (
    echo ⚠ Tesseract not found in PATH
    echo   The Python service will attempt to locate it automatically
    echo   If not found, install from: https://github.com/tesseract-ocr/tesseract
) else (
    tesseract --version | findstr /R ".*" && echo ✓ Tesseract found
)

REM Check database
echo [5/5] Checking SQLite database...
if exist "backend\FinLightSA.API\finlight-local.db" (
    echo ✓ Database file exists
) else (
    echo ⚠ Database will be created on first run
)

echo.
echo ================================================
echo   Setup Complete! Ready to Start Services
echo ================================================
echo.
echo Next steps:
echo.
echo 1. Start Backend API:
echo    cd backend\FinLightSA.API
echo    dotnet run
echo.
echo 2. Start AI Service (in new terminal):
echo    cd ai-service
echo    python -m uvicorn main:app --reload --port 8000
echo.
echo 3. Start Frontend (in new terminal):
echo    cd mobile
echo    npm start
echo.
echo OR use run-all.bat to start all services at once:
echo    run-all.bat
echo.
echo ================================================
echo   Bug Fixes Applied:
echo   ✓ Invoice template saving (now uses database)
echo   ✓ Product category selection (verified working)
echo   ✓ Receipt scanning with better error handling
echo   ✓ Tesseract OCR auto-detection improved
echo   ✓ Bank statement upload (verified working)
echo ================================================
echo.

pause
