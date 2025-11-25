using FinLightSA.API.Configuration;
using FinLightSA.API.Middleware;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Load user-secrets (local dev)
builder.Configuration.AddUserSecrets(System.Reflection.Assembly.GetExecutingAssembly());

// Register services
builder.Services.AddSingleton<SupabaseClientFactory>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<TokenService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT config
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
if (string.IsNullOrEmpty(jwtKey))
    Console.WriteLine("Warning: JWT key not set. Use user-secrets or env vars.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = true;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Initialize Supabase client - will throw if keys missing
try
{
    var supaFactory = app.Services.GetRequiredService<SupabaseClientFactory>();
    var supa = supaFactory.CreateAndInitializeClientAsync().GetAwaiter().GetResult();
    Console.WriteLine("Supabase client initialized.");
}
catch (Exception ex)
{
    Console.WriteLine("Supabase initialization failed: " + ex.Message);
}

// Middleware
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
