using FinLightSA.Core.DTOs.Business;

namespace FinLightSA.Core.DTOs.Auth;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public BusinessDto DefaultBusiness { get; set; } = null!;
}