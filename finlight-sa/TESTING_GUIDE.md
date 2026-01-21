# FinLight SA - Complete Testing Guide

## Overview
This guide covers end-to-end testing of all features including quotations, invoices, AI categorization, and mobile responsiveness.

## Prerequisites

1. **Backend API Running**
   ```bash
   cd backend/FinLightSA.API
   dotnet run
   ```
   API should be available at `http://localhost:5175` (or configured port)

2. **AI Service Running**
   ```bash
   cd ai-service
   python main.py
   ```
   AI service should be available at `http://localhost:8000`

3. **Mobile App Running**
   ```bash
   cd mobile
   npm start
   ```
   Then press `w` for web, `i` for iOS simulator, or `a` for Android emulator
   Or scan QR code with Expo Go app on your phone

## Database Setup

Ensure migrations are applied:
```bash
cd backend/FinLightSA.API
dotnet ef database update
```

## Testing Checklist

### ✅ 1. Quotations Feature

#### 1.1 Create Quotation
- [ ] Navigate to Quotations tab
- [ ] Tap "+" button to create new quotation
- [ ] Select a customer from dropdown
- [ ] Set issue date and expiry date
- [ ] Add items:
  - [ ] Tap "Select Product" to choose from products
  - [ ] Or manually enter description, quantity, unit price
  - [ ] Verify VAT rate defaults to 15%
  - [ ] Add multiple items
  - [ ] Remove an item
- [ ] Add notes (optional)
- [ ] Verify total calculation (subtotal + VAT)
- [ ] Tap "Create Quotation"
- [ ] Verify success message
- [ ] Verify quotation appears in list

#### 1.2 View Quotation List
- [ ] Verify quotations are displayed in reverse chronological order
- [ ] Verify status badges show correct colors:
  - Draft: Gray
  - Sent: Blue
  - Accepted: Green
  - Rejected/Expired: Red
  - Converted: Primary color
- [ ] Verify customer name displays
- [ ] Verify total amount displays
- [ ] Verify expiry date displays (if set)
- [ ] Test status filter (if implemented)

#### 1.3 View Quotation Details
- [ ] Tap on a quotation card
- [ ] Verify all details display:
  - [ ] Quotation number
  - [ ] Status
  - [ ] Customer information
  - [ ] Issue date
  - [ ] Expiry date
  - [ ] All items with line totals
  - [ ] Subtotal, VAT, Total
  - [ ] Notes (if any)

#### 1.4 Update Quotation Status
- [ ] From quotation list, tap status badge
- [ ] Select new status from modal
- [ ] Verify status updates
- [ ] Verify quotation list refreshes

#### 1.5 Download Quotation PDF
- [ ] From quotation detail or list, tap "PDF" button
- [ ] On web: Verify PDF downloads
- [ ] On mobile: Verify PDF opens in share dialog
- [ ] Verify PDF contains:
  - [ ] "QUOTATION" header
  - [ ] Quotation number
  - [ ] Business information
  - [ ] Customer information
  - [ ] All items in table format
  - [ ] VAT calculations
  - [ ] Total amount
  - [ ] Expiry date notice

#### 1.6 Send Quotation Email
- [ ] From quotation detail or list, tap "Email" button
- [ ] Verify email sends (if email configured)
- [ ] Verify quotation status changes to "Sent"
- [ ] Check email inbox for PDF attachment

#### 1.7 Convert Quotation to Invoice
- [ ] From quotation detail or list, tap "Convert" button
- [ ] Confirm conversion in alert
- [ ] Verify success message
- [ ] Verify navigation to Invoices tab
- [ ] Verify new invoice appears
- [ ] Verify invoice has same items and totals
- [ ] Verify quotation status changes to "Converted"
- [ ] Verify quotation shows "Converted" badge (no convert button)

### ✅ 2. Invoices Feature

