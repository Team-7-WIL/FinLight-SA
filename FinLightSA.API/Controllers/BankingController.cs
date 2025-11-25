using FinLightSA.API.Models.DbModels;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BankingController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly StorageService _storage;
    private readonly AiService _ai;
    private readonly BankService _bank;
    private readonly AuditService _audit;

    public BankingController(DatabaseService db, StorageService storage, AiService ai, BankService bank, AuditService audit)
    {
        _db = db;
        _storage = storage;
        _ai = ai;
        _bank = bank;
        _audit = audit;
    }

    [HttpPost("upload-statement")]
    public async Task<IActionResult> UploadStatement(IFormFile file)
    {
        var userId = User.FindFirst("uid")?.Value;
        var businessId = await GetUserBusinessIdAsync(userId);

        using var stream = file.OpenReadStream();
        var filePath = $"{businessId}/{file.FileName}";
        var uploadUrl = await _storage.UploadFileAsync("bank-statements", filePath, stream);

        var statement = new BankStatement
        {
            business_id = businessId,
            file_name = file.FileName,
            uploaded_by = userId,
            upload_date = DateTime.UtcNow,
            file_url = uploadUrl
        };
        var inserted = await _db.InsertAsync(statement);

        var transactionsJson = await _bank.ImportTransactionsAsync("access_token");
        var parsedTransactions = JsonSerializer.Deserialize<List<BankTransaction>>(transactionsJson) ?? new List<BankTransaction>();

        foreach (var txn in parsedTransactions)
        {
            txn.bank_statement_id = inserted.id;
            var (category, confidence) = await _ai.CategorizeTransactionAsync(txn.description ?? string.Empty);
            txn.ai_category = category;
            txn.confidence_score = confidence;
            await _db.InsertAsync(txn);
        }

        await _audit.LogActionAsync(userId, businessId, "UPLOAD_STATEMENT", "Banking", inserted.id);
        return Ok(inserted);
    }

    [HttpPost("analyze-transactions/{statementId}")]
    public async Task<IActionResult> AnalyzeTransactions(string statementId)
    {
        var userId = User.FindFirst("uid")?.Value;
        var transactions = await _db.QueryEqAsync<BankTransaction>("bank_statement_id", statementId);

        var statementList = await _db.QueryEqAsync<BankStatement>("id", statementId);
        var businessId = statementList.FirstOrDefault()?.business_id ?? string.Empty;

        foreach (var txn in transactions)
        {
            if (string.IsNullOrEmpty(txn.ai_category))
            {
                var (category, confidence) = await _ai.CategorizeTransactionAsync(txn.description ?? string.Empty);
                txn.ai_category = category;
                txn.confidence_score = confidence;
                await _db.UpdateAsync(txn);
            }
        }

        await _audit.LogActionAsync(userId, businessId, "ANALYZE_TRANSACTIONS", "Banking", statementId);
        return Ok(transactions);
    }

    private async Task<string?> GetUserBusinessIdAsync(string userId)
    {
        var roles = await _db.QueryEqAsync<UserBusinessRole>("user_id", userId);
        return roles.FirstOrDefault()?.business_id;
    }
}