namespace FinLightSA.Core.Models;

public class Expense
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid UserId { get; set; }
    public string Category { get; set; } = "Other";
    public decimal Amount { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? Vendor { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptUrl { get; set; } // Keep for backward compatibility
    public byte[]? ReceiptData { get; set; } // Store file data in SQLite
    public string? ReceiptContentType { get; set; } // Store content type (e.g., image/jpeg, image/png)
    public string? ReceiptFileName { get; set; } // Store original filename
    public bool IsRecurring { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Business Business { get; set; } = null!;
    public User User { get; set; } = null!;
}
