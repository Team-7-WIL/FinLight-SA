using FinLightSA.Core.DTOs.Invoice;

namespace FinLightSA.Core.DTOs.OCR;

public class ReceiptProcessingResult
{
    public string Vendor { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Date { get; set; } = string.Empty;
    public decimal VatAmount { get; set; }
    public List<ReceiptItemDto> Items { get; set; } = new List<ReceiptItemDto>();
    public string RawText { get; set; } = string.Empty;
    public decimal Confidence { get; set; }
}

public class ReceiptItemDto
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
}