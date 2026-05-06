
# FinLight SA Frontend:

# FinLight SA Backend:

# FinLight SA Backend API:

## Overview
Mobile-first accounting solution backend built with .NET 8, Supabase, and AI integration.

## Tech Stack
- **Framework**: .NET 8 Web API (C# 12.0)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (Supabase Auth)
- **Storage**: Supabase Storage
- **AI**: Python FastAPI microservice

## Prerequisites
- .NET 8 SDK
- Supabase account & project
- Visual Studio 2022 or VS Code

### 1. Install Tesseract OCR

**Windows:**
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Install to default location: `C:\Program Files\Tesseract-OCR`
- Or set environment variable `TESSDATA_PREFIX` if installed elsewhere

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

### 2. Install Python 3.8+
- Download from: https://www.python.org/downloads/
- Ensure Python is in your PATH

### 3. Install .NET 8 SDK
- Download from: https://dotnet.microsoft.com/download
- Ensure dotnet is in your PATH

### 4. Install Node.js and npm
- Download from: https://nodejs.org/
- Ensure node and npm are in your PATH

## Setup

### 1. Configure Supabase
Update `appsettings.json` with your Supabase credentials:

### 2. Install Dependencies
```bash
# For .NET projects
dotnet restore

# For Python FastAPI microservice
pip install -r requirements.txt
