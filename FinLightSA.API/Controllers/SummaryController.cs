using FinLightSA.API.Models.DbModels;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SummaryController : ControllerBase
{
    private readonly DatabaseService _db;

    public SummaryController(DatabaseService db) => _db = db;

    [HttpGet("financial")]
    public async Task<IActionResult> GetFinancialSummary()
    {
        var userId = User.FindFirst("uid")?.Value;
        var businessId = await GetUserBusinessIdAsync(userId);

        var income = await _db.GetTotalIncomeAsync(businessId ?? string.Empty);
        var expenses = await _db.GetTotalExpensesAsync(businessId ?? string.Empty);
        var netCashFlow = income - expenses;

        return Ok(new { Income = income, Expenses = expenses, NetCashFlow = netCashFlow });
    }

    private async Task<string?> GetUserBusinessIdAsync(string? userId)
    {
        if (userId == null) return null;
        var roles = await _db.QueryEqAsync<UserBusinessRole>("user_id", userId);
        return roles.FirstOrDefault()?.business_id;
    }
}