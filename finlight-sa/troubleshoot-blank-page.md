# Troubleshooting Blank Page Issue

## Problem
The FinLight SA mobile app shows a blank page when trying to load in web mode.

## Root Cause
The app was returning `null` during the loading state when checking authentication, causing an indefinite blank page.

## Solutions Applied

### 1. Fixed Loading Screen
- Replaced `return null` with a proper loading screen that shows a spinner and message
- Added timeout mechanism (5 seconds) to prevent infinite loading
- Added proper error handling for initialization failures

### 2. Improved Authentication Loading
- Added timeout protection for AsyncStorage operations
- Added better error handling and logging
- Ensured loading state always completes

### 3. Backend Health Check
- Added health endpoint to API for testing connectivity
- Verified database and migrations are working

## How to Run the Application

### Option 1: Run All Services (Recommended)
```bash
# Run this from the project root directory
./run-all.bat
```

### Option 2: Run Services Individually

#### Start AI Service
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

#### Start Backend API
```bash
cd backend/FinLightSA.API
dotnet run --urls=http://localhost:5175
```

#### Start Mobile App (Web Mode)
```bash
cd mobile
npm start
# Then press 'w' to open web version
```

#### Start Mobile App (Expo Web)
```bash
cd mobile
npx expo start --web --port 19006
```

## Testing the Fix

1. Start the backend services first
2. Open the mobile app in web mode
3. You should now see a loading screen instead of a blank page
4. The app should load within 5 seconds or show an error message

## If Issues Persist

### Check Console Logs
Open browser developer tools and check for JavaScript errors in the console.

### Clear Storage
If the app was previously stuck, clear local storage:
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

### Reset Metro Bundler
```bash
cd mobile
npx expo r -c
```

### Check Dependencies
```bash
cd mobile
npm install
```

## Environment Setup

Make sure you have:
- Node.js 18+
- .NET 8 SDK
- Python 3.8+ with required packages
- SQLite (included with .NET)

## API Configuration

The mobile app expects the backend at `http://localhost:5175/api`. If running on different ports, update the API URL in:
- `mobile/src/config/api.js`
- Or set environment variable: `EXPO_PUBLIC_API_URL`

## Common Issues

1. **Backend not running**: Check that `dotnet run` completed successfully
2. **Port conflicts**: Make sure ports 8000, 5175, and 19006 are available
3. **Database issues**: Run `dotnet ef database update` if needed
4. **CORS issues**: Backend allows all origins in development
5. **AsyncStorage issues**: May not work perfectly in web mode - app is designed for mobile first

## Mobile App Features Now Working

- ✅ Invoice status management
- ✅ Product categories
- ✅ Enhanced invoice creation
- ✅ OCR receipt processing
- ✅ Session management
- ✅ Invoice templates
- ✅ Multi-language support
- ✅ Theme switching

The app should now load properly instead of showing a blank page!