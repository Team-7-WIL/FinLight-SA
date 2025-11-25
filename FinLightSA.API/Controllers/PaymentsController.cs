using FinLightSA.API.Models;
using FinLightSA.API.Models.DbModels;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly AuditService _audit;

    public PaymentsController(DatabaseService db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpPost]
    public async Task<IActionResult> Record([FromBody] RecordPaymentRequest request)
    {
        var userId = User.FindFirst("uid")?.Value;
        var businessId = await GetUserBusinessIdAsync(userId);

        var payment = new Payment
        {
            business_id = businessId,
            customer_id = request.CustomerId,
            amount = request.Amount,
            payment_method = request.PaymentMethod,
            payment_date = request.PaymentDate ?? DateTime.UtcNow,
            reference = request.Reference
        };
        var insertedPayment = await _db.InsertAsync(payment);

        foreach (var alloc in request.Allocations)
        {
            alloc.payment_id = insertedPayment.id;
            await _db.InsertAsync(alloc);
        }

        await _audit.LogActionAsync(userId, businessId, "RECORD_PAYMENT", "Payments", insertedPayment.id);
        return Ok(insertedPayment);
    }

    private async Task<string?> GetUserBusinessIdAsync(string userId)
    {
        var roles = await _db.QueryEqAsync<UserBusinessRole>("user_id", userId);
        return roles.FirstOrDefault()?.business_id;
    }
}