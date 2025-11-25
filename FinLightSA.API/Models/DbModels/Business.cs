using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("businesses")]
public class Business : BaseModel
{
    public string? id { get; set; }
    public string? name { get; set; }
    public string? industry { get; set; }
    public string? subscription_plan { get; set; }
    public DateTime? created_at { get; set; }
}