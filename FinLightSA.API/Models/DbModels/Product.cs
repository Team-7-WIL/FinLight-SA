using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("products")]
public class Product : BaseModel
{
    public string? id { get; set; }
    public string? business_id { get; set; }
    public string? name { get; set; }
    public decimal? unit_price { get; set; }
    public bool? is_service { get; set; }
    public DateTime? created_at { get; set; }
}