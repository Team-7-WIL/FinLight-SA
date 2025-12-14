using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using FinLightSA.Core.Models;
using FinLightSA.Core.DTOs.Auth;

namespace FinLightSA.Infrastructure.Services;

public class JwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public AuthResponse GenerateToken(User user, Guid defaultBusinessId, string role)
    {
        var secret = _configuration["Jwt:Secret"] ?? throw new ArgumentNullException("JWT Secret not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Generate refresh token
        var refreshToken = GenerateRefreshToken();

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("BusinessId", defaultBusinessId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim("RefreshToken", refreshToken)
        };

        var expirationMinutes = Convert.ToDouble(_configuration["Jwt:ExpirationMinutes"] ?? "60");
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new AuthResponse
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            RefreshToken = refreshToken,
            ExpiresIn = (int)TimeSpan.FromMinutes(expirationMinutes).TotalSeconds,
            TokenType = "Bearer"
        };
    }

    public string GenerateAccessToken(User user, Guid defaultBusinessId, string role)
    {
        var secret = _configuration["Jwt:Secret"] ?? throw new ArgumentNullException("JWT Secret not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("BusinessId", defaultBusinessId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };

        var expirationMinutes = Convert.ToDouble(_configuration["Jwt:ExpirationMinutes"] ?? "60");
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var secret = _configuration["Jwt:Secret"] ?? throw new ArgumentNullException("JWT Secret not configured");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            return tokenHandler.ValidateToken(token, validationParameters, out _);
        }
        catch
        {
            return null;
        }
    }

    public bool IsTokenExpired(string token)
    {
        var principal = ValidateToken(token);
        if (principal == null) return true;

        var expClaim = principal.FindFirst("exp");
        if (expClaim == null) return true;

        var exp = long.Parse(expClaim.Value);
        var expirationTime = DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime;

        return expirationTime <= DateTime.UtcNow;
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}