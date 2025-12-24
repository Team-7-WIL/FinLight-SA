namespace FinLightSA.Core.DTOs.Invoice;

public class InvoiceTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TemplateData { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateInvoiceTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TemplateData { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class UpdateInvoiceTemplateRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? TemplateData { get; set; }
    public bool? IsDefault { get; set; }
}
