# Debugging Guide for Issues

I've added comprehensive logging to help identify the exact problems. Here's what to do:

## 1. Product Selection Not Working (Even with Products in Database)

**Updated Code:** Enhanced `getProductsByCategory()` with console logging

**How to Test:**
1. Go to Create Invoice screen
2. Click "Select Product" button for any item
3. Open browser developer console (F12 or right-click → Inspect)
4. Look for logs like:
   - `getProductsByCategory - products: [...]`
   - `getProductsByCategory - categories: [...]`
   - `Product X -> category Y`
   - `Categorized products: {...}`

**If you see "No products to categorize":**
- Products might not be loading
- Check: `Products loaded: [...]` in console
- If nothing shows, products API call failed

**If products show but aren't grouped:**
- Check category names match
- Verify `product.productCategoryId` is set
- Check if `categories` array is populated

**Share these console logs and I'll pinpoint the issue!**

---

## 2. Template Saving Not Working

**Updated Code:** Added detailed logging to `saveTemplate()`

**How to Test:**
1. Create an invoice with at least ONE item
2. Click "Save Template"
3. Enter template name (e.g., "Test Template")
4. Open browser console (F12)
5. Look for:
   - `Saving template with data: {...}`
   - `Template save response status: 201` (success) or `400`/`500` (error)
   - `Template save response data: {...}`

**Possible Responses:**
- ✅ Status 201: Success! Template saved
- ❌ Status 400: Validation error (check the error message)
- ❌ Status 401: Not authenticated (token issue)
- ❌ Status 500: Server error

**What the response should look like:**
```json
{
  "success": true,
  "message": "Invoice template created successfully",
  "data": {
    "id": "guid...",
    "name": "Test Template",
    "templateData": "{...}",
    "createdAt": "2025-12-16..."
  }
}
```

**Share the console output and I'll fix it!**

---

## 3. Bank Statement Upload Not Working

**Updated Code:** 
- Added FormData logging in `BankStatementsScreen.js`
- Added auth interceptor logging in `api.js`

**How to Test:**
1. Go to Bank Statements screen
2. Click "Upload Statement"
3. Select a CSV or Excel file
4. Open browser console (F12)
5. Look for:
   - `Document details: {...}`
   - `Web FormData created with blob` (or `Native FormData created with uri-based file`)
   - `FormData ready, uploading to /bankstatements...`
   - `Auth interceptor - token exists: true`
   - `FormData detected - removing Content-Type header...`
   - `Bank statement upload response: {...}`

**Possible Issues:**

❌ **Token not present:**
```
Auth interceptor - token exists: false
```
→ Not authenticated, need to login first

❌ **Upload fails with 401:**
```
API Error: 401 Unauthorized
```
→ Token expired or invalid

❌ **Upload fails with 400:**
```
API Error: 400 Bad Request
{message: "Invalid file type..."}
```
→ File format not supported (use .csv, .xlsx, .xls, .pdf)

❌ **Upload succeeds but processing fails:**
```
Bank statement upload response: {success: true}
...
Error auto-processing bank statement
```
→ Upload worked, but processing endpoint failed

✅ **Success:**
```
Bank statement upload response: {
  success: true,
  message: "Bank statement uploaded successfully",
  data: {id: "...", fileName: "..."}
}
```

**Share the console output!**

---

## 4. OCR Receipt Scanning

**Status:** Already fixed ✅

**To verify it's working:**
1. Take a receipt photo with clear `TOTAL $27.96` and `GST $2.54`
2. Upload for OCR processing
3. Check if amounts are extracted correctly (not 0.0)
4. Check backend logs for no exceptions

---

## How to Enable Console Logging

### Web (React Native Web):
1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. Look for logs as you interact with the app

### Mobile (Expo):
1. Open Expo app
2. Open developer menu: Shake device or press `Ctrl+M` (Android)
3. Select "Debug remote JS"
4. Chrome DevTools will open automatically
5. Go to "Console" tab

---

## Quick Action: Try These First

1. **Products not showing:**
   ```
   - Open console
   - Go to Create Invoice
   - Click Select Product
   - Look for "getProductsByCategory - products: [...]"
   - Share screenshot
   ```

2. **Template not saving:**
   ```
   - Open console
   - Add an invoice item
   - Click Save Template
   - Name it and save
   - Look for response status in console
   - Share screenshot
   ```

3. **Bank statement upload stuck:**
   ```
   - Open console  
   - Try uploading a CSV file
   - Look for response after "FormData ready, uploading..."
   - Share screenshot of any errors
   ```

---

## What I Need From You

Please share screenshots or text of:
1. The console output when the issue occurs
2. What you see in the browser/app after clicking
3. Any error messages displayed to you

This will help me fix it in the next session!
