using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("payments")]
public class Payment : BaseModel
{
    public string? id { get; set; }
    public string? business_id { get; set; }
    public string? customer_id { get; set; }
    public decimal? amount { get; set; }
    public string? payment_method { get; set; }
    public DateTime? payment_date { get; set; }
    public string? reference { get; set; }
}