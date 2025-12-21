# Testing Guide for Session 6 Fixes

## Prerequisites
- Start the backend: `cd backend && dotnet run`
- Start the AI service: `cd ai-service && python main.py`
- Start the mobile app: `cd mobile && npm run ios` (or android)

---

## Test 1: Delete Button Functionality ✓

### Test Steps
1. Upload a bank statement PDF
2. Go to Bank Transactions screen
3. Process the statement (click Process button)
4. Verify transactions are displayed
5. Click the red "Delete" button on any transaction
6. Confirm deletion in the alert dialog
7. Verify the transaction is removed from the list

### Expected Results
- ✅ Delete button is visible (red color)
- ✅ Clicking Delete shows a confirmation dialog
- ✅ Confirming deletion removes the transaction
- ✅ Transaction count decreases by 1
- ✅ Transaction is removed from database

### Success Criteria
- No errors in console
- Success alert shown: "Transaction deleted successfully"
- Transaction immediately removed from screen

---

## Test 2: Edit Button Translation Fix ✓

### Test Steps
1. Open the mobile app
2. Go to Settings → Language
3. Change to each language:
   - English
   - Zulu (Isizulu)
   - Setswana
   - Swahili (Kiswahili)
   - French (Français)
   - Portuguese (Português)
   - Spanish (Español)
4. Go to Bank Transactions screen
5. Verify the Edit button text for each language

### Expected Translations
- **English:** "Edit"
- **Zulu:** "Lungiselela"
- **Setswana:** "Lokiša"
- **Swahili:** "Badilisha"
- **French:** "Modifier"
- **Portuguese:** "Editar"
- **Spanish:** "Editar"

### Success Criteria
- ✅ Edit button shows correct translation for active language
- ✅ No "{missing translation}" placeholders
- ✅ Language changes immediately reflect on screen

---

## Test 3: Bank Transactions Reflect on Expenses & Dashboard ✓

### Test Scenario A: Manual Expenses + Bank Transactions

#### Setup
1. Create a manual expense:
   - Category: "Office Supplies"
   - Amount: R500
   - Save

2. Upload a bank statement with transactions:
   - Transaction 1: R200 Debit "Stationery" (categorize as Office Supplies)
   - Transaction 2: R1000 Credit "Invoice Payment" (categorize as Sales)

#### Expected Dashboard Results
- **Total Expenses:** R700 (R500 manual + R200 bank debit)
- **Total Income:** R1000 (from bank credit)
- **Top Expense Categories:** Office Supplies - R700 (merged from both sources)
- **Net Cash Flow:** R300 (R1000 - R700)

### Test Scenario B: Category Aggregation

#### Setup
1. Create 2 manual expenses:
   - Travel: R100
   - Travel: R150

2. Create 2 bank transactions and categorize:
   - Transaction 1: R200 Debit "Uber" (categorize as Travel)
   - Transaction 2: R300 Debit "Flights" (categorize as Travel)

#### Expected Dashboard Results
- **Top Expense Categories:**
  - Travel: R750 total
    - Count: 4 (2 manual + 2 bank transactions)
    - Amount breakdown: R100 + R150 + R200 + R300

### Test Scenario C: Monthly Trends

#### Setup
1. Create transactions in different months:
   - This month:
     - Manual expense: R500 (Utilities)
     - Bank debit: R200 (Power Bill) - categorized as Utilities
     - Bank credit: R2000 (Sales) - categorized as Revenue
   
   - Last month:
     - Manual expense: R300
     - Bank debit: R100 - categorized
     - Bank credit: R500 - categorized

#### Expected Dashboard Results
- **This Month:**
  - Expenses: R700 (R500 + R200)
  - Income: R2000
  - Net Flow: R1300

- **Last Month:**
  - Expenses: R400 (R300 + R100)
  - Income: R500
  - Net Flow: R100

### Test Scenario D: Bank Transactions Without Categories

#### Setup
1. Upload bank statement with transactions
2. **DON'T categorize them**
3. Check dashboard

#### Expected Results
- ✅ Uncategorized bank transactions should NOT appear on dashboard
- ✅ Dashboard only shows transactions with AiCategory set
- ✅ Only categorized debits appear as expenses
- ✅ Only categorized credits appear as income

---

## Test 4: Data Extraction Verification ✓

### Test Steps
1. Prepare a bank statement PDF with clear transactions
2. Upload the PDF
3. Click "Process" button
4. Verify extraction:
   - Transactions are extracted (not sample data)
   - Dates are correct
   - Amounts are correct
   - Descriptions match the PDF
   - Direction (Debit/Credit) is correct

### Success Criteria
- ✅ Real data from PDF appears
- ✅ No random/sample transactions shown
- ✅ All transaction fields populated correctly
- ✅ Extraction confidence is reasonable

---

## Test 5: End-to-End Workflow

### Complete User Journey
1. Login to app
2. Navigate to Bank Statements
3. Upload real bank statement PDF
4. Process the statement (wait for extraction)
5. Verify transactions displayed
6. Edit one transaction (change amount/date)
7. Categorize transactions via AI
8. Go to Dashboard
9. Verify totals include:
   - Income from categorized credits
   - Expenses from categorized debits
   - Categories merged correctly
10. Go back to transactions
11. Delete a transaction
12. Verify delete worked

