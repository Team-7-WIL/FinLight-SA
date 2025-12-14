@echo off
REM Script to start FinLight SA in web mode with proper error handling

echo Starting FinLight SA Web Application...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+ and add it to PATH.
    pause
    exit /b 1
)

REM Check if .NET SDK is available
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: .NET SDK not found. Please install .NET 8 SDK and add it to PATH.
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+ and add it to PATH.
    pause
    exit /b 1
)

echo [1/3] Starting AI Service (Python FastAPI)...
start "AI Service" cmd /k "cd ai-service && python -m uvicorn main:app --reload --port 8000"

echo Waiting for AI service to start...
timeout /t 3 /nobreak >nul

echo [2/3] Starting Backend API (.NET)...
start "Backend API" cmd /k "cd backend\FinLightSA.API && dotnet run --urls=http://localhost:5175"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend (React Native Web)...
echo.
echo Opening FinLight SA in your default browser...
echo If the page doesn't open automatically, visit: http://localhost:19006
echo.
echo Press Ctrl+C in each terminal window to stop the services.
echo.

start "FinLight SA Web" cmd /k "cd mobile && npx expo start --web --port 19006"

echo.
echo All services are starting...
echo - AI Service: http://localhost:8000
echo - Backend API: http://localhost:5175
echo - Frontend Web: http://localhost:19006
echo.
echo The app should load within 10-15 seconds.
echo If you see a blank page, check the browser console for errors.
pause