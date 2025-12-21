# Quick Test Guide - Session 5 Fixes

## Testing Bug Fix #1: Product Selection

### Steps:
1. **Start the mobile app** and navigate to "Create Invoice"
2. **Ensure Products Load:**
   - Check console for: `Products loaded: {success: true...}`
   - Should see message: `Setting products: (3) [{…}, {…}, {…}]`
3. **Click "Select Product" button** on the first item
4. **Choose any product** from the modal that appears
5. **Verify the following in console logs:**
   - `selectProduct called for index: 0`
   - `onProductSelected called with product: {id, name, unitPrice...}`
   - `Updated item: {productId, description, unitPrice...}`
   - `formData updated:` (shows full formData with updated items)
6. **Visual Verification:**
   - Product name should appear in the "Description" field
   - Unit price should appear in the "Unit Price" field
   - Modal should close automatically
7. **Repeat with multiple products:**
   - Click "Add Item"
   - Select a different product
   - Verify each item has correct data

### Expected Console Output:
```
selectProduct called for index: 0
Current products state: (3) [{…}, {…}, {…}]
onProductSelected called with product: {id: "1", name: "Product A", unitPrice: 100...}
selectedItemIndex: 0
Updated item: {productId: "1", description: "Product A", unitPrice: "100", vatRate: 0.15}
formData updated:
{
  "customerId": "...",
  "items": [
    {
      "productId": "1",
      "description": "Product A",
      "quantity": 1,
      "unitPrice": "100",
      "vatRate": 0.15
    }
  ]
}
```

### If It's NOT Working:
1. Check if `formData updated:` logs are appearing (if not, state update isn't happening)
2. Check if `Updated item:` log shows product data (if empty, selection callback failed)
3. Check if `onProductSelected called` appears (if not, modal tap didn't trigger callback)
4. Check browser console for any JavaScript errors

---

## Testing Bug Fix #2: Bank Upload

### Steps:
1. **Navigate to Bank Upload Screen:**
   - Tap Settings (bottom nav)
   - Tap "Bank Statements" option
2. **Verify Upload Button Appears:**
   - Should see a "+" button (FAB) in bottom right corner
3. **Tap Upload Button:**
   - System should open file picker
4. **Select a PDF File:**
   - Choose any PDF or compatible file
5. **Monitor Console During Upload:**
   - Watch for: `Starting bank statement upload...`
   - Watch for: `Document details: {uri, name, mimeType, size}`
   - Watch for: `FormData ready, uploading to /bankstatements...`
   - Watch for: `Bank statement upload response status: 200`
   - Watch for: `Bank statement upload response data: {success: true...}`
6. **Verify Success:**
   - Should see success alert message
   - Should see: `Upload successful, bank statement ID: ...`
   - May see: `Processing bank statement...`
   - Navigation should shift to BankTransactions screen

### Expected Console Output:
```
Starting bank statement upload...
Document details: {
  uri: "file://...",
  name: "statement.pdf",
  mimeType: "application/pdf",
  size: 123456
}
Native FormData created: {
  uri: "file://...",
  name: "statement.pdf",
  type: "application/pdf"
}
FormData ready, uploading to /bankstatements...
Making POST request to /bankstatements
Bank statement upload response status: 200
Bank statement upload response data: {success: true, data: {id: "...", ...}}
Upload successful, bank statement ID: ...
Processing bank statement...
Bank statement processed successfully: {success: true...}
```

### If Upload Is NOT Working:
1. **Check if button is visible:**
   - If no + button, verify you're on BankStatementsScreen
   - Try scrolling or refreshing the screen
2. **Check if file picker opens:**
   - If DocumentPicker doesn't open, verify expo-document-picker is installed
   - Check app permissions for file access
3. **Check console for errors:**
   - Look for any JavaScript errors (red text in console)
   - Check if `Starting bank statement upload...` appears
   - If not, the pickDocument callback isn't being triggered
4. **Check network request:**
   - Open network tab in DevTools
   - Should see POST request to `/api/bankstatements`
   - Check status code and response body
   - If 400+, backend returned an error (check backend logs)
5. **Check backend logs:**
   - Navigate to backend/logs/ folder
   - Look for recent error entries
   - Search for "bankstatement" or upload-related errors

---

## Monitoring Console Output

### Open Console:
- **Web/Expo Go:** Press `j` while app is open (opens Expo console)
- **Native iOS:** Use Xcode debugger or Flipper
- **Native Android:** Use Android Studio Logcat or Flipper

### Search for Key Logs:
- Product selection: `formData updated:`
- Upload start: `Starting bank statement upload...`
- Upload success: `Upload successful, bank statement ID:`
- Errors: any red text or error messages

---

## Success Criteria

### Bug #1 Fixed If:
✓ Selecting a product updates the description and unit price fields
✓ Console shows `formData updated:` with correct product data
✓ Multiple items can be created with different products
✓ Product data persists when navigating away and back

### Bug #2 Fixed If:
✓ Upload button is accessible from BankStatementsScreen
✓ File picker opens when tapping upload button
✓ PDF file can be selected and uploaded
✓ Backend receives the file (check backend logs)
✓ Success message appears after upload
✓ Bank transactions appear after processing

---

## Debugging Checklist

- [ ] Verified products are loading in CreateInvoiceScreen
- [ ] Clicked "Select Product" and opened modal
- [ ] Selected a product from the list
- [ ] Checked console for `onProductSelected called`
- [ ] Verified description and price fields updated
- [ ] Created multiple items with different products
- [ ] Navigated to BankStatementsScreen
- [ ] Located and tapped the upload FAB button
- [ ] Selected a file from file picker
- [ ] Watched console logs during upload
- [ ] Checked for success/error messages
- [ ] Verified backend received request (check backend logs)