#### 2.1 Create Invoice
- [ ] Navigate to Invoices tab
- [ ] Tap "+" button
- [ ] Fill in invoice details
- [ ] Add items
- [ ] Verify VAT calculations
- [ ] Create invoice
- [ ] Verify invoice appears in list

#### 2.2 Invoice PDF Generation
- [ ] Open invoice detail
- [ ] Tap "PDF" button
- [ ] Verify PDF downloads/opens
- [ ] Verify PDF contains correct information

#### 2.3 Send Invoice Email
- [ ] Open invoice detail
- [ ] Tap "Email" button (if implemented)
- [ ] Verify email sends
- [ ] Verify invoice status updates

### ✅ 3. AI Categorization

#### 3.1 Single Transaction Categorization
- [ ] Create an expense
- [ ] Enter transaction description (e.g., "Petrol station")
- [ ] Verify AI suggests category (e.g., "Fuel")
- [ ] Verify confidence score displays
- [ ] Verify alternative categories show

#### 3.2 Batch Categorization
- [ ] Upload bank statement
- [ ] Verify transactions are categorized
- [ ] Verify confidence scores for each
- [ ] Test with various transaction types

#### 3.3 AI Service Health
- [ ] Visit `http://localhost:8000/health`
- [ ] Verify service responds:
  ```json
  {
    "status": "healthy",
    "categorizer_loaded": true,
    "ocr_available": true/false
  }
  ```

#### 3.4 OCR Receipt Processing
- [ ] Navigate to OCR Scan screen
- [ ] Take photo or select image of receipt
- [ ] Verify OCR extracts:
  - [ ] Vendor name
  - [ ] Amount
  - [ ] Date
  - [ ] VAT amount
  - [ ] Items list
- [ ] Create expense from OCR data

### ✅ 4. Mobile Responsiveness

#### 4.1 Mobile (Expo Go)
- [ ] Install Expo Go app
- [ ] Scan QR code from terminal
- [ ] Test on physical device:
  - [ ] Verify all screens load correctly
  - [ ] Verify touch targets are adequate size
  - [ ] Verify scrolling works smoothly
  - [ ] Verify PDF download/share works
  - [ ] Verify keyboard doesn't cover inputs
  - [ ] Test in portrait and landscape

#### 4.2 Tablet
- [ ] Test on tablet or tablet simulator
- [ ] Verify layout adapts appropriately
- [ ] Verify list views use space efficiently
- [ ] Verify forms are readable

#### 4.3 Desktop/Web
- [ ] Open in web browser
- [ ] Verify responsive design
- [ ] Verify PDF downloads work
- [ ] Verify all features accessible
- [ ] Test with different browser sizes

### ✅ 5. VAT Calculations

#### 5.1 Quotation VAT
- [ ] Create quotation with items
- [ ] Set VAT rate to 15%
- [ ] Verify:
  - [ ] Line total = quantity × unit price
  - [ ] VAT amount = line total × 0.15
  - [ ] Subtotal = sum of line totals
  - [ ] Total VAT = sum of VAT amounts
  - [ ] Total = subtotal + total VAT

#### 5.2 Invoice VAT
- [ ] Create invoice
- [ ] Verify same VAT calculations
- [ ] Convert quotation to invoice
- [ ] Verify VAT amounts match

### ✅ 6. Error Handling

#### 6.1 Network Errors
- [ ] Disconnect internet
- [ ] Try to create quotation
- [ ] Verify error message displays
- [ ] Reconnect and verify retry works

#### 6.2 Validation Errors
- [ ] Try to create quotation without customer
- [ ] Verify validation error
- [ ] Try to create with invalid dates
- [ ] Verify date validation

#### 6.3 API Errors
- [ ] Stop backend API
- [ ] Try to load quotations
- [ ] Verify graceful error handling
- [ ] Restart API and verify recovery

### ✅ 7. Performance

#### 7.1 List Loading
- [ ] Create 50+ quotations
- [ ] Verify list loads quickly
- [ ] Verify pagination works (if implemented)
- [ ] Verify smooth scrolling

