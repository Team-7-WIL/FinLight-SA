# Quick Action: Bank Statement Upload - Debug Steps

## 🔍 What Was Done
✅ Enhanced logging added to track upload flow
✅ FormData debugging enabled  
✅ Error details improved with headers/URL info

## 🚀 Next: Test and Debug

### Step 1: Reproduce the Issue
1. Run the mobile app
2. Login with credentials
3. Navigate to Bank Statements
4. Click + button to upload
5. Select a test file (CSV or PDF)
6. **Watch the console** for logs

### Step 2: Look for These Logs
Open DevTools console and look for:
```
=== BANK STATEMENT UPLOAD STARTED ===
Document details: { uri: '...', name: 'test.csv', mimeType: 'text/csv', size: 1234 }
FormData ready, uploading to /bankstatements...
FormData object: FormData { ... }
```

### Step 3: Check Network Activity
1. Open DevTools → Network tab
2. Filter by XHR/Fetch
3. Perform upload
4. Look for POST request to `/api/bankstatements`

**Expected Response:**
- Status: **201** (success)
- Body: `{ "success": true, "data": { "id": "...", "fileName": "...", "status": "Uploaded" } }`

### Step 4: If No Network Request
Problem: Upload never reaches the network  
Solutions:
- Check browser console for JavaScript errors
- Verify FormData is being created (look for "FormData object" log)
- Check if file was actually selected

### Step 5: If Network Request But No Response
Problem: Request sent but backend didn't respond  
Solutions:
- Check backend terminal for logs
- Look for CORS errors
- Verify authorization token is being sent
- Check Network tab → Response for error message

### Step 6: If 400/401/500 Error
Check the error response:
```javascript
error.response?.data?.message // Shows backend error
error.response?.status        // Shows HTTP status code
error.config?.headers         // Shows what headers were sent
```

## 📝 Files Modified

**1. `/mobile/src/screens/BankStatementsScreen.js`**
- Added upload flow logging
- Enhanced error diagnostics

**2. `/mobile/src/config/api.js`**  
- Added FormData entry logging
- Shows what's being sent to backend

## 🔧 Possible Issues & Quick Fixes

| Error | What It Means | Fix |
|-------|---------------|-----|
| "No network request in DevTools" | Code error before upload | Check browser console for JS errors |
| "400 Bad Request" | Invalid file type | Use .csv or .pdf (not other formats) |
| "No file provided" | FormData is empty | Check if file.append worked |
| "401 Unauthorized" | Token missing/expired | Re-login |
| "Silent failure" | Error caught but not shown | Check console for error details |

## 📊 Debugging Checklist

- [ ] Can you select a file? (pickDocument called)
- [ ] Does console show "=== BANK STATEMENT UPLOAD STARTED ===" ? 
- [ ] Does FormData object log show file entry?
- [ ] Does Network tab show POST request?
- [ ] Is POST status 201 or error code?
- [ ] Does backend console show upload logs?
- [ ] Does success alert appear after upload?
- [ ] Does new statement appear in list?

## 📞 If Still Stuck

After going through the steps above, check:

1. **Is the backend running?** 
   - Terminal should show: "Now listening on: http://localhost:5175"

2. **Is the auth token valid?**
   - Backend logs should show "Executing endpoint" 
   - Not "Executing endpoint" means auth failed

3. **Are CORS headers correct?**
   - Network tab → Response Headers should include `Access-Control-Allow-Origin`

4. **Is the file valid?**
   - Try uploading a simple test.csv
   - Check file size isn't huge (>50MB might timeout)

## 🎯 Success Indicators

✅ You'll know it's working when:
1. ✅ Console shows no errors
2. ✅ Network shows POST 201 response
3. ✅ Success alert pops up
4. ✅ New file appears in Bank Statements list
5. ✅ Can click "Process" button to extract transactions
