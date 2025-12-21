using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.OCR;
using FinLightSA.API.Services;
using Google;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OcrController : ControllerBase
{
    private readonly OcrProcessingService _ocrService;
    private readonly ILogger<OcrController> _logger;

    public OcrController(OcrProcessingService ocrService, ILogger<OcrController> logger)
    {
        _ocrService = ocrService;
        _logger = logger;
    }

    private Guid GetBusinessId()
    {
        var businessIdClaim = User.FindFirst("BusinessId")?.Value;
        return Guid.Parse(businessIdClaim!);
    }

    [HttpPost("process-receipt")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<ReceiptProcessingResult>>> ProcessReceipt([FromForm] ReceiptUploadRequest request)
    {
        try
        {
            if (request.Image == null || request.Image.Length == 0)
            {
                return BadRequest(new ApiResponse<ReceiptProcessingResult>
                {
                    Success = false,
                    Message = "No image file provided",
                    Errors = new List<string> { "Image file is required" }
                });
            }

            using var stream = request.Image.OpenReadStream();
            var imageBytes = new byte[request.Image.Length];
            await stream.ReadAsync(imageBytes, 0, imageBytes.Length);

            var result = await _ocrService.ProcessReceiptImageAsync(imageBytes, GetBusinessId());

            return Ok(new ApiResponse<ReceiptProcessingResult>
            {
                Success = true,
                Message = "Receipt processed successfully",
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing receipt");
            return StatusCode(500, new ApiResponse<ReceiptProcessingResult>
            {
                Success = false,
                Message = "Error processing receipt",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("process-invoice")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<InvoiceProcessingResult>>> ProcessInvoice([FromForm] InvoiceUploadRequest request)
    {
        try
        {
            if (request.Image == null || request.Image.Length == 0)
            {
                return BadRequest(new ApiResponse<InvoiceProcessingResult>
                {
                    Success = false,
                    Message = "No image file provided",
                    Errors = new List<string> { "Image file is required" }
                });
            }

            using var stream = request.Image.OpenReadStream();
            var imageBytes = new byte[request.Image.Length];
            await stream.ReadAsync(imageBytes, 0, imageBytes.Length);

            var result = await _ocrService.ProcessInvoiceImageAsync(imageBytes, GetBusinessId());

            return Ok(new ApiResponse<InvoiceProcessingResult>
            {
                Success = true,
                Message = "Invoice processed successfully",
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing invoice");
            return StatusCode(500, new ApiResponse<InvoiceProcessingResult>
            {
                Success = false,
                Message = "Error processing invoice",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("create-invoice-from-receipt")]
    public async Task<ActionResult<ApiResponse<CreateInvoiceFromReceiptResult>>> CreateInvoiceFromReceipt([FromBody] CreateInvoiceFromReceiptRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var result = await _ocrService.CreateInvoiceFromReceiptAsync(request, businessId);

            return Ok(new ApiResponse<CreateInvoiceFromReceiptResult>
            {
                Success = true,
                Message = "Invoice created from receipt successfully",
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice from receipt");
            return StatusCode(500, new ApiResponse<CreateInvoiceFromReceiptResult>
            {
                Success = false,
                Message = "Error creating invoice from receipt",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}