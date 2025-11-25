using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("invoices")]
public class Invoice : BaseModel
{
    public string? id { get; set; }
    public string? business_id { get; set; }
    public string? customer_id { get; set; }
    public string? number { get; set; }
    public string? status { get; set; }
    public decimal? subtotal { get; set; }
    public decimal? total { get; set; }
    public DateTime? due_date { get; set; }
    public DateTime? created_at { get; set; }
}