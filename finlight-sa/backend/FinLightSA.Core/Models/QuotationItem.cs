namespace FinLightSA.Core.Models;

public class QuotationItem
{
    public Guid Id { get; set; }
    public Guid QuotationId { get; set; }
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal VatRate { get; set; } = 0.15m; // Default 15% VAT
    public decimal LineTotal { get; set; }

    public Quotation Quotation { get; set; } = null!;
    public Product? Product { get; set; }
}

