namespace FinLightSA.Core.DTOs.Dashboard;

public class MonthlyTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Income { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetFlow { get; set; }
}