using FinLightSA.Core.DTOs.Invoice;

namespace FinLightSA.Core.DTOs.OCR;

public class InvoiceProcessingResult
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Vendor { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Date { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public decimal VatAmount { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new List<InvoiceItemDto>();
    public string RawText { get; set; } = string.Empty;
    public decimal Confidence { get; set; }
}