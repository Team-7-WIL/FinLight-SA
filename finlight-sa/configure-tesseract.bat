@REM Check and configure Tesseract for Windows
@REM This script helps configure Tesseract OCR if auto-detection fails

@echo off
setlocal enabledelayedexpansion

title Tesseract Configuration Helper

echo.
echo ================================================
echo   Tesseract OCR Configuration Helper
echo ================================================
echo.

REM Check if Tesseract is in PATH
echo Checking for Tesseract in system PATH...
tesseract --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Tesseract not found in PATH
    echo.
    echo Searching for Tesseract installations...
    
    REM Check common Windows installation paths
    set "found=0"
    
    if exist "C:\Program Files\Tesseract-OCR\tesseract.exe" (
        echo ✓ Found at: C:\Program Files\Tesseract-OCR\tesseract.exe
        set "TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe"
        set "found=1"
    )
    
    if exist "C:\Program Files (x86)\Tesseract-OCR\tesseract.exe" (
        echo ✓ Found at: C:\Program Files ^(x86^)\Tesseract-OCR\tesseract.exe
        set "TESSERACT_PATH=C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
        set "found=1"
    )
    
    if exist "C:\ProgramData\chocolatey\lib\tesseract\tools\tesseract.exe" (
        echo ✓ Found at: C:\ProgramData\chocolatey\lib\tesseract\tools\tesseract.exe
        set "TESSERACT_PATH=C:\ProgramData\chocolatey\lib\tesseract\tools\tesseract.exe"
        set "found=1"
    )
    
    if !found! equ 0 (
        echo.
        echo ✗ Tesseract not found in common locations
        echo.
        echo Installation locations checked:
        echo   - C:\Program Files\Tesseract-OCR\tesseract.exe
        echo   - C:\Program Files ^(x86^)\Tesseract-OCR\tesseract.exe
        echo   - C:\ProgramData\chocolatey\lib\tesseract\tools\tesseract.exe
        echo.
        echo To fix this:
        echo.
        echo 1. Download Tesseract from:
        echo    https://github.com/tesseract-ocr/tesseract/wiki/Downloads
        echo.
        echo 2. Run the installer and install to default location:
        echo    C:\Program Files\Tesseract-OCR
        echo.
        echo 3. Run this script again
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo Setting TESSERACT_PATH for this session...
    set "TESSERACT_PATH=!TESSERACT_PATH!"
    setx TESSERACT_PATH "!TESSERACT_PATH!" >nul 2>&1
    
    if errorlevel 1 (
        echo ⚠ Could not set permanent environment variable
        echo   (Requires administrator privileges)
        echo.
        echo Temporary configuration for this session:
        echo set TESSERACT_PATH=!TESSERACT_PATH!
    ) else (
        echo ✓ TESSERACT_PATH set permanently to:
        echo   !TESSERACT_PATH!
    )
) else (
    echo ✓ Tesseract is available in PATH
    for /f "tokens=*" %%i in ('tesseract --version') do (
        echo   %%i
    )
)

echo.
echo ================================================
echo   Starting AI Service with Tesseract...
echo ================================================
echo.

cd ai-service 2>nul
if errorlevel 1 (
    echo ✗ Could not navigate to ai-service directory
    pause
    exit /b 1
)

echo Installing Python dependencies...
pip install -r requirements.txt --quiet >nul 2>&1

if errorlevel 1 (
    echo ⚠ Could not install dependencies silently
    pip install -r requirements.txt
)

echo.
echo Starting AI service on port 8000...
echo Press Ctrl+C to stop the service
echo.

python -m uvicorn main:app --reload --port 8000

pause