#### 7.2 PDF Generation
- [ ] Generate PDF for quotation with many items
- [ ] Verify generation is fast (< 2 seconds)
- [ ] Verify PDF quality

### ✅ 8. Data Integrity

#### 8.1 Quotation to Invoice Conversion
- [ ] Create quotation with specific items
- [ ] Note all values
- [ ] Convert to invoice
- [ ] Verify:
  - [ ] All items copied correctly
  - [ ] Quantities match
  - [ ] Prices match
  - [ ] VAT calculations match
  - [ ] Totals match

#### 8.2 Status Transitions
- [ ] Verify quotation statuses:
  - [ ] Draft → Sent
  - [ ] Sent → Accepted/Rejected
  - [ ] Any → Converted (one-way)
- [ ] Verify converted quotations can't be converted again

## API Testing (Postman/Thunder Client)

### Quotations Endpoints

```http
# Get all quotations
GET http://localhost:5175/api/quotations
Authorization: Bearer {token}

# Get quotation by ID
GET http://localhost:5175/api/quotations/{id}
Authorization: Bearer {token}

# Create quotation
POST http://localhost:5175/api/quotations
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "guid-here",
  "items": [
    {
      "productId": null,
      "description": "Test Item",
      "quantity": 2,
      "unitPrice": 100.00,
      "vatRate": 0.15
    }
  ],
  "issueDate": "2024-01-19T00:00:00Z",
  "expiryDate": "2024-02-19T00:00:00Z",
  "notes": "Test quotation"
}

# Convert to invoice
POST http://localhost:5175/api/quotations/{id}/convert-to-invoice
Authorization: Bearer {token}
Content-Type: application/json

{
  "issueDate": "2024-01-19T00:00:00Z",
  "dueDate": "2024-02-19T00:00:00Z",
  "notes": "Converted from quotation"
}

# Get PDF
GET http://localhost:5175/api/quotations/{id}/pdf
Authorization: Bearer {token}

# Send email
POST http://localhost:5175/api/quotations/{id}/send-email
Authorization: Bearer {token}
Content-Type: application/json

{
  "toEmail": "customer@example.com",
  "subject": "Your Quotation",
  "message": "Please find attached quotation"
}
```

## Common Issues & Solutions

### Issue: PDF not downloading on mobile
**Solution**: Ensure `expo-file-system` and `expo-sharing` are installed. Check file permissions.

### Issue: Email not sending
**Solution**: Configure SMTP settings in `appsettings.Development.json`. In development, emails are logged but not sent if SMTP not configured.

### Issue: AI categorization not working
**Solution**: 
1. Check AI service is running on port 8000
2. Verify `AIService:BaseUrl` in appsettings matches
3. Check AI service health endpoint

### Issue: Quotations not appearing
**Solution**:
1. Verify database migration applied
2. Check API logs for errors
3. Verify authentication token is valid
4. Check BusinessId in token matches your business

### Issue: Convert to Invoice fails
**Solution**:
1. Verify quotation exists and belongs to your business
2. Check quotation hasn't already been converted
3. Verify customer still exists
4. Check API logs for detailed error

## Success Criteria

✅ All features work on mobile (Expo Go)  
✅ All features work on desktop/web  
✅ PDF generation works on all platforms  
✅ Email sending works (when configured)  
✅ VAT calculations are accurate  
✅ Quotation to invoice conversion preserves all data  
✅ AI categorization provides consistent results  
✅ Error handling is user-friendly  
✅ Performance is acceptable (< 2s for most operations)  

## Next Steps After Testing

1. Fix any bugs found during testing
2. Add missing error messages
3. Improve UI/UX based on testing feedback
4. Add loading indicators where needed
5. Optimize performance if needed
6. Add unit tests for critical business logic
7. Set up email service for production

---

**Happy Testing! 🚀**

