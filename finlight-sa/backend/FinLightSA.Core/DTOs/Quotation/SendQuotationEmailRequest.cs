namespace FinLightSA.Core.DTOs.Quotation;

public class SendQuotationEmailRequest
{
    public string? ToEmail { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }
}

