namespace FinLightSA.Core.Models;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<UserBusinessRole> BusinessRoles { get; set; } = new List<UserBusinessRole>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}