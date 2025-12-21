@echo off
echo Checking if AI Service is running...
curl http://localhost:8000/health
echo.
echo.
echo If you see an error, start the AI service with: start-ai-service.bat
pause
