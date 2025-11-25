using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("customers")]
public class Customer : BaseModel
{
    public string? id { get; set; }
    public string? business_id { get; set; }
    public string? name { get; set; }
    public string? email { get; set; }
    public string? phone { get; set; }
    public DateTime? created_at { get; set; }
}