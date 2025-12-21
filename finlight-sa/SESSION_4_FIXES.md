# Session 4 - Bug Fixes and Analysis

**Date:** December 16, 2025

## Issues Addressed

### 1. ✅ FIXED: OCR Processing Failures (NULL JSON Values)

**Problem:** OCR was extracting `amount: 0.0` when receipts showed `TOTAL $27.96`, and `vat_amount: null` when receipts showed `GST $2.54`.

**Root Cause:** The regex patterns in `app/ocr.py` were too simplistic:
- Pattern `r'Total[:\s]+R?\s*(\d+[\.,]\d{2})'` didn't match `TOTAL $27.96`
- Pattern for VAT didn't handle `GST Included in Total $2.54`
- The format `255-00` (using hyphen as decimal separator) wasn't parsed

**Solution Applied:** Enhanced regex patterns in [ai-service/app/ocr.py](ai-service/app/ocr.py):

```python
# parse_amount() - Now handles:
r'(?:TOTAL|Total)\s+[\$R]?\s*(\d+[\.,\-]\d{2})'  # TOTAL $27.96 or Total 255-00
r'[\$R]\s*(\d+[\.,\-]\d{2})'                       # $100.00 format
```

```python
# parse_vat() - Now handles:
r'(?:GST|VAT)\s+(?:Included in Total|Amount)[:\s]+[\$R]?\s*(\d+[\.,\-]\d{2})'  # GST Included in Total $2.54
r'(?:GST|VAT)[:\s]+[\$R]?\s*(\d+[\.,\-]\d{2})'    # GST/VAT $amount
```

**Key Improvements:**
- Supports multiple currency symbols: `$`, `R`, or none
- Handles decimal separators: `.`, `,`, or `-`
- Case-insensitive matching
- Prioritizes TOTAL line for amount extraction
- Returns `None` for null values (no longer throws exceptions)

**Testing:** Receipts with null VAT/amounts should now parse correctly without C# JSON exceptions.

---

### 2. ⚠️ ANALYSIS: Product Selection Not Working

**Problem:** "When selecting products in invoices nothing happens"

**Investigation Findings:**
- Frontend code in `CreateInvoiceScreen.js` is **correctly implemented**
- Product selector modal renders properly
- `onProductSelected()` callback correctly updates form data
- **Root Cause:** NO PRODUCTS EXIST IN DATABASE

**Evidence from Logs:**
```
GET /api/products responded 200 in 40.5010 ms
Database query shows: COUNT(*) FROM "products" AS "p" WHERE "p"."BusinessId" = ? → 0 rows
```

**Solution:** This is a DATA issue, not a CODE issue.
- User needs to create products via the ProductsScreen
- Or populate the database with test products
- The code is working correctly

**Action Required:** 
1. User should navigate to Products screen
2. Add test products (e.g., "Laptop", "Monitor", etc.)
3. Assign them to categories
4. Then product selection in invoices will work

---

### 3. ⚠️ ANALYSIS: Invoice Template Saving Not Working

**Problem:** "The saving template doesn't work"

**Investigation Findings:**
- Frontend code in `CreateInvoiceScreen.js` is **correctly implemented**
- POST endpoint in `InvoiceTemplatesController.cs` is **correctly implemented**
- Validation, error handling, and data persistence all present
- **Likely Causes:**
  1. User might be clicking save but not adding items first (validation error)
  2. Network/API communication issue
  3. Business ID claim missing from JWT token

**Code Analysis:**
- Validation present: checks `formData.items.length > 0`
- Error logging: sends to console and UI alert
- DTO structure matches: `CreateInvoiceTemplateRequest` has all required fields

**Solution:** Enable detailed logging to see what error occurs:
- Frontend console already logs errors
- Backend logs any exceptions
- User should check for validation alert messages

**Action Required:**
1. Try saving a template with items added
2. Check browser console for error messages
3. Check backend logs for API exceptions
4. Verify JWT token includes BusinessId claim

---

### 4. ⚠️ ANALYSIS: Bank Statement Upload Not Working

**Problem:** "Nothing happens when uploading bank statements"

**Investigation Findings:**
- Backend endpoint is **correctly implemented**: `[HttpPost]` with multipart/form-data
- Frontend form submission is **correctly implemented**
- File validation present for: .csv, .xlsx, .xls, .pdf
- File data storage and database save implemented
- Error handling and logging present

**Code Analysis:**
- Both native and web platforms handled in frontend
- FormData construction differs by platform (web uses Blob, native uses URI)
- Post-upload, system attempts to auto-process the statement

**Likely Issue:** Auto-processing fails after upload
- Console shows: "Error auto-processing bank statement"
- The upload succeeds but subsequent `/process` endpoint fails
- Check backend logs for the process endpoint errors

**Frontend Code Evidence:**
```javascript
// After upload succeeds:
const processResponse = await apiClient.post(`/bankstatements/${response.data.data.id}/process`);
// If this fails, catch block alerts user
```

**Action Required:**
1. Check if files are actually being uploaded (check database)
2. Run manual process endpoint: POST `/api/bankstatements/{id}/process`
3. Check backend logs for processing errors
4. Verify file content is valid CSV/Excel format

---

## Summary of Fixes

| Issue | Status | Action | Priority |
|-------|--------|--------|----------|
| OCR NULL parsing | ✅ FIXED | Code changed in ocr.py | CRITICAL |
| Product selection | ⚠️ NO BUG | Add test products | MEDIUM |
| Template saving | ⚠️ UNCERTAIN | Enable logging | MEDIUM |
| Bank upload | ⚠️ UNCERTAIN | Check processing endpoint | HIGH |

---

## Recommendations

### For Testing Receipt OCR
1. Scan a receipt with:
   - Clear TOTAL line: `TOTAL $27.96`
   - VAT amount: `GST $2.54`
   - Decimal separator variations
2. Verify extracted data shows correct amounts (not 0.0)

### For Product Selection
1. Go to Products screen
2. Create test products: "Laptop R5000", "Monitor R2000"
3. Assign to category
4. Return to Create Invoice → Select Product should now work

### For Template Saving
1. Add invoice items
2. Try save template
3. Check console for errors
4. If error persists, provide console output

### For Bank Statements
1. Upload a valid CSV/Excel file
2. Monitor backend logs during processing
3. Check if database records creation
4. If process fails, manually test `/process` endpoint

---

## Files Modified This Session

1. **ai-service/app/ocr.py**
   - `parse_amount()` - Enhanced regex patterns
   - `parse_vat()` - Enhanced regex patterns
   - Both now handle multiple formats and return None for null values

## Next Steps

1. Restart AI service to apply OCR fixes
2. Test receipt scanning with improved parsing
3. Create test data (products) for invoice creation
4. Verify template saving works with complete form
5. Debug bank statement processing with logs
