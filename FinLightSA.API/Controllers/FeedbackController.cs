using FinLightSA.API.Models.DbModels;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly AuditService _audit;

    public FeedbackController(DatabaseService db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] AiFeedback model)
    {
        var userId = User.FindFirst("uid")?.Value;
        model.submitted_at = DateTime.UtcNow;

        var txnList = await _db.QueryEqAsync<BankTransaction>("id", model.transaction_id);
        var txn = txnList.FirstOrDefault();
        if (txn != null)
        {
            txn.feedback_category = model.correct_category;
            await _db.UpdateAsync(txn);
        }

        var inserted = await _db.InsertAsync(model);

        var businessId = "";
        if (txn != null)
        {
            var statementList = await _db.QueryEqAsync<BankStatement>("id", txn.bank_statement_id);
            businessId = statementList.FirstOrDefault()?.business_id ?? string.Empty;
        }

        await _audit.LogActionAsync(userId, businessId, "SUBMIT_FEEDBACK", "AI", inserted.id);
        return Ok(inserted);
    }
}