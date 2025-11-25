using FinLightSA.API.Models;
using Postgrest;
using Supabase;

namespace FinLightSA.API.Services
{
    public class DatabaseService
    {
        private readonly Supabase.Client _client;

        public DatabaseService(Configuration.SupabaseClientFactory factory)
        {
            _client = factory.CreateClient();
        }

        // Insert user profile into 'users' table (if you have a separate profile table)
        public async Task<PostgrestResponse<UserProfile>> InsertUserProfileAsync(UserProfile profile)
        {
            return await _client.From<UserProfile>().Insert(profile);
        }

        // Create business
        public async Task<PostgrestResponse<object>> CreateBusinessAsync(object business)
        {
            return await _client.From<object>("businesses").Insert(business);
        }

        // Create user_business_roles
        public async Task<PostgrestResponse<object>> CreateUserBusinessRoleAsync(object roleRow)
        {
            return await _client.From<object>("user_business_roles").Insert(roleRow);
        }

        // Query role for user (example)
        public async Task<PostgrestResponse<object>> GetUserRolesAsync(string userId)
        {
            return await _client.From<object>("user_business_roles").Select("*").Eq("user_id", userId);
        }
    }
}
