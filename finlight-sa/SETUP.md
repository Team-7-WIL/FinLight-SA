# FinLight SA - Setup Guide

## Prerequisites

### 1. Install Tesseract OCR

**Windows:**
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Install to default location: `C:\Program Files\Tesseract-OCR`
- Or set environment variable `TESSDATA_PREFIX` if installed elsewhere

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

### 2. Install Python 3.8+
- Download from: https://www.python.org/downloads/
- Ensure Python is in your PATH

### 3. Install .NET 8 SDK
- Download from: https://dotnet.microsoft.com/download
- Ensure dotnet is in your PATH

### 4. Install Node.js and npm
- Download from: https://nodejs.org/
- Ensure node and npm are in your PATH

## Installation Steps

### 1. Install AI Service Dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd mobile
npm install
```

### 3. Install Backend Dependencies

The .NET SDK will automatically restore packages when you run the backend.

## Running the Application

### Option 1: Run All Services at Once (Recommended)

**Windows:**
```cmd
run-all.bat
```

**PowerShell:**
```powershell
.\run-all.ps1
```

**Linux/macOS:**
```bash
chmod +x run-all.sh
./run-all.sh
```

### Option 2: Run Services Individually

#### 1. Start AI Service
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

#### 2. Start Backend API
```bash
cd backend/FinLightSA.API
dotnet run
```

#### 3. Start Frontend
```bash
cd mobile
npm start
```

## Service URLs

- **AI Service:** http://localhost:8000
- **Backend API:** http://localhost:5175
- **Frontend:** Opens in Expo DevTools (usually http://localhost:19006)

## Testing

### Test Receipt Upload
1. Navigate to Expenses screen
2. Click "Add Expense"
3. Click "Scan Receipt"
4. Take a photo or select an image
5. Verify OCR extraction works

### Test Bank Statement Upload
1. Navigate to Settings > Bank Statements
2. Click the + button
3. Select a CSV, Excel, or PDF file
4. Verify upload and processing works

### Test Invoice Download
1. Navigate to Invoices screen
2. Click PDF button on any invoice
3. Verify PDF downloads correctly

## Troubleshooting

### Tesseract Not Found
- Ensure Tesseract is installed and in PATH
- On Windows, the script will try common installation paths
- Check `ai-service/app/ocr.py` for path configuration

### OCR Not Working
- Verify Tesseract is installed: `tesseract --version`
- Check AI service logs for OCR errors
- Ensure image files are valid (JPG, PNG)

### Upload Errors
- Check backend logs for detailed error messages
- Verify file size limits (backend may have size restrictions)
- Ensure base64 encoding is correct (no data URI prefix)

### Translation Issues
- Clear app cache and restart
- Check that language is set in Settings
- Verify i18n files are loaded correctly

## Development Notes

- The AI service uses Tesseract OCR for receipt text extraction
- Bank statements are processed and transactions are created automatically
- All user-facing strings should use the translation system (`t()` function)
- Receipt uploads use base64 encoding sent as JSON
- Bank statement uploads use multipart/form-data

