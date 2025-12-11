using FinLightSA.Core.DTOs.Invoice;

namespace FinLightSA.Core.DTOs.OCR;

public class CreateInvoiceFromReceiptRequest
{
    public Guid CustomerId { get; set; }
    public string Vendor { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Date { get; set; } = string.Empty;
    public decimal VatAmount { get; set; }
    public List<ReceiptItemDto> Items { get; set; } = new List<ReceiptItemDto>();
    public string Notes { get; set; } = string.Empty;
}

public class CreateInvoiceFromReceiptResult
{
    public Guid InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Total { get; set; }
}