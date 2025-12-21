namespace FinLightSA.Core.DTOs.Banking;

public class BankStatementDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public DateTime UploadDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TransactionCount { get; set; }
}
