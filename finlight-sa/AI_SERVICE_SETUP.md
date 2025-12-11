# AI Service Setup Guide

The AI service provides OCR (Optical Character Recognition) and transaction categorization features. It must be running for receipt scanning and AI categorization to work.

## Prerequisites

1. **Python 3.8+** installed
2. **Tesseract OCR** installed (for OCR functionality)
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
   - The installer will add Tesseract to your PATH
   - Or install to `C:\Program Files\Tesseract-OCR\tesseract.exe`

## Installation

1. Navigate to the `ai-service` directory:
   ```bash
   cd ai-service
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Starting the AI Service

### Option 1: Using the batch file (Windows)
```bash
start-ai-service.bat
```

### Option 2: Manual start
```bash
cd ai-service
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will start on `http://localhost:8000`

## Verifying the Service is Running

### Option 1: Using the batch file
```bash
check-ai-service.bat
```

### Option 2: Manual check
Open your browser and navigate to:
- Health check: http://localhost:8000/health
- Root endpoint: http://localhost:8000/

You should see:
```json
{
  "status": "healthy",
  "categorizer_loaded": true,
  "ocr_available": true
}
```

**Note**: `ocr_available` will be `false` if Tesseract is not installed or not found.

## Troubleshooting

### Issue: "AI service is not available" error

**Solution**: Make sure the AI service is running on port 8000.

1. Check if the service is running:
   ```bash
   check-ai-service.bat
   ```

2. If not running, start it:
   ```bash
   start-ai-service.bat
   ```

3. Check the console output for any errors

### Issue: OCR not working / "Tesseract not found"

**Solution**: Install Tesseract OCR

1. Download Tesseract for Windows from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install it (default location: `C:\Program Files\Tesseract-OCR\`)
3. Restart the AI service
4. The service will automatically detect Tesseract

If Tesseract is installed in a non-standard location, the service will try to find it automatically. If it still doesn't work, you may need to add Tesseract to your system PATH.

### Issue: Receipt scanning returns "Unknown Vendor" or empty data

**Possible causes**:
1. AI service is not running - start it with `start-ai-service.bat`
2. Tesseract OCR is not installed - install it (see above)
3. Image quality is too poor - try a clearer image
4. Receipt format is not recognized - the OCR parser may need adjustment

**Check logs**:
- Backend logs: Check `logs/finlight-*.txt` in the backend directory
- AI service logs: Check the console output where you started the AI service

### Issue: Bank statement upload doesn't work

**Check**:
1. Is the backend API running? (should be on port 5000 or 5001)
2. Check browser console for errors (F12)
3. Check backend logs for errors
4. Make sure you're logged in (authentication token is valid)

### Issue: AI categorization not working

**Solution**: 
1. Make sure the AI service is running
2. The categorization model trains automatically as you provide feedback
3. Check the AI service logs for errors

## Configuration

The AI service URL can be configured via environment variable:

```bash
# Windows (PowerShell)
$env:AI_SERVICE_URL="http://localhost:8000"

# Or set in backend appsettings.json:
{
  "AIService": {
    "BaseUrl": "http://localhost:8000"
  }
}
```

## API Endpoints

The AI service provides these endpoints:

- `GET /` - Service info
- `GET /health` - Health check
- `POST /process-document` - Process receipt/invoice image (base64)
- `POST /categorize` - Categorize a single transaction
- `POST /categorize/batch` - Categorize multiple transactions
- `POST /feedback` - Submit feedback to improve model
- `POST /train` - Retrain the categorization model

## Development

To run in development mode with auto-reload:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Next Steps

1. Start the AI service: `start-ai-service.bat`
2. Start the backend API
3. Start the mobile app
4. Try scanning a receipt - it should now work!
