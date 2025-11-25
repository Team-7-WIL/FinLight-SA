using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Models.DbModels;

[Table("users")]
public class UserProfile : BaseModel
{
    public string? id { get; set; }
    public string? full_name { get; set; }
    public string? email { get; set; }
    public string? phone { get; set; }
    public string? password_hash { get; set; }
    public DateTime? created_at { get; set; }
}