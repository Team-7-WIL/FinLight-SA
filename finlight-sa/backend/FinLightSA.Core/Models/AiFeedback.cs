namespace FinLightSA.Core.Models;

public class AiFeedback
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string PredictedCategory { get; set; } = string.Empty;
    public string CorrectCategory { get; set; } = string.Empty;
    public decimal ConfidenceScore { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}