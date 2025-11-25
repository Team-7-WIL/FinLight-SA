using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("user_business_roles")]
public class UserBusinessRole : BaseModel
{
    public string? id { get; set; }
    public string? user_id { get; set; }
    public string? business_id { get; set; }
    public string? role { get; set; }
    public DateTime? created_at { get; set; }
}