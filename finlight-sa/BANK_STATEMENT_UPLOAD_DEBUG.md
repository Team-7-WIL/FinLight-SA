# Bank Statement Upload Debugging Guide

## Issues Identified & Fixed

### 1. Enhanced Logging Added
- Added comprehensive logging to `BankStatementsScreen.js` to track upload flow
- Added FormData validation logging in `api.js` interceptor
- Error details now include headers and URL for better debugging

### 2. Key Code Points

**Frontend Upload Flow:**
```
pickDocument() 
  → DocumentPicker.getDocumentAsync() 
  → uploadBankStatement(document)
  → FormData creation
  → apiClient.post('/bankstatements', formData)
  → api.js interceptor removes Content-Type header
  → Backend receives multipart/form-data
```

**Backend Expected:**
```
POST /api/bankstatements
Content-Type: multipart/form-data; boundary=...
Authorization: Bearer {token}
Body: form-data with 'file' field
```

## How to Debug Bank Statement Upload Issues

### Step 1: Check Console Logs
When you try to upload, look for these console logs:

```
=== BANK STATEMENT UPLOAD STARTED ===
Starting bank statement upload...
Document details: { uri, name, mimeType, size }
FormData ready, uploading to /bankstatements...
FormData object: FormData { ... }
FormData detected - removing Content-Type header...
FormData entries: [['file', File]]
Making POST request to /bankstatements
Bank statement upload response status: 201
```

### Step 2: Check Network Tab
- Open DevTools (F12)
- Go to Network tab
- Try uploading a file
- Look for the POST request to `/api/bankstatements`

**What to check:**
- Is the request being sent? (Should see it in Network tab)
- Request Headers: Should have `Authorization: Bearer {token}`
- Request Headers: Should NOT have explicit `Content-Type: multipart/form-data` (axios sets it with boundary)
- Response Status: Should be 201 (CreatedAtAction)
- Response Body: Should show success: true

### Step 3: Backend Logs
Check the backend console logs in the terminal running `dotnet run`:

```
[HH:MM:SS INF] Request starting HTTP/1.1 POST http://localhost:5175/api/bankstatements
[HH:MM:SS INF] CORS policy execution successful
[HH:MM:SS INF] Executing endpoint 'FinLightSA.API.Controllers.BankStatementsController.UploadBankStatement'
```

### Step 4: If Upload Still Fails

**Check these scenarios:**

**A. No Network Request at All**
- Issue: JavaScript error preventing upload
- Solution: Look at console errors, check if formData is created
- Fix: Add try-catch, ensure file has valid URI

**B. 400 Bad Request**
- Issue: File validation failed (wrong file type, no file, etc.)
- Solution: Check response.data.message in error handler
- Allowed types: .csv, .xlsx, .xls, .pdf

**C. 401 Unauthorized**
- Issue: Token missing or invalid
- Solution: Check if token is in AsyncStorage after login
- Fix: Re-login

**D. 500 Server Error**
- Issue: Backend exception
- Solution: Check backend console logs
- Add try-catch blocks and log database errors

## File Changes Made

### `/mobile/src/screens/BankStatementsScreen.js`
- ✅ Added `console.log('=== BANK STATEMENT UPLOAD STARTED ===')` at start
- ✅ Added `console.log('FormData object:', formData)` to see FormData content
- ✅ Enhanced error logging with headers and URL info

### `/mobile/src/config/api.js`
- ✅ Added `console.log('FormData entries:', Array.from(config.data.entries()))` to log FormData fields

## Testing the Upload

### Quick Test:
1. Open app and login
2. Navigate to Bank Statements
3. Click the + button
4. Select a small CSV or PDF file
5. Watch console for logs
6. Check Network tab for request
7. Verify success alert appears

### Sample CSV for Testing:
```csv
Date,Description,Amount,Category
2024-12-16,Test Transaction,100.00,Supplies
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "No file selected" | Document URI is null | Ensure file picker returns valid result |
| "Invalid file type" | Extension not in allowed list | Use .csv, .xlsx, .xls, or .pdf |
| "No file provided" | FormData not including file | Check formData.append('file', ...) |
| Nothing happens | Missing console logs | Check if JS error occurs before upload |
| 401 Unauthorized | Token expired or missing | Re-login and check AsyncStorage |
| Silent failure | Error not shown to user | Check error response in console |

## Next Steps if Still Broken

1. **Verify FormData is created:**
   ```javascript
   const formData = new FormData();
   formData.append('file', fileObject);
   console.log(formData); // Should show FormData with file entry
   ```

2. **Test with curl from backend terminal:**
   ```bash
   curl -X POST http://localhost:5175/api/bankstatements \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@/path/to/test.csv"
   ```

3. **Enable backend verbose logging:**
   In appsettings.Development.json, set log level to Debug

4. **Test file upload in Postman:**
   - Set up POST to http://localhost:5175/api/bankstatements
   - Add Authorization header
   - Set Body to form-data with 'file' field
   - Select a file
   - Send

## Success Indicators

✅ Upload working when:
- Console shows all logs without errors
- Network tab shows POST request with 201 response
- Success alert appears
- New bank statement appears in list
- Backend logs show "Bank statement uploaded successfully"
