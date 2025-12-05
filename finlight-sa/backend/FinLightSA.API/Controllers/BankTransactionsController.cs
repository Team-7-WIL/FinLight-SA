using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.Banking;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;
using FinLightSA.Infrastructure.Services;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BankTransactionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly AIService _aiService;
    private readonly ILogger<BankTransactionsController> _logger;

    public BankTransactionsController(
        ApplicationDbContext context,
        AIService aiService,
        ILogger<BankTransactionsController> logger)
    {
        _context = context;
        _aiService = aiService;
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

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<BankTransactionDto>>>> GetBankTransactions(
        [FromQuery] Guid? bankStatementId = null,
        [FromQuery] string? category = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.BankTransactions
                .Include(bt => bt.BankStatement)
                .Where(bt => bt.BankStatement.BusinessId == businessId);

            if (bankStatementId.HasValue)
            {
                query = query.Where(bt => bt.BankStatementId == bankStatementId.Value);
            }

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(bt => bt.AiCategory == category);
            }

            if (startDate.HasValue)
            {
                query = query.Where(bt => bt.TxnDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(bt => bt.TxnDate <= endDate.Value);
            }

            var totalCount = await query.CountAsync();
            var transactions = await query
                .OrderByDescending(bt => bt.TxnDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(bt => new BankTransactionDto
                {
                    Id = bt.Id,
                    TxnDate = bt.TxnDate,
                    Amount = bt.Amount,
                    Direction = bt.Direction,
                    Description = bt.Description,
                    Reference = bt.Reference,
                    AiCategory = bt.AiCategory,
                    ConfidenceScore = bt.ConfidenceScore
                })
                .ToListAsync();

            var response = new PaginatedResponse<BankTransactionDto>
            {
                Items = transactions,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<BankTransactionDto>>
            {
                Success = true,
                Message = "Bank transactions retrieved successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving bank transactions");
            return StatusCode(500, new ApiResponse<PaginatedResponse<BankTransactionDto>>
            {
                Success = false,
                Message = "Error retrieving bank transactions",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("{id}/categorize")]
    public async Task<ActionResult<ApiResponse<BankTransactionDto>>> CategorizeTransaction(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var transaction = await _context.BankTransactions
                .Include(bt => bt.BankStatement)
                .FirstOrDefaultAsync(bt => bt.Id == id && bt.BankStatement.BusinessId == businessId);

            if (transaction == null)
            {
                return NotFound(new ApiResponse<BankTransactionDto>
                {
                    Success = false,
                    Message = "Transaction not found"
                });
            }

            var categorizationRequest = new TransactionCategorizationRequest
            {
                Description = transaction.Description,
                Amount = transaction.Amount,
                Direction = transaction.Direction
            };

            var prediction = await _aiService.CategorizeTransactionAsync(categorizationRequest);

            if (prediction != null)
            {
                transaction.AiCategory = prediction.Category;
                transaction.ConfidenceScore = (decimal)prediction.Confidence;
                await _context.SaveChangesAsync();
            }

            var transactionDto = new BankTransactionDto
            {
                Id = transaction.Id,
                TxnDate = transaction.TxnDate,
                Amount = transaction.Amount,
                Direction = transaction.Direction,
                Description = transaction.Description,
                Reference = transaction.Reference,
                AiCategory = transaction.AiCategory,
                ConfidenceScore = transaction.ConfidenceScore
            };

            return Ok(new ApiResponse<BankTransactionDto>
            {
                Success = true,
                Message = "Transaction categorized successfully",
                Data = transactionDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error categorizing transaction");
            return StatusCode(500, new ApiResponse<BankTransactionDto>
            {
                Success = false,
                Message = "Error categorizing transaction",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("categorize-batch")]
    public async Task<ActionResult<ApiResponse<List<BankTransactionDto>>>> CategorizeTransactionsBatch(
        [FromBody] List<Guid> transactionIds)
    {
        try
        {
            var businessId = GetBusinessId();
            var transactions = await _context.BankTransactions
                .Include(bt => bt.BankStatement)
                .Where(bt => transactionIds.Contains(bt.Id) && bt.BankStatement.BusinessId == businessId)
                .ToListAsync();

            if (!transactions.Any())
            {
                return NotFound(new ApiResponse<List<BankTransactionDto>>
                {
                    Success = false,
                    Message = "No transactions found"
                });
            }

            var categorizationRequests = transactions.Select(t => new TransactionCategorizationRequest
            {
                Description = t.Description,
                Amount = t.Amount,
                Direction = t.Direction
            }).ToList();

            var predictions = await _aiService.CategorizeTransactionsBatchAsync(categorizationRequests);

            if (predictions != null && predictions.Count == transactions.Count)
            {
                for (int i = 0; i < transactions.Count; i++)
                {
                    transactions[i].AiCategory = predictions[i].PredictedCategory;
                    transactions[i].ConfidenceScore = (decimal)predictions[i].Confidence;
                }
                await _context.SaveChangesAsync();
            }

            var transactionDtos = transactions.Select(t => new BankTransactionDto
            {
                Id = t.Id,
                TxnDate = t.TxnDate,
                Amount = t.Amount,
                Direction = t.Direction,
                Description = t.Description,
                Reference = t.Reference,
                AiCategory = t.AiCategory,
                ConfidenceScore = t.ConfidenceScore
            }).ToList();

            return Ok(new ApiResponse<List<BankTransactionDto>>
            {
                Success = true,
                Message = "Transactions categorized successfully",
                Data = transactionDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error categorizing transactions batch");
            return StatusCode(500, new ApiResponse<List<BankTransactionDto>>
            {
                Success = false,
                Message = "Error categorizing transactions batch",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("{id}/feedback")]
    public async Task<ActionResult<ApiResponse<bool>>> SubmitFeedback(
        Guid id,
        [FromBody] TransactionFeedbackRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var transaction = await _context.BankTransactions
                .Include(bt => bt.BankStatement)
                .FirstOrDefaultAsync(bt => bt.Id == id && bt.BankStatement.BusinessId == businessId);

            if (transaction == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Transaction not found"
                });
            }

            // Submit feedback to AI service
            var success = await _aiService.SubmitFeedbackAsync(
                transaction.Description,
                transaction.AiCategory ?? "Unknown",
                request.CorrectCategory,
                transaction.Amount);

            if (success)
            {
                // Update transaction with user feedback
                transaction.FeedbackCategory = request.CorrectCategory;
                await _context.SaveChangesAsync();

                // Create audit log
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = GetUserId(),
                    BusinessId = businessId,
                    Action = "TransactionFeedback",
                    Module = "BankTransactions",
                    RecordId = id,
                    Details = $"User corrected category from '{transaction.AiCategory}' to '{request.CorrectCategory}'",
                    Timestamp = DateTime.UtcNow
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Feedback submitted successfully",
                Data = success
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Error submitting feedback",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<BankTransactionDto>>> UpdateTransaction(
        Guid id,
        [FromBody] UpdateBankTransactionRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var transaction = await _context.BankTransactions
                .Include(bt => bt.BankStatement)
                .FirstOrDefaultAsync(bt => bt.Id == id && bt.BankStatement.BusinessId == businessId);

            if (transaction == null)
            {
                return NotFound(new ApiResponse<BankTransactionDto>
                {
                    Success = false,
                    Message = "Transaction not found"
                });
            }

            // Update allowed fields
            if (!string.IsNullOrEmpty(request.Description))
                transaction.Description = request.Description;

            if (!string.IsNullOrEmpty(request.Reference))
                transaction.Reference = request.Reference;

            await _context.SaveChangesAsync();

            var transactionDto = new BankTransactionDto
            {
                Id = transaction.Id,
                TxnDate = transaction.TxnDate,
                Amount = transaction.Amount,
                Direction = transaction.Direction,
                Description = transaction.Description,
                Reference = transaction.Reference,
                AiCategory = transaction.AiCategory,
                ConfidenceScore = transaction.ConfidenceScore
            };

            return Ok(new ApiResponse<BankTransactionDto>
            {
                Success = true,
                Message = "Transaction updated successfully",
                Data = transactionDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating transaction");
            return StatusCode(500, new ApiResponse<BankTransactionDto>
            {
                Success = false,
                Message = "Error updating transaction",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}

// Additional DTOs for this controller
public class TransactionFeedbackRequest
{
    public string CorrectCategory { get; set; } = string.Empty;
}

public class UpdateBankTransactionRequest
{
    public string? Description { get; set; }
    public string? Reference { get; set; }
}
