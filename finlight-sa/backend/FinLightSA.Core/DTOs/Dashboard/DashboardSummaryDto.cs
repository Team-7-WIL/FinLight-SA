namespace FinLightSA.Core.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetCashFlow { get; set; }
    public int PendingInvoices { get; set; }
    public int OverdueInvoices { get; set; }
    public List<CategoryExpenseDto> TopExpenseCategories { get; set; } = new();
    public List<MonthlyTrendDto> MonthlyTrends { get; set; } = new();
}