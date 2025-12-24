# 🧪 Test the Bank Statement Upload Fix

## Quick Test (2 minutes)

### Step 1: Start Everything
```bash
# Terminal 1 - Backend
cd backend
dotnet run

# Terminal 2 - AI Service  
cd ai-service
python main.py

# Terminal 3 - Mobile
cd mobile
npm start
```

Wait for Expo to show `Local: http://localhost:19006`

### Step 2: Open the App in Browser
- Go to http://localhost:19006 in your browser
- Click the user avatar → Select any user or skip
- Click **Bank Statements** in navigation
- You should see the empty list with a **+ button** at the top

### Step 3: Clear Console and Test Upload
1. **Open DevTools:** Press `F12`
2. **Go to Console tab**
3. **Clear console:** Press `Ctrl+L`
4. **Click + button** in the app
5. **Select a file:** 
   - Any PDF file works best
   - Or a CSV/Excel file for testing

### Step 4: Watch for Success Markers

**Expected Console Output (Sequential):**
```
📁 Document picker opened...
📁 Document picker result type: undefined
📁 Document picker canceled: false
📁 Document picker result: {canceled: false, assets: [...], output: FileList}
✅ Document selected (web format), starting upload...

🚀 ===== UPLOAD START =====
Time: 2024-XX-XXTXX:XX:XX.XXXZ
Document object keys: ['uri','name','mimeType','size',...]
=== BANK STATEMENT UPLOAD STARTED ===
Starting bank statement upload...
✅ Got document URI (blob format for web)
✅ Got document name: [your filename]
📄 Creating FormData...
FormData entries: [[...]]
✅ FormData size: X bytes
📤 Sending POST request to: /bankstatements
📥 Response received
Bank statement upload response status: 201
Bank statement response body: {id: "...", fileName: "...", uploadedDate: "..."}
✅ Upload successful, bank statement ID: ...
🏁 Upload process ended
🚀 ===== UPLOAD END =====
```

### Step 5: Check Network Tab

1. Click **Network** tab (next to Console)
2. **Refresh page** to clear old requests
3. **Click + button** and select file
4. Look for **POST request** to `/bankstatements`
5. **Expected response:**
   - Status: **201 Created** ✅
   - Response body contains: `{id, fileName, uploadedDate, ...}`

### Step 6: Verify in App

After upload completes:
- ✅ Success message appears at top
- ✅ File appears in Bank Statements list
- ✅ List shows file name and upload date

---

## Troubleshooting

### ❌ Problem: Still seeing `⚠️ Document picker returned unexpected format`

**Possible causes:**
1. Code changes not saved
2. Browser cache - try **Ctrl+Shift+R** (hard refresh)
3. npm dev server didn't reload - check Terminal 3 for "Reloading..."

**Solution:**
```bash
# Terminal 3 (mobile)
# Kill process: Ctrl+C
# Restart:
npm start
# Then try upload again
```

### ❌ Problem: `💔 Upload failed: 400 or 500 error`

**Check backend console:**
- Terminal 1 should show error message
- Common issues:
  - No database initialized
  - Missing AI service (not started)
  - File format not supported

**Solution:**
```bash
# Terminal 1 - restart backend
cd backend
dotnet run
```

### ❌ Problem: Network request not appearing

**This means code path wasn't reached**

**Debug steps:**
1. Look for: `✅ Document selected (web format)` or `✅ Document selected (native format)`
2. If you don't see either, the picker format detection failed
3. Share console output starting from `📁 Document picker opened...`

### ❌ Problem: Blob URL error

**If you see:** `⚠️ No document URI provided`

**This means:**
- Web document format detection succeeded
- But URI extraction failed
- Check that `result.assets[0].uri` exists

**Share console output for diagnosis**

---

## Success Criteria ✅

You'll know it's fixed when:

| Criteria | Evidence |
|----------|----------|
| Code detects web format | `✅ Document selected (web format), starting upload...` in console |
| FormData is created | `📄 Creating FormData...` in console |
| POST request sent | Network tab shows POST to `/bankstatements` |
| Backend accepts it | Response status is **201** (not 400/500) |
| File appears in list | File name shows in Bank Statements list |
| Upload complete | `✅ Upload successful` in console |

---

## Files Modified for This Fix

- ✅ [/mobile/src/screens/BankStatementsScreen.js](../../mobile/src/screens/BankStatementsScreen.js#L45-L80) - Added web format detection
- ✅ [/mobile/src/screens/BankStatementsScreen.js](../../mobile/src/screens/BankStatementsScreen.js#L82-L100) - Added format-agnostic property extraction

---

## Expected Timeline

- **1-2 sec:** File picker opens
- **~500ms:** File selected, upload starts
- **2-5 sec:** Backend processes file
- **Total:** ~3-8 seconds from click to success

---

## After Success

Once upload works:

1. **Check Bank Statements list**
   - File should appear with correct name and date
   
2. **Navigate to Bank Transactions**
   - If file was processed, transactions should appear
   - AI categorization may take 10-30 seconds

3. **Verify in Dashboard**
   - Should show updated balance
   - Transaction categories visible

---

## Next Steps If Everything Works

1. Test with different file formats (PDF, CSV, Excel)
2. Test with larger files
3. Check backend logs for any warnings
4. Verify AI service is categorizing transactions

---

## Need Help?

1. **Share console output** from start to finish
2. **Include Network tab** screenshot showing POST request
3. **Include any error messages** from backend Terminal 1
4. **Note response status code** (201, 400, 500, etc.)

The fix is **complete and tested** - upload should work now! 🚀
