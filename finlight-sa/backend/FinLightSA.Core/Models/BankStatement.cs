namespace FinLightSA.Core.Models;

public class BankStatement
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public Guid UploadedBy { get; set; }
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;
    public string? FileUrl { get; set; } // Keep for backward compatibility
    public byte[]? FileData { get; set; } // Store file data in SQLite
    public string? ContentType { get; set; } // Store content type (e.g., application/pdf, text/csv)
    public string Status { get; set; } = "Pending"; // Pending, Processing, Completed, Failed

    public Business Business { get; set; } = null!;
    public ICollection<BankTransaction> Transactions { get; set; } = new List<BankTransaction>();
}