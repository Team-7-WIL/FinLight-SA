# Bank Statement Upload - Complete Testing & Troubleshooting Guide

## What Was Fixed

**Comprehensive Logging Added** to trace every step of the upload process:
- ✅ Document picker open/close tracking
- ✅ FormData creation verification
- ✅ API POST request logging
- ✅ Response handling with status codes
- ✅ Detailed error information
- ✅ Clear success/failure indicators

## Expected Console Output (Successful Upload)

### Step 1: User Clicks Upload Button
```
📁 Document picker opened...
```

### Step 2: User Selects File
```
📁 Document picker result type: success
📁 Document picker result: {
  type: 'success',
  uri: 'file://...',
  name: 'statement.pdf',
  mimeType: 'application/pdf',
  size: 45000
}
✅ Document selected successfully, starting upload...
```

### Step 3: Upload Function Starts
```
🚀 ===== UPLOAD START =====
Time: 2025-12-16T22:45:30.123Z
=== BANK STATEMENT UPLOAD STARTED ===
Starting bank statement upload...
Document details: {
  uri: 'file://...',
  name: 'statement.pdf',
  mimeType: 'application/pdf',
  size: 45000
}
```

### Step 4: FormData Creation
```
✅ Native FormData created
📦 File details: {
  uri: 'file://...',
  name: 'statement.pdf',
  type: 'application/pdf',
  mimeType: 'application/pdf'
}
```

### Step 5: API Request Sent
```
FormData ready, uploading to /bankstatements...
Making POST request to /bankstatements
FormData object: FormData {...}
📤 Sending POST request to: /bankstatements
⏱️ Request timestamp: 2025-12-16T22:45:31.456Z
FormData detected - removing Content-Type header to allow axios to set boundary
FormData entries: [['file', File]]
Authorization header set
```

### Step 6: Response Received
```
📥 Response received
Bank statement upload response status: 201
Bank statement upload response data: {
  success: true,
  message: 'Bank statement uploaded successfully',
  data: {
    id: 'd4b2343b-57de-4b45-a182-f1d9-57c7ade5',
    fileName: 'statement.pdf',
    uploadDate: '2025-12-16T22:45:31.789Z',
    status: 'Uploaded',
    transactionCount: 0
  }
}
✅ Upload successful, bank statement ID: d4b2343b-57de-4b45-a182-f1d9-57c7ade5
📊 Response data: {...}
🔄 Processing bank statement...
✅ Bank statement processed successfully: {...}
```

### Step 7: Upload Complete
```
🏁 Upload process ended
⏱️ End timestamp: 2025-12-16T22:45:32.234Z
🚀 ===== UPLOAD END =====
```

---

## Testing Steps

### 1. Open Browser DevTools
```
Windows/Linux: Press F12
Mac: Cmd + Option + I
```

### 2. Go to Console Tab
- Click on "Console" in DevTools
- Clear existing logs (Ctrl+L)
- Watch for the upload logs

### 3. Test the Upload
1. Navigate to Bank Statements in the app
2. Click the **+** button (upload button)
3. A file picker should open
4. Select a test file (PDF or CSV)
5. **Watch the Console** - you should see the logs above

### 4. Check Network Tab
1. Click "Network" tab in DevTools
2. Filter by "XHR" or "Fetch"
3. **Look for POST request to `/api/bankstatements`**
4. Click on it to see:
   - **Request Headers** - should have `Authorization: Bearer ...`
   - **Request Body** - should be FormData with file
   - **Response** - should show 201 status and success: true

---

## Troubleshooting

### Scenario 1: Document Picker Cancels
**Console Shows:**
```
📁 Document picker opened...
📁 Document picker result type: cancel
❌ Document picker cancelled by user
```
**What it means:** User closed the picker without selecting a file  
**Solution:** Select a file and try again

---

### Scenario 2: File Selected But Upload Never Starts
**Console Shows:**
```
📁 Document picker opened...
📁 Document picker result type: success
📁 Document picker result: {...}
✅ Document selected successfully, starting upload...
[NOTHING ELSE APPEARS]
```
**What it means:** Upload function is not being called  
**Solution:** Check if there's a JS error, refresh app and try again

---

### Scenario 3: Upload Starts But No Network Request
**Console Shows:**
```
🚀 ===== UPLOAD START =====
Time: ...
=== BANK STATEMENT UPLOAD STARTED ===
...
Document details: {...}
✅ Native FormData created
📦 File details: {...}
[BUT NO "📤 Sending POST request" LOG]
```
**What it means:** FormData creation succeeded but API call failed silently  
**Solution:** Check Network tab for failed requests, look for error in console

---

