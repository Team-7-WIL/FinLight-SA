using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.Expense;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Services;
using FinLightSA.Infrastructure.Data;
using FinLightSA.API.Services;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly AIService _aiService;
    private readonly ILogger<ExpensesController> _logger;
    private readonly AuditService _auditService;

    public ExpensesController(
        ApplicationDbContext context,
        AIService aiService,
        ILogger<ExpensesController> logger,
        AuditService auditService)
    {
        _context = context;
        _aiService = aiService;
        _logger = logger;
        _auditService = auditService;
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
    public async Task<ActionResult<ApiResponse<PaginatedResponse<ExpenseDto>>>> GetExpenses(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.Expenses
                .Where(e => e.BusinessId == businessId);

            var totalCount = await query.CountAsync();
            var expenses = await query
                .OrderByDescending(e => e.Date)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new ExpenseDto
                {
                    Id = e.Id,
                    Category = e.Category,
                    Amount = e.Amount,
                    Date = e.Date,
                    Vendor = e.Vendor,
                    Notes = e.Notes,
                    ReceiptUrl = e.ReceiptUrl,
                    IsRecurring = e.IsRecurring,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            var response = new PaginatedResponse<ExpenseDto>
            {
                Items = expenses,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<ExpenseDto>>
            {
                Success = true,
                Message = "Expenses retrieved successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving expenses");
            return StatusCode(500, new ApiResponse<PaginatedResponse<ExpenseDto>>
            {
                Success = false,
                Message = "Error retrieving expenses",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var userId = GetUserId();

            Expense expense;

            // Handle receipt data if provided
            byte[]? receiptData = null;
            string? receiptContentType = null;

            if (!string.IsNullOrEmpty(request.ReceiptData))
            {
                // Handle data URI prefix if present
                string base64Data = request.ReceiptData;
                if (base64Data.Contains(","))
                {
                    base64Data = base64Data.Substring(base64Data.IndexOf(",") + 1);
                }
                
                try
                {
                    receiptData = Convert.FromBase64String(base64Data);
                }
                catch (FormatException)
                {
                    return BadRequest(new ApiResponse<ExpenseDto>
                    {
                        Success = false,
                        Message = "Invalid base64 receipt data format"
                    });
                }
                
                // Determine content type from filename extension
                if (!string.IsNullOrEmpty(request.ReceiptFileName))
                {
                    var extension = Path.GetExtension(request.ReceiptFileName).ToLower();
                    receiptContentType = extension switch
                    {
                        ".png" => "image/png",
                        ".jpg" => "image/jpeg",
                        ".jpeg" => "image/jpeg",
                        ".pdf" => "application/pdf",
                        _ => "application/octet-stream"
                    };
                }
            }

            {
                // Create new expense
                expense = new Expense
                {
                    Id = Guid.NewGuid(),
                    BusinessId = businessId,
                    UserId = userId,
                    Category = request.Category,
                    Amount = request.Amount,
                    Date = request.Date,
                    Vendor = request.Vendor,
                    Notes = request.Notes,
                    ReceiptData = receiptData,
                    ReceiptContentType = receiptContentType,
                    ReceiptFileName = request.ReceiptFileName,
                    IsRecurring = request.IsRecurring,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Expenses.Add(expense);
            }

            await _context.SaveChangesAsync();

            // Log audit action
            await _auditService.LogExpenseCreatedAsync(expense.Id, expense.Amount, expense.Category);

            var expenseDto = new ExpenseDto
            {
                Id = expense.Id,
                Category = expense.Category,
                Amount = expense.Amount,
                Date = expense.Date,
                Vendor = expense.Vendor,
                Notes = expense.Notes,
                ReceiptUrl = expense.ReceiptUrl,
                IsRecurring = expense.IsRecurring,
                CreatedAt = expense.CreatedAt
            };

            return CreatedAtAction(nameof(GetExpenses), new { id = expense.Id }, new ApiResponse<ExpenseDto>
            {
                Success = true,
                Message = "Expense created successfully",
                Data = expenseDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating expense");
            return StatusCode(500, new ApiResponse<ExpenseDto>
            {
                Success = false,
                Message = "Error creating expense",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("upload-receipt")]
    public async Task<ActionResult<ApiResponse<ReceiptUploadResponse>>> UploadReceipt([FromBody] ReceiptUploadRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.File) || string.IsNullOrEmpty(request.FileName))
            {
                return BadRequest(new ApiResponse<ReceiptUploadResponse>
                {
                    Success = false,
                    Message = "No file or file name provided"
                });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var extension = Path.GetExtension(request.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new ApiResponse<ReceiptUploadResponse>
                {
                    Success = false,
                    Message = "Invalid file type. Only JPG, PNG, and PDF files are allowed."
                });
            }

            var businessId = GetBusinessId();
            var userId = GetUserId();

            // Decode base64 image (handle data URI prefix if present)
            string base64Data = request.File;
            if (base64Data.Contains(","))
            {
                // Remove data URI prefix (e.g., "data:image/jpeg;base64,")
                base64Data = base64Data.Substring(base64Data.IndexOf(",") + 1);
            }
            
            byte[] fileBytes;
            try
            {
                fileBytes = Convert.FromBase64String(base64Data);
            }
            catch (FormatException)
            {
                return BadRequest(new ApiResponse<ReceiptUploadResponse>
                {
                    Success = false,
                    Message = "Invalid base64 data format"
                });
            }
            var contentType = extension switch
            {
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };

            // Store file data in SQLite database - create a temporary expense record
            var receiptId = Guid.NewGuid();
            
            // Extract data using OCR if it's an image
            ReceiptExtractedData? extractedData = null;
            if (extension != ".pdf")
            {
                var receiptData = await _aiService.ExtractReceiptDataAsync(fileBytes, request.FileName);
                if (receiptData != null)
                {
                    extractedData = new ReceiptExtractedData
                    {
                        Vendor = receiptData.Vendor,
                        Amount = (decimal)receiptData.Amount,
                        Date = DateTime.TryParse(receiptData.Date, out var parsedDate) ? parsedDate : DateTime.UtcNow,
                        VatAmount = receiptData.VatAmount.HasValue ? (decimal)receiptData.VatAmount.Value : null,
                        Items = receiptData.Items?.Select(item => new ReceiptItem
                        {
                            Description = item.ContainsKey("description") ? item["description"]?.ToString() ?? "" : "",
                            Price = item.ContainsKey("price") ? Convert.ToDecimal(item["price"]) : 0,
                            Quantity = item.ContainsKey("quantity") ? Convert.ToInt32(item["quantity"]) : 1
                        }).ToList() ?? new List<ReceiptItem>()
                    };
                }
            }

            // Store receipt data temporarily for retrieval when creating expense
            // Note: We don't create a temporary expense record to avoid polluting the expenses list

            // Create response with extracted data for expense creation
            var response = new ReceiptUploadResponse
            {
                FileUrl = "", // No file URL since we don't store temporarily
                ReceiptId = Guid.Empty, // No receipt ID since we don't store temporarily
                ExtractedData = extractedData
            };

            return Ok(new ApiResponse<ReceiptUploadResponse>
            {
                Success = true,
                Message = "Receipt processed successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading receipt");
            return StatusCode(500, new ApiResponse<ReceiptUploadResponse>
            {
                Success = false,
                Message = "Error uploading receipt",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> UpdateExpense(Guid id, [FromBody] CreateExpenseRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var expense = await _context.Expenses.Where(e => e.Id == id && e.BusinessId == businessId).FirstOrDefaultAsync();

            if (expense == null)
            {
                return NotFound(new ApiResponse<ExpenseDto>
                {
                    Success = false,
                    Message = "Expense not found"
                });
            }

            expense.Category = request.Category;
            expense.Amount = request.Amount;
            expense.Date = request.Date;
            expense.Vendor = request.Vendor;
            expense.Notes = request.Notes;
            expense.ReceiptUrl = request.ReceiptUrl; // Keep for backward compatibility
            expense.IsRecurring = request.IsRecurring;
            expense.UpdatedAt = DateTime.UtcNow;

            // Handle receipt data if provided
            if (!string.IsNullOrEmpty(request.ReceiptData))
            {
                // Handle data URI prefix if present
                string base64Data = request.ReceiptData;
                if (base64Data.Contains(","))
                {
                    base64Data = base64Data.Substring(base64Data.IndexOf(",") + 1);
                }
                
                try
                {
                    expense.ReceiptData = Convert.FromBase64String(base64Data);
                }
                catch (FormatException)
                {
                    return BadRequest(new ApiResponse<ExpenseDto>
                    {
                        Success = false,
                        Message = "Invalid base64 receipt data format"
                    });
                }
                
                // Determine content type from filename extension
                if (!string.IsNullOrEmpty(request.ReceiptFileName))
                {
                    var extension = Path.GetExtension(request.ReceiptFileName).ToLower();
                    expense.ReceiptContentType = extension switch
                    {
                        ".png" => "image/png",
                        ".jpg" => "image/jpeg",
                        ".jpeg" => "image/jpeg",
                        ".pdf" => "application/pdf",
                        _ => "application/octet-stream"
                    };
                }
                expense.ReceiptFileName = request.ReceiptFileName;
            }

            _context.Expenses.Update(expense);
            await _context.SaveChangesAsync();

            // Log audit action
            await _auditService.LogExpenseUpdatedAsync(expense.Id, expense.Amount, expense.Category);

            var expenseDto = new ExpenseDto
            {
                Id = expense.Id,
                Category = expense.Category,
                Amount = expense.Amount,
                Date = expense.Date,
                Vendor = expense.Vendor,
                Notes = expense.Notes,
                ReceiptUrl = expense.ReceiptUrl,
                IsRecurring = expense.IsRecurring,
                CreatedAt = expense.CreatedAt
            };

            return Ok(new ApiResponse<ExpenseDto>
            {
                Success = true,
                Message = "Expense updated successfully",
                Data = expenseDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating expense");
            return StatusCode(500, new ApiResponse<ExpenseDto>
            {
                Success = false,
                Message = "Error updating expense",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteExpense(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var expense = await _context.Expenses.Where(e => e.Id == id && e.BusinessId == businessId).FirstOrDefaultAsync();

            if (expense == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Expense not found"
                });
            }

            // Receipt data is stored in SQLite, no need to delete from external storage

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            // Log audit action
            await _auditService.LogExpenseDeletedAsync(expense.Id);

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Expense deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting expense");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Error deleting expense",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("receipts/{id}")]
    public async Task<IActionResult> GetReceipt(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var expense = await _context.Expenses
                .FirstOrDefaultAsync(e => e.Id == id && e.BusinessId == businessId);

            if (expense == null || expense.ReceiptData == null)
            {
                return NotFound();
            }

            return File(expense.ReceiptData, expense.ReceiptContentType ?? "application/octet-stream", 
                expense.ReceiptFileName ?? "receipt");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving receipt");
            return StatusCode(500);
        }
    }
}