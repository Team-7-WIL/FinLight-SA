# FinLight SA Backend

## Environment Configuration

### Development Setup

1. Copy the development configuration:
   ```bash
   cp FinLightSA.API/appsettings.Development.json FinLightSA.API/appsettings.Development.json
   ```

2. The development configuration includes default values for local development.

### Production Setup

For production deployment, set the following environment variables:

```bash
# Database
ConnectionStrings__DefaultConnection="Data Source=your-production-db.db"

# JWT
Jwt__Secret="your-secure-jwt-secret-here"
Jwt__Issuer="finlight-sa"
Jwt__Audience="finlight-sa-users"

# Supabase (if using)
Supabase__Url="your-supabase-url"
Supabase__Key="your-supabase-anon-key"
Supabase__ServiceKey="your-supabase-service-key"

# Google Cloud (for OCR)
GoogleCloud__ProjectId="your-gcp-project-id"
GoogleCloud__CredentialsPath="path/to/service-account-key.json"

# AI Service
AIService__BaseUrl="http://your-ai-service-url:8000"
```

### Running the Application

```bash
# Development
dotnet run --project FinLightSA.API

# Production
dotnet publish -c Release
```

## Database Migrations

```bash
# Apply migrations
dotnet ef database update

# Create new migration
dotnet ef migrations add MigrationName
```

## API Documentation

Once running, visit `http://localhost:5166/swagger` for API documentation.
