using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("expenses")]
public class Expense : BaseModel
{
    public string? id { get; set; }
    public string? business_id { get; set; }
    public string? user_id { get; set; }
    public string? category { get; set; }
    public decimal? amount { get; set; }
    public DateTime? date { get; set; }
    public string? notes { get; set; }
    public string? receipt_url { get; set; }
    public DateTime? created_at { get; set; }
}