### Expected Result
- ✅ Complete workflow works without errors
- ✅ All three fixes working together seamlessly

---

## API Testing (with Postman/REST Client)

### Test 1: Delete Endpoint
```http
DELETE http://localhost:5175/api/banktransactions/{transactionId}
Authorization: Bearer <token>
```

Expected Response:
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

### Test 2: Dashboard Summary
```http
GET http://localhost:5175/api/dashboard/summary?startDate=2024-12-01&endDate=2024-12-31
Authorization: Bearer <token>
```

Expected Response includes:
```json
{
  "success": true,
  "data": {
    "totalIncome": 5000,        // Includes paid invoices + bank credits
    "totalExpenses": 2000,      // Includes manual expenses + bank debits
    "topExpenseCategories": [
      {
        "category": "Office Supplies",
        "amount": 700,           // From both manual and bank sources
        "count": 3
      }
    ],
    "monthlyTrends": [
      {
        "month": "Dec 2024",
        "income": 5000,          // Includes bank transactions
        "expenses": 2000,        // Includes bank transactions
        "netFlow": 3000
      }
    ]
  }
}
```

### Test 3: Update Transaction with New Fields
```http
PUT http://localhost:5175/api/banktransactions/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated Description",
  "amount": 1500,
  "txnDate": "2024-12-15T00:00:00Z",
  "direction": "Credit"
}
```

Expected Response:
```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": {
    "id": "...",
    "amount": 1500,
    "txnDate": "2024-12-15T00:00:00Z",
    "direction": "Credit"
  }
}
```

---

## Troubleshooting

### Issue: Delete button shows 404 error
**Solution:** Ensure BankTransactionsController has DELETE endpoint (should be fixed)
```bash
cd backend
dotnet build  # Should succeed with 0 errors
dotnet run    # Start API
```

### Issue: Edit translation still shows "Edit" in other languages
**Solution:** Clear app cache and rebuild
```bash
cd mobile
npm run ios  # or npm run android
```

### Issue: Dashboard doesn't show bank transactions
**Possible Causes:**
1. Transactions don't have AiCategory set
   - Solution: Categorize transactions first

2. Date range doesn't match transaction dates
   - Solution: Check dashboard date filter

3. Build hasn't been updated
   - Solution: 
     ```bash
     cd backend
     dotnet build -c Release
     dotnet run -c Release
     ```

### Issue: Extract showing sample data instead of real PDF data
**Debugging:**
1. Check AI service is running: `python main.py` in ai-service folder
2. Check logs for errors
3. Verify PDF is valid and has text
4. Test extraction directly:
   ```bash
   curl -F "file=@statement.pdf" http://localhost:8000/extract-bank-statement
   ```

---

## Performance Considerations

### Dashboard Query Performance
The dashboard now performs additional queries:
- Bank transactions filtered by category (Debit for expenses)
- Bank transactions filtered by category (Credit for income)
- Category grouping and merging

**Expected impact:** Minimal (< 100ms added)

**Optimization note:** If dashboard becomes slow with large transaction volumes:
- Add index on `BankTransaction.AiCategory`
- Add index on `BankTransaction.Direction`
- Add index on `BankTransaction.TxnDate`

---

## Files Modified This Session

1. ✅ `backend/FinLightSA.API/Controllers/BankTransactionsController.cs`
   - Added DELETE endpoint
   - Fixed audit logging call signature

2. ✅ `backend/FinLightSA.API/Controllers/BankStatementsController.cs`
   - Fixed syntax error (stray brace)
   - Added proper method signature to GetBankStatementFile

3. ✅ `backend/FinLightSA.API/Controllers/DashboardController.cs`
   - Added bank transaction income calculation
   - Added bank transaction expense calculation  
   - Added category merging logic
   - Added monthly trend integration

4. ✅ `mobile/src/i18n/index.js`
   - Added "edit" translation to 7 language sections

---

## Summary of Changes

| Feature | Before | After |
|---------|--------|-------|
| Delete Button | ❌ Not working (no endpoint) | ✅ Works (DELETE endpoint added) |
| Edit Translation | ❌ Shows "Edit" in all languages | ✅ Shows translated text |
| Dashboard Income | ❌ Only invoices | ✅ Invoices + bank credits |
| Dashboard Expenses | ❌ Only manual expenses | ✅ Manual + bank debits |
| Dashboard Categories | ❌ Manual expenses only | ✅ Merged manual + bank |
| Monthly Trends | ❌ Only manual data | ✅ Includes bank data |

---

## Validation Checklist

- [ ] Backend builds without errors
- [ ] DELETE endpoint created and functional
- [ ] Edit button shows correct translation for all languages
- [ ] Dashboard includes bank transaction income
- [ ] Dashboard includes bank transaction expenses
- [ ] Categories are properly merged
- [ ] Monthly trends include bank transactions
- [ ] All date filtering works correctly
- [ ] Only categorized transactions appear on dashboard
- [ ] Delete operations audit-logged correctly

---

## Next Steps (If Issues Found)

1. **If translations don't update:** Clear mobile app cache and rebuild
2. **If dashboard doesn't update:** Hard refresh browser or restart mobile app
3. **If extraction not working:** Verify PDF has extractable text
4. **If performance issues:** Monitor database queries and add indexes if needed
