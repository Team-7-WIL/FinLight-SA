#!/bin/bash
# Quick verification script for FinLight SA mobile app fixes

echo "================================"
echo "FinLight SA - Mobile App Verification"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "Checking backend..."
if curl -s http://localhost:5175/api/dashboard/summary > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on http://localhost:5175${NC}"
else
    echo -e "${RED}✗ Backend is NOT running on http://localhost:5175${NC}"
    echo "  Start backend with: cd backend && dotnet run"
fi
echo ""

# Check if frontend is running
echo "Checking mobile app..."
if curl -s http://localhost:19006/expo-status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Mobile app is running on http://localhost:19006${NC}"
else
    echo -e "${YELLOW}⚠ Mobile app is NOT running on http://localhost:19006${NC}"
    echo "  Start with: cd mobile && npm start"
fi
echo ""

# Verify fixed files exist and contain expected content
echo "Verifying code fixes..."
echo ""

# Check AddExpenseScreen.js
echo "1. AddExpenseScreen.js"
if grep -q "import \* as ImagePicker from 'expo-image-picker'" mobile/src/screens/AddExpenseScreen.js; then
    echo -e "${GREEN}   ✓ Correct ImagePicker import${NC}"
else
    echo -e "${RED}   ✗ Incorrect or missing ImagePicker import${NC}"
fi

if grep -q "ImagePicker.MediaTypeOptions.Images" mobile/src/screens/AddExpenseScreen.js; then
    echo -e "${GREEN}   ✓ Correct mediaTypes usage${NC}"
else
    echo -e "${RED}   ✗ Incorrect mediaTypes usage${NC}"
fi

if grep -q "ImagePicker.requestMediaLibraryPermissionsAsync" mobile/src/screens/AddExpenseScreen.js; then
    echo -e "${GREEN}   ✓ Correct permission request${NC}"
else
    echo -e "${RED}   ✗ Incorrect permission request${NC}"
fi
echo ""

# Check ProductsScreen.js
echo "2. ProductsScreen.js"
if grep -q "useFocusEffect" mobile/src/screens/ProductsScreen.js; then
    echo -e "${GREEN}   ✓ useFocusEffect hook added${NC}"
else
    echo -e "${RED}   ✗ useFocusEffect hook missing${NC}"
fi
echo ""

# Check CreateInvoiceScreen.js
echo "3. CreateInvoiceScreen.js"
if grep -q "useFocusEffect" mobile/src/screens/CreateInvoiceScreen.js; then
    echo -e "${GREEN}   ✓ useFocusEffect hook added${NC}"
else
    echo -e "${RED}   ✗ useFocusEffect hook missing${NC}"
fi

if grep -q "loadAllData" mobile/src/screens/CreateInvoiceScreen.js; then
    echo -e "${GREEN}   ✓ loadAllData function exists${NC}"
else
    echo -e "${RED}   ✗ loadAllData function missing${NC}"
fi

if grep -q "product.productCategory?.name" mobile/src/screens/CreateInvoiceScreen.js; then
    echo -e "${GREEN}   ✓ Improved category handling implemented${NC}"
else
    echo -e "${RED}   ✗ Category handling not improved${NC}"
fi
echo ""

# Check translations
echo "4. i18n Translation Keys"
if grep -q "'products.all'" mobile/src/i18n/index.js; then
    echo -e "${GREEN}   ✓ products.all translation exists${NC}"
else
    echo -e "${RED}   ✗ products.all translation missing${NC}"
fi

if grep -q "'buttons.cancel'" mobile/src/i18n/index.js; then
    echo -e "${GREEN}   ✓ buttons.cancel translation exists${NC}"
else
    echo -e "${RED}   ✗ buttons.cancel translation missing${NC}"
fi

if grep -q "'templates.selectTemplate'" mobile/src/i18n/index.js; then
    echo -e "${GREEN}   ✓ templates.selectTemplate translation exists${NC}"
else
    echo -e "${RED}   ✗ templates.selectTemplate translation missing${NC}"
fi
echo ""

echo "================================"
echo "Verification Complete"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Ensure backend is running: http://localhost:5175"
echo "2. Start mobile app if not running: cd mobile && npm start"
echo "3. Test features according to FIXES_APPLIED.md checklist"
echo ""
