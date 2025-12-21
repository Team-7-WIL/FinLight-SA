namespace FinLightSA.Core.DTOs.Invoice;

public class CreateInvoiceRequest
{
    public Guid CustomerId { get; set; }
    public List<CreateInvoiceItemRequest> Items { get; set; } = new();
    public DateTime? IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Notes { get; set; }
}