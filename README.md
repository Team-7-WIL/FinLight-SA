# FinLight SA Backend API

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

## Setup

### 1. Configure Supabase
Update `appsettings.json` with your Supabase credentials:

### 2. Install Dependencies
```bash
# For .NET projects
dotnet restore

# For Python FastAPI microservice
pip install -r requirements.txt
