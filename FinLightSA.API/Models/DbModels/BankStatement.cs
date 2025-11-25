using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("bank_statements")]
public class BankStatement : BaseModel
{
    public string? id { get; set; }
    public string? business_id { get; set; }
    public string? file_name { get; set; }
    public string? uploaded_by { get; set; }
    public DateTime? upload_date { get; set; }
    public string? file_url { get; set; }
}