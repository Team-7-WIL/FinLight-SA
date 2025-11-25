namespace FinLightSA.API.Models;

public class UserRegisterRequest
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Password { get; set; }
    public string? BusinessName { get; set; } //optional
}