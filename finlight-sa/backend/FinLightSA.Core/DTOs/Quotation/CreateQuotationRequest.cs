namespace FinLightSA.Core.DTOs.Quotation;

public class CreateQuotationRequest
{
    public Guid CustomerId { get; set; }
    public List<CreateQuotationItemRequest> Items { get; set; } = new();
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
}

