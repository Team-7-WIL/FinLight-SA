using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;
using FinLightSA.Infrastructure.Services;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/ai")]
public class AiCategorizationController : ControllerBase
{
    private readonly AIService _aiService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AiCategorizationController> _logger;

    public AiCategorizationController(
        AIService aiService,
        ApplicationDbContext context,
        ILogger<AiCategorizationController> logger)
    {
        _aiService = aiService;
        _context = context;
        _logger = logger;
    }

    private Guid GetBusinessId()
    {
        var businessIdClaim = User.FindFirst("BusinessId")?.Value;
        return Guid.Parse(businessIdClaim!);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    [HttpGet("health")]
    public async Task<ActionResult<ApiResponse<AIServiceHealth>>> GetHealth()
    {
        try
        {
            var health = await _aiService.GetHealthAsync();
            if (health == null)
            {
                return StatusCode(503, new ApiResponse<AIServiceHealth>
                {
                    Success = false,
                    Message = "AI service is not available"
                });
            }

            return Ok(new ApiResponse<AIServiceHealth>
            {
                Success = true,
                Message = "AI service health check completed",
                Data = health
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking AI service health");
            return StatusCode(500, new ApiResponse<AIServiceHealth>
            {
                Success = false,
                Message = "Error checking AI service health",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("categorize")]
    public async Task<ActionResult<ApiResponse<CategoryPredictionResponse>>> CategorizeTransaction(
        [FromBody] TransactionCategorizationRequest request)
    {
        try
        {
            var result = await _aiService.CategorizeTransactionAsync(request);
            if (result == null)
            {
                return StatusCode(503, new ApiResponse<CategoryPredictionResponse>
                {
                    Success = false,
                    Message = "AI categorization service is not available"
                });
            }

            return Ok(new ApiResponse<CategoryPredictionResponse>
            {
                Success = true,
                Message = "Transaction categorized successfully",
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error categorizing transaction");
            return StatusCode(500, new ApiResponse<CategoryPredictionResponse>
            {
                Success = false,
                Message = "Error categorizing transaction",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("categorize/batch")]
    public async Task<ActionResult<ApiResponse<List<TransactionWithPrediction>>>> CategorizeTransactionsBatch(
        [FromBody] List<TransactionCategorizationRequest> requests)
    {
        try
        {
            var results = await _aiService.CategorizeTransactionsBatchAsync(requests);
            if (results == null)
            {
                return StatusCode(503, new ApiResponse<List<TransactionWithPrediction>>
                {
                    Success = false,
                    Message = "AI batch categorization service is not available"
                });
            }

            return Ok(new ApiResponse<List<TransactionWithPrediction>>
            {
                Success = true,
                Message = "Transactions categorized successfully",
                Data = results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error batch categorizing transactions");
            return StatusCode(500, new ApiResponse<List<TransactionWithPrediction>>
            {
                Success = false,
                Message = "Error batch categorizing transactions",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("ocr/receipt")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<ReceiptData>>> ExtractReceiptData(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<ReceiptData>
                {
                    Success = false,
                    Message = "No file provided"
                });
            }

            // Validate file type
            var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedContentTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest(new ApiResponse<ReceiptData>
                {
                    Success = false,
                    Message = "Invalid file type. Only image files are allowed."
                });
            }

            using var stream = file.OpenReadStream();
            var fileBytes = new byte[file.Length];
            await stream.ReadAsync(fileBytes);

            var result = await _aiService.ExtractReceiptDataAsync(fileBytes, file.FileName);
            if (result == null)
            {
                return StatusCode(503, new ApiResponse<ReceiptData>
                {
                    Success = false,
                    Message = "OCR service is not available"
                });
            }

            // Create audit log
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = GetUserId(),
                BusinessId = GetBusinessId(),
                Action = "ReceiptOCR",
                Module = "AI",
                Details = $"Processed receipt: {file.FileName}",
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<ReceiptData>
            {
                Success = true,
                Message = "Receipt data extracted successfully",
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting receipt data");
            return StatusCode(500, new ApiResponse<ReceiptData>
            {
                Success = false,
                Message = "Error extracting receipt data",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("feedback")]
    public async Task<ActionResult<ApiResponse<bool>>> SubmitFeedback(
        [FromBody] FeedbackRequest request)
    {
        try
        {
            var success = await _aiService.SubmitFeedbackAsync(
                request.Description,
                request.PredictedCategory,
                request.CorrectCategory,
                request.Amount);

            if (success)
            {
                // Create audit log
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = GetUserId(),
                    BusinessId = GetBusinessId(),
                    Action = "AIFeedback",
                    Module = "AI",
                    Details = $"Feedback submitted for category correction: {request.PredictedCategory} -> {request.CorrectCategory}",
                    Timestamp = DateTime.UtcNow
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = success ? "Feedback submitted successfully" : "Feedback submission failed",
                Data = success
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting AI feedback");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Error submitting AI feedback",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("train")]
    public ActionResult<ApiResponse<bool>> RetrainModel()
    {
        try
        {
            // Note: The AI service doesn't currently expose a retrain endpoint
            // This would need to be implemented in the AI service first
            return StatusCode(501, new ApiResponse<bool>
            {
                Success = false,
                Message = "Model retraining not yet implemented"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retraining AI model");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Error retraining AI model",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}

// Additional DTOs
public class FeedbackRequest
{
    public string Description { get; set; } = string.Empty;
    public string PredictedCategory { get; set; } = string.Empty;
    public string CorrectCategory { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
