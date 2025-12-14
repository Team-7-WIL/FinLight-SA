@echo off
REM Batch script to run all services on Windows

echo Starting FinLight SA Application...

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Please install Python 3.8+ and add it to PATH.
    pause
    exit /b 1
)

REM Check if .NET SDK is available
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo .NET SDK not found. Please install .NET 8 SDK and add it to PATH.
    pause
    exit /b 1
)

REM Start AI Service
echo.
echo [1/3] Starting AI Service (Python FastAPI)...
start "AI Service" cmd /k "cd ai-service && python -m uvicorn main:app --reload --port 8000"

REM Wait a bit for AI service to start
timeout /t 3 /nobreak >nul

REM Start Backend API
echo.
echo [2/3] Starting Backend API (.NET)...
start "Backend API" cmd /k "cd backend\FinLightSA.API && dotnet run"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start Frontend
echo.
echo [3/3] Starting Frontend (React Native/Expo)...
start "Frontend" cmd /k "cd mobile && npm start"

echo.
echo All services starting...
echo AI Service: http://localhost:8000
echo Backend API: http://localhost:5175
echo Frontend: Check the Expo DevTools window
echo.
echo Close each window to stop the services.
pause

