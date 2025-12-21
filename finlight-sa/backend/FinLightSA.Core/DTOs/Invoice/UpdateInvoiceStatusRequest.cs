using System.ComponentModel.DataAnnotations;

namespace FinLightSA.Core.DTOs.Invoice;

public class UpdateInvoiceStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}

