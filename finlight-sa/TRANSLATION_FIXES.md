# Translation Fixes - Edit Modal Missing Keys

## Issue
The edit modal for bank transactions was showing missing translation warnings for common fields:
- `[missing "en.common.description" translation]`
- `[missing "en.common.amount" translation]`
- `[missing "en.common.date" translation]`
- `[missing "en.common.type" translation]`

## Root Cause
The edit modal UI was using translation keys (`t('common.description')`, `t('common.amount')`, etc.) that didn't exist in the i18n translation files.

## Solution
Added the missing translation keys to the `common` section for all 8 supported languages.

### Translation Keys Added
```javascript
common: {
  // ... existing keys ...
  description: '<translated-text>',
  amount: '<translated-text>',
  date: '<translated-text>',
  type: '<translated-text>',
}
```

### Languages Updated
1. **English (en)**
   - description: 'Description'
   - amount: 'Amount'
   - date: 'Date'
   - type: 'Type'

2. **Zulu (zu)**
   - description: 'Incazelo'
   - amount: 'Inani'
   - date: 'Usuku'
   - type: 'Uhlobo'

3. **Sepedi (nso)**
   - description: 'Tlhaloso'
   - amount: 'Palo'
   - date: 'Letšatšo'
   - type: 'Mofuta'

4. **Swahili (sw)**
   - description: 'Maelezo'
   - amount: 'Kiasi'
   - date: 'Tarehe'
   - type: 'Aina'

5. **French (fr)**
   - description: 'Description'
   - amount: 'Montant'
   - date: 'Date'
   - type: 'Type'

6. **Portuguese (pt)**
   - description: 'Descrição'
   - amount: 'Montante'
   - date: 'Data'
   - type: 'Tipo'

7. **Spanish (es)**
   - description: 'Descripción'
   - amount: 'Cantidad'
   - date: 'Fecha'
   - type: 'Tipo'

## Files Modified
- `mobile/src/i18n/index.js` - Added 4 translation keys to 8 language sections (32 total entries)

## Result
✅ Edit modal now displays all field labels in proper translated text
✅ No more missing translation warnings
✅ Complete internationalization support for edit form

## Testing
When users open the edit modal and select different languages in Settings, they will see:
- Form fields labeled in their selected language
- No `[missing translation]` placeholders
- Consistent terminology across the app
