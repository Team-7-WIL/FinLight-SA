namespace FinLightSA.Core.DTOs.Dashboard;

public class CategoryExpenseDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Count { get; set; }
}