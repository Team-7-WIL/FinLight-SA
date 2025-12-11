using FinLightSA.Core.DTOs.Business;

namespace FinLightSA.Core.DTOs.Auth;

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public string TokenType { get; set; } = "Bearer";
    public UserDto User { get; set; } = null!;
    public BusinessDto DefaultBusiness { get; set; } = null!;

    // Backward compatibility
    public string Token => AccessToken;
}