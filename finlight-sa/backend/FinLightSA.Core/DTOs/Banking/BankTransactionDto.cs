namespace FinLightSA.Core.DTOs.Banking;

public class BankTransactionDto
{
    public Guid Id { get; set; }
    public DateTime TxnDate { get; set; }
    public decimal Amount { get; set; }
    public string Direction { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Reference { get; set; }
    public string? AiCategory { get; set; }
    public decimal? ConfidenceScore { get; set; }
}