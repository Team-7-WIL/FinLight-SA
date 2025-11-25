using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("bank_transactions")]
public class BankTransaction : BaseModel
{
    public string? id { get; set; }
    public string? bank_statement_id { get; set; }
    public DateTime? txn_date { get; set; }
    public decimal? amount { get; set; }
    public string? direction { get; set; }
    public string? description { get; set; }
    public string? ai_category { get; set; }
    public double? confidence_score { get; set; }
    public string? feedback_category { get; set; }
    public string? business_id { get; set; }  // Added this to fix CS1061
}