namespace FinLightSA.Core.Models;

public class UserBusinessRole
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid BusinessId { get; set; }
    public string Role { get; set; } = "Staff"; // Owner, Admin, Staff, Accountant
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Business Business { get; set; } = null!;
}