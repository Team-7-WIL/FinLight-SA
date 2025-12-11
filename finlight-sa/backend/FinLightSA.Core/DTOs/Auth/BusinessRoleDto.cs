namespace FinLightSA.Core.DTOs.Auth;

public class BusinessRoleDto
{
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}