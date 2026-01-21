namespace FinLightSA.Core.DTOs.Quotation;

public class ConvertQuotationToInvoiceRequest
{
    public DateTime? IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Notes { get; set; }
}

