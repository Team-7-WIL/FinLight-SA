namespace FinLightSA.Core.DTOs.Invoice;

public class CreateInvoiceItemRequest
{
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal VatRate { get; set; } = 0.15m;
}