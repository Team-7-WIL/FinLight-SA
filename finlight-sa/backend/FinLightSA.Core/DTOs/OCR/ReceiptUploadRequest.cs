using Microsoft.AspNetCore.Http;

namespace FinLightSA.Core.DTOs.OCR;

public class ReceiptUploadRequest
{
    public IFormFile Image { get; set; } = null!;
    public bool AutoCategorize { get; set; } = true;
}