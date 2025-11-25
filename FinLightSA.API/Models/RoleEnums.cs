using Supabase;
using Supabase.Postgrest;

namespace FinLightSA.API.Models
{
    public enum UserRole
    {
        Owner,
        Admin,
        Staff
    }
}
