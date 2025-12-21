namespace FinLightSA.Core.DTOs.Expense;

public class ExpenseDto
{
    public Guid Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Vendor { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptUrl { get; set; }
    public bool IsRecurring { get; set; }
    public DateTime CreatedAt { get; set; }
}