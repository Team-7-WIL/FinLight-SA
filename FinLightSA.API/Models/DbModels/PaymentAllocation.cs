using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("payment_allocations")]
public class PaymentAllocation : BaseModel
{
    public string? id { get; set; }
    public string? payment_id { get; set; }
    public string? invoice_id { get; set; }
    public decimal? amount { get; set; }
}