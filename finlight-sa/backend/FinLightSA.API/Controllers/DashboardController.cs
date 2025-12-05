using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.Dashboard;
using FinLightSA.Infrastructure.Data;
using System.Security.Claims;
using Google;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(ApplicationDbContext context, ILogger<DashboardController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private Guid GetBusinessId()
    {
        var businessIdClaim = User.FindFirst("BusinessId")?.Value;
        return Guid.Parse(businessIdClaim!);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        try
        {
            var businessId = GetBusinessId();
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            // Calculate total income from paid invoices
            var totalIncome = await _context.Invoices
                .Where(i => i.BusinessId == businessId && i.Status == "Paid" && i.IssueDate >= start && i.IssueDate <= end)
                .SumAsync(i => (double)i.Total);

            // Calculate total expenses
            var totalExpenses = await _context.Expenses
                .Where(e => e.BusinessId == businessId && e.Date >= start && e.Date <= end)
                .SumAsync(e => (double)e.Amount);

            // Count pending and overdue invoices
            var pendingInvoices = await _context.Invoices
                .CountAsync(i => i.BusinessId == businessId && i.Status == "Sent");

            var overdueInvoices = await _context.Invoices
                .CountAsync(i => i.BusinessId == businessId && i.Status == "Overdue");

            // Top expense categories
            var topCategories = await _context.Expenses
                .Where(e => e.BusinessId == businessId && e.Date >= start && e.Date <= end)
                .GroupBy(e => e.Category)
                .Select(g => new CategoryExpenseDto
                {
                    Category = g.Key,
                    Amount = (decimal)g.Sum(e => (double)e.Amount),
                    Count = g.Count()
                })
                .ToListAsync();

            // Order by amount in memory since SQLite doesn't support decimal ordering
            topCategories = topCategories
                .OrderByDescending(c => c.Amount)
                .Take(5)
                .ToList();

            // Monthly trends (last 6 months)
            var monthlyTrends = new List<MonthlyTrendDto>();
            for (int i = 5; i >= 0; i--)
            {
                var monthStart = DateTime.UtcNow.AddMonths(-i).Date.AddDays(1 - DateTime.UtcNow.Day);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                var monthIncome = await _context.Invoices
                    .Where(inv => inv.BusinessId == businessId && inv.Status == "Paid" && inv.IssueDate >= monthStart && inv.IssueDate <= monthEnd)
                    .SumAsync(inv => (double)inv.Total);

                var monthExpenses = await _context.Expenses
                    .Where(exp => exp.BusinessId == businessId && exp.Date >= monthStart && exp.Date <= monthEnd)
                    .SumAsync(exp => (double)exp.Amount);

                monthlyTrends.Add(new MonthlyTrendDto
                {
                    Month = monthStart.ToString("MMM yyyy"),
                    Income = (decimal)monthIncome,
                    Expenses = (decimal)monthExpenses,
                    NetFlow = (decimal)monthIncome - (decimal)monthExpenses
                });
            }

            var summary = new DashboardSummaryDto
            {
                TotalIncome = (decimal)totalIncome,
                TotalExpenses = (decimal)totalExpenses,
                NetCashFlow = (decimal)totalIncome - (decimal)totalExpenses,
                PendingInvoices = pendingInvoices,
                OverdueInvoices = overdueInvoices,
                TopExpenseCategories = topCategories,
                MonthlyTrends = monthlyTrends
            };

            return Ok(new ApiResponse<DashboardSummaryDto>
            {
                Success = true,
                Message = "Dashboard summary retrieved successfully",
                Data = summary
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard summary");
            return StatusCode(500, new ApiResponse<DashboardSummaryDto>
            {
                Success = false,
                Message = "Error retrieving dashboard summary",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}