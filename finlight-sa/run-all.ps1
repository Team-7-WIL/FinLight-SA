# PowerShell script to run all services
Write-Host "Starting FinLight SA Application..." -ForegroundColor Green

# Check if Python is available
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "Python not found. Please install Python 3.8+ and add it to PATH." -ForegroundColor Red
    exit 1
}

# Check if .NET SDK is available
$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetCmd) {
    Write-Host ".NET SDK not found. Please install .NET 8 SDK and add it to PATH." -ForegroundColor Red
    exit 1
}

# Start AI Service
Write-Host "`n[1/3] Starting AI Service (Python FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; python -m uvicorn main:app --reload --port 8000" -WindowStyle Normal

# Wait a bit for AI service to start
Start-Sleep -Seconds 3

# Start Backend API
Write-Host "`n[2/3] Starting Backend API (.NET)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/FinLightSA.API; dotnet run" -WindowStyle Normal

# Wait a bit for backend to start
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "`n[3/3] Starting Frontend (React Native/Expo)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd mobile; npm start" -WindowStyle Normal

Write-Host "`nAll services starting..." -ForegroundColor Green
Write-Host "AI Service: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5175" -ForegroundColor Cyan
Write-Host "Frontend: Check the Expo DevTools window" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in each window to stop the services." -ForegroundColor Yellow

