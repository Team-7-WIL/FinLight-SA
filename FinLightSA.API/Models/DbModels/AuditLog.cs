using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("audit_logs")]
public class AuditLog : BaseModel
{
    public string? id { get; set; }
    public string? user_id { get; set; }
    public string? business_id { get; set; }
    public string? action { get; set; }
    public string? module { get; set; }
    public string? record_id { get; set; }
    public DateTime? timestamp { get; set; }
}