using Microsoft.AspNetCore.Http;

namespace FinLightSA.Core.DTOs.OCR;

public class InvoiceUploadRequest
{
    public IFormFile Image { get; set; } = null!;
    public bool AutoProcess { get; set; } = true;
}