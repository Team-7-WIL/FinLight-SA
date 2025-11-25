using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("ai_feedback")]
public class AiFeedback : BaseModel
{
    public string? id { get; set; }
    public string? transaction_id { get; set; }
    public string? predicted_category { get; set; }
    public string? correct_category { get; set; }
    public double? confidence_score { get; set; }
    public DateTime? submitted_at { get; set; }
}