### Scenario 4: Network Request Sends But No Response
**Console Shows:**
```
📤 Sending POST request to: /bankstatements
⏱️ Request timestamp: ...
[THEN NOTHING FOR 30+ SECONDS]
```
**Network Tab Shows:**
- Request is "Pending" or no response received

**What it means:** Backend didn't respond  
**Solutions:**
1. Check backend terminal - is it running? Look for `Now listening on: http://localhost:5175`
2. Check Network tab - what's the response status?
3. Try refreshing the app

---

### Scenario 5: 400 Bad Request Error
**Console Shows:**
```
❌ Error uploading bank statement: Request failed with status code 400
Full error details: {
  message: "Request failed with status code 400",
  response: {
    data: {
      success: false,
      message: "Invalid file type. Only CSV, Excel, and PDF files are allowed."
    },
    status: 400
  }
}
```
**What it means:** File type is not supported  
**Solutions:**
- Only use: `.pdf`, `.csv`, `.xlsx`, `.xls`
- Don't use: `.doc`, `.txt`, `.png`, `.jpg`

---

### Scenario 6: 401 Unauthorized Error
**Console Shows:**
```
❌ Error uploading bank statement: Request failed with status code 401
Full error details: {
  status: 401,
  response: { message: "Unauthorized" }
}
```
**What it means:** Token missing or expired  
**Solutions:**
1. Close app and re-login
2. Check Network tab - does GET /bankstatements have Authorization header?
3. Try refreshing app

---

### Scenario 7: 500 Server Error
**Console Shows:**
```
❌ Error uploading bank statement: Request failed with status code 500
Full error details: {
  status: 500,
  response: {
    success: false,
    message: "Error uploading bank statement",
    errors: ["Database connection failed"]
  }
}
```
**What it means:** Backend error occurred  
**Solutions:**
1. Check backend terminal for error messages
2. Verify database file exists at: `backend/FinLightSA.API/finlight-local.db`
3. Restart backend: `dotnet run` in `backend/FinLightSA.API` folder

---

### Scenario 8: Silent Failure (No Error Alert)
**Console Shows:**
```
🚀 ===== UPLOAD START =====
...
🏁 Upload process ended
🚀 ===== UPLOAD END =====
[BUT NO SUCCESS OR ERROR MESSAGE]
```
**What it means:** Error occurred but wasn't caught properly  
**Solutions:**
1. Scroll up in console to find error message
2. Check "Errors" tab in DevTools (⚠️ icon)
3. Try uploading again and capture all console output

---

## What to Share if Still Broken

When the upload fails, please share:

1. **Complete Console Output**
   - From `🚀 ===== UPLOAD START =====` to `🚀 ===== UPLOAD END =====`
   - Copy the entire text

2. **Network Tab Info**
   - Request URL
   - Request Method
   - Response Status
   - Response Body (click "Response" tab)

3. **Backend Terminal Output**
   - Any error messages from the terminal where `dotnet run` is executing

4. **Test File Details**
   - File name and size
   - File type (PDF, CSV, etc.)
   - Any special characters in filename

---

## Quick Checklist

- [ ] Is the backend running? (terminal shows "Now listening on")
- [ ] Are you logged in? (check if token exists in Network → Request Headers)
- [ ] Did you select a file? (console should show ✅ Document selected)
- [ ] Is the file type correct? (.pdf, .csv, .xlsx, .xls only)
- [ ] Can you see the POST request in Network tab?
- [ ] What's the response status? (201 = success, 400/401/500 = error)
- [ ] Are there console errors? (check Console tab for red error messages)

---

## Success Indicators ✅

You'll know it's working when you see:

1. ✅ Console shows `✅ Upload successful`
2. ✅ Network tab shows POST with status `201`
3. ✅ Success alert pops up saying "Bank statement uploaded successfully"
4. ✅ New file appears in Bank Statements list
5. ✅ Can click "Process" button to extract transactions

---

## Quick Test Command (Backend)

Test upload directly from terminal to verify backend works:

```bash
# Get a valid token first (login in app)
# Then use curl to test upload

curl -X POST http://localhost:5175/api/bankstatements \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/test.csv"

# Expected response:
# {
#   "success": true,
#   "message": "Bank statement uploaded successfully",
#   "data": { "id": "...", "fileName": "test.csv", ... }
# }
```

---

## Still Need Help?

The enhanced logging now shows:
1. ✅ Exact point where process stops
2. ✅ All error details with status codes
3. ✅ Request/response information
4. ✅ Timestamps for tracking
5. ✅ File information validation

Share the complete console output from `🚀 ===== UPLOAD START =====` to `🚀 ===== UPLOAD END =====` and we can pinpoint the exact issue!
