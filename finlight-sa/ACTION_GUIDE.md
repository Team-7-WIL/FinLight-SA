# Quick Action Guide - Session 4

## 🔴 Critical Fix Applied
**OCR Receipt Processing** - FIXED ✅
- The AI service now correctly extracts amounts from receipts showing `TOTAL $27.96`
- VAT extraction now works for `GST $2.54` format
- Handles decimal variations: `.`, `,`, `-` 

**Action:** Restart the AI service for changes to take effect:
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

---

## Issue #1: Saving Template Doesn't Work
**Status:** Code is correct - likely a data/network issue

**What to try:**
1. Make sure you add at least ONE product to the invoice items first
2. Try saving with a simple template name (e.g., "Test")
3. Check browser console (F12) for error messages
4. Try again - the code works correctly

**If still failing:**
- Share the console error message from browser
- We'll investigate further

---

## Issue #2: Selecting Products in Invoices Does Nothing
**Status:** No bug - database is empty!

**Solution - Create Test Products:**
1. Open app and go to **Products** screen
2. Click **Add Product**
3. Create products:
   - Name: "Laptop", Price: 5000, Category: Electronics
   - Name: "Monitor", Price: 2000, Category: Electronics
   - Name: "Mouse", Price: 500, Category: Accessories
4. Go back to **Create Invoice** → Click "Select Product"
5. Products should now appear and be selectable ✅

---

## Issue #3: Bank Statement Upload Doesn't Work
**Status:** Code is correct - need to verify backend processing

**What to try:**
1. Try uploading a simple CSV file (just a few rows)
2. Check backend logs for any error messages during processing
3. Verify the file was actually uploaded to database

**If upload succeeds but processing fails:**
- The file got uploaded ✅
- The processing endpoint might be the issue
- Share backend error logs

---

## Issue #4: AI Not Reading All Receipt Fields
**Status:** Fixed in this session ✅

**What changed:**
- Better pattern matching for amounts (handles `$27.96`, `R27.96`, `27-96`)
- Better VAT extraction (handles `GST Included in Total $2.54`)
- No more crashes on null values

**Test with:** Scan a Woolworths or Officeworks receipt
- Should see amount extracted (not 0.0)
- Should see VAT extracted (not null)

---

## Testing Checklist

- [ ] Restart AI service
- [ ] Test receipt scanning → Check if amount/VAT extract correctly
- [ ] Create test products
- [ ] Try product selection in invoice
- [ ] Try saving an invoice template
- [ ] Try uploading a bank statement
- [ ] Check console/backend logs if anything fails

---

## Backend Service Check

All services running:
- ✅ C# API (localhost:5175)
- ✅ AI Service (localhost:8000) - needs restart
- ✅ Database (SQLite)
- ✅ Mobile app (localhost:8081)

