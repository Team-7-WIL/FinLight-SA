namespace FinLightSA.Core.Models;

public class BankTransaction
{
    public Guid Id { get; set; }
    public Guid BankStatementId { get; set; }
    public DateTime TxnDate { get; set; }
    public decimal Amount { get; set; }
    public string Direction { get; set; } = "Debit"; // Debit, Credit
    public string Description { get; set; } = string.Empty;
    public string? Reference { get; set; }
    public string? AiCategory { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public string? FeedbackCategory { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public BankStatement BankStatement { get; set; } = null!;
}