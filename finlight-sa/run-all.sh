#!/bin/bash
# Bash script to run all services

echo "Starting FinLight SA Application..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Python 3 not found. Please install Python 3.8+ and add it to PATH."
    exit 1
fi

# Check if .NET SDK is available
if ! command -v dotnet &> /dev/null; then
    echo ".NET SDK not found. Please install .NET 8 SDK and add it to PATH."
    exit 1
fi

# Start AI Service
echo ""
echo "[1/3] Starting AI Service (Python FastAPI)..."
cd ai-service
python3 -m uvicorn main:app --reload --port 8000 &
AI_PID=$!
cd ..

# Wait a bit for AI service to start
sleep 3

# Start Backend API
echo ""
echo "[2/3] Starting Backend API (.NET)..."
cd backend/FinLightSA.API
dotnet run &
BACKEND_PID=$!
cd ../..

# Wait a bit for backend to start
sleep 5

# Start Frontend
echo ""
echo "[3/3] Starting Frontend (React Native/Expo)..."
cd mobile
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "All services starting..."
echo "AI Service: http://localhost:8000"
echo "Backend API: http://localhost:5175"
echo "Frontend: Check the Expo DevTools window"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait for user interrupt
trap "kill $AI_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

