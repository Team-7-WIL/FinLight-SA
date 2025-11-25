namespace FinLightSA.API.Models;

public class AuthResponse
{
    public string? Token { get; set; }
    public string? UserId { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
}