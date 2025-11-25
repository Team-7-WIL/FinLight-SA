using FinLightSA.API.Models;
using FinLightSA.API.Models.DbModels;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly AuditService _audit;

    public InvoicesController(DatabaseService db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request)
    {
        var userId = User.FindFirst("uid")?.Value;
        var businessId = await GetUserBusinessIdAsync(userId);

        var invoice = new Invoice
        {
            business_id = businessId,
            customer_id = request.CustomerId,
            number = request.Number,
            status = "Draft",
            subtotal = request.Items.Sum(i => i.line_total ?? 0),
            total = request.Items.Sum(i => i.line_total ?? 0),
            due_date = request.DueDate,
            created_at = DateTime.UtcNow
        };
        var insertedInvoice = await _db.InsertAsync(invoice);

        foreach (var item in request.Items)
        {
            item.invoice_id = insertedInvoice.id;
            await _db.InsertAsync(item);
        }

        await _audit.LogActionAsync(userId, businessId, "CREATE_INVOICE", "Invoices", insertedInvoice.id);
        return Ok(insertedInvoice);
    }

    private async Task<string?> GetUserBusinessIdAsync(string userId)
    {
        var roles = await _db.QueryEqAsync<UserBusinessRole>("user_id", userId);
        return roles.FirstOrDefault()?.business_id;
    }
}