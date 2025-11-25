using FinLightSA.API.Configuration;
using FinLightSA.API.Middleware;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Load secrets
builder.Configuration.AddUserSecrets<Program>();

// DI Services
builder.Services.AddSingleton<SupabaseClientFactory>();
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<StorageService>();
builder.Services.AddScoped<AiService>();
builder.Services.AddScoped<OcrService>();
builder.Services.AddScoped<BankService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddHttpClient<AiService>();
builder.Services.AddHttpClient<BankService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32) throw new InvalidOperationException("JWT Key missing or too short!");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "FinLightSA";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "FinLightSAUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("OwnerOnly", policy => policy.RequireRole("Owner"));
});

var app = builder.Build();

// Async Supabase Init
using (var scope = app.Services.CreateScope())
{
    var factory = scope.ServiceProvider.GetRequiredService<SupabaseClientFactory>();
    try
    {
        await factory.CreateAndInitializeClientAsync();
        Console.WriteLine("Supabase initialized.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Supabase init failed: {ex.Message}");
        throw;
    }
}

// Middleware
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseSwagger(); app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseAuthentication(); app.UseAuthorization();
app.MapControllers();

await app.RunAsync();