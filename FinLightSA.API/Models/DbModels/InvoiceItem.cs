using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("invoice_items")]
public class InvoiceItem : BaseModel
{
    public string? id { get; set; }
    public string? invoice_id { get; set; }
    public string? product_id { get; set; }
    public string? description { get; set; }
    public int? quantity { get; set; }
    public decimal? unit_price { get; set; }
    public decimal? line_total { get; set; }
}