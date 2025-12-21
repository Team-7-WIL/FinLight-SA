namespace FinLightSA.Core.DTOs.Expense;

public class CreateExpenseRequest
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Vendor { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptUrl { get; set; } // Keep for backward compatibility
    public string? ReceiptData { get; set; } // Base64 encoded receipt data
    public string? ReceiptFileName { get; set; } // Receipt filename
    public Guid? ReceiptId { get; set; } // Receipt ID from upload
    public bool IsRecurring { get; set; } = false;
}