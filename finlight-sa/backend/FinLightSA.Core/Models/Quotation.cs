namespace FinLightSA.Core.Models;

public class Quotation
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid CustomerId { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft"; // Draft, Sent, Accepted, Rejected, Expired, Converted
    public decimal Subtotal { get; set; }
    public decimal VatAmount { get; set; }
    public decimal Total { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
    public Guid? ConvertedToInvoiceId { get; set; } // Reference to invoice if converted
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Business Business { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public ICollection<QuotationItem> Items { get; set; } = new List<QuotationItem>();
    public Invoice? ConvertedToInvoice { get; set; }
}

