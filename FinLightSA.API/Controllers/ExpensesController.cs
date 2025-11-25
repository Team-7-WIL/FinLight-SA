using FinLightSA.API.Models.DbModels;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly StorageService _storage;
    private readonly OcrService _ocr;
    private readonly AuditService _audit;

    public ExpensesController(DatabaseService db, StorageService storage, OcrService ocr, AuditService audit)
    {
        _db = db;
        _storage = storage;
        _ocr = ocr;
        _audit = audit;
    }

    [HttpPost("manual")]
    public async Task<IActionResult> AddManual([FromBody] Expense model)
    {
        var userId = User.FindFirst("uid")?.Value;
        model.business_id = await GetUserBusinessIdAsync(userId);
        model.user_id = userId;
        var result = await _db.InsertAsync(model);
        await _audit.LogActionAsync(userId, model.business_id, "CREATE_EXPENSE", "Expenses", result.id);
        return Ok(result);
    }

    [HttpPost("ocr")]
    public async Task<IActionResult> AddFromReceipt(IFormFile receipt)
    {
        var userId = User.FindFirst("uid")?.Value;
        var businessId = await GetUserBusinessIdAsync(userId);

        using var memoryStream = new MemoryStream();
        await receipt.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();
        var text = await _ocr.ExtractTextFromImageAsync(bytes);

        decimal amount = ParseAmount(text);
        DateTime date = ParseDate(text);
        string category = "Uncategorized";

        memoryStream.Position = 0;
        var filePath = $"{businessId}/{receipt.FileName}";
        var uploadUrl = await _storage.UploadFileAsync("receipts", filePath, memoryStream);

        var expense = new Expense
        {
            business_id = businessId,
            user_id = userId,
            category = category,
            amount = amount,
            date = date,
            receipt_url = uploadUrl,
            created_at = DateTime.UtcNow
        };
        var inserted = await _db.InsertAsync(expense);

        await _audit.LogActionAsync(userId, businessId, "CREATE_EXPENSE_OCR", "Expenses", inserted.id);
        return Ok(inserted);
    }

    private decimal ParseAmount(string text) => 0m; // Implement parsing logic
    private DateTime ParseDate(string text) => DateTime.UtcNow; // Implement parsing logic

    private async Task<string?> GetUserBusinessIdAsync(string userId)
    {
        var roles = await _db.QueryEqAsync<UserBusinessRole>("user_id", userId);
        return roles.FirstOrDefault()?.business_id;
    }
}