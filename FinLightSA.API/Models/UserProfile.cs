using System;
using Supabase;
using Supabase.Postgrest;

namespace FinLightSA.API.Models
{
    public class UserProfile
    {
        public Guid Id { get; set; }          // postgres uuid preferred
        public string Full_name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password_hash { get; set; } // optional if using Supabase Auth
        public DateTime Created_at { get; set; }
    }
}
