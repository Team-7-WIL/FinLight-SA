using FinLightSA.Core.DTOs.Invoice;

namespace FinLightSA.Core.DTOs.Quotation;

public class QuotationDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public CustomerSummaryDto Customer { get; set; } = null!;
    public List<QuotationItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal VatAmount { get; set; }
    public decimal Total { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
    public Guid? ConvertedToInvoiceId { get; set; }
    public DateTime CreatedAt { get; set; }
}

