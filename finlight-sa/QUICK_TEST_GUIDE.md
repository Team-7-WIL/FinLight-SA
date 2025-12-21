# Quick Test Instructions

## Enable Console First
- **Web:** Press `F12` → Console tab
- **Mobile:** Shake device → "Debug remote JS" → Console tab in Chrome

---

## Test 1: Product Selection

**Steps:**
1. Open Create Invoice screen
2. Add at least one item to the invoice
3. Click "Select Product" button
4. **Look in console for:** `getProductsByCategory - products: [...]`

**What you should see:**
- List of products and categories
- Products mapped to categories
- "Product X -> category Y" lines

**If you see:**
- ✅ Products listed → Working correctly
- ❌ Empty or "No products to categorize" → Products not loading

**Share this console output with me**

---

## Test 2: Template Saving

**Steps:**
1. Create invoice with 1+ items
2. Click "Save Template" button
3. Enter a template name (e.g., "Test")
4. Click save
5. **Look in console for:** `Saving template with data:`

**What you should see:**
- Template data being sent
- Response with status `201` (success) or error code
- Either success message or error details

**If you see:**
- ✅ Status 201 + success message → Template saved!
- ❌ Status 400 → Validation error (check message)
- ❌ Status 401 → Not authenticated
- ❌ Status 500 → Server error

**Share the full response with me**

---

## Test 3: Bank Statement Upload

**Steps:**
1. Go to Bank Statements screen
2. Click Upload button
3. Select a CSV or Excel file
4. **Look in console for:**
   - `Document details: {...}`
   - `Auth interceptor - token exists: true`
   - `Bank statement upload response:`

**What you should see:**
- Document details with file name/size
- Auth token confirmation
- Either success or error response

**If you see:**
- ✅ `success: true` → Upload worked!
- ❌ `Auth interceptor - token exists: false` → Need to login
- ❌ Error response → File format issue or server error

**Share the complete console log with me**

---

## All Tests Failed? Try This:

1. **Refresh the app completely**
2. **Re-login if needed**
3. **Clear browser cache** (Ctrl+Shift+Delete)
4. **Check backend is running** (should see logs in terminal)

---

## Copy-Paste Template

When reporting issues, share this info:

```
**Issue:** [Product Selection / Template Saving / Bank Upload]

**Steps to reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected result:**
[What should happen]

**Actual result:**
[What happened instead]

**Console logs:**
[Paste console output here]

**Screenshots:**
[If possible]
```

---

## Important Files for Reference

- 📄 `DEBUGGING_GUIDE.md` - Detailed troubleshooting guide
- 📄 `SESSION_4_DEBUG_CHANGES.md` - What was changed
- 📄 `ACTION_GUIDE.md` - General action items
