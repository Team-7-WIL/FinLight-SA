using FinLightSA.API.Configuration;
using FinLightSA.API.Models;
using Supabase;
using System;
using Supabase.Gotrue;
using Supabase.Postgrest;

namespace FinLightSA.API.Services
{
    public class AuthService
    {
        private readonly SupabaseClientFactory _factory;
        private readonly DatabaseService _db;

        public AuthService(SupabaseClientFactory factory, DatabaseService db)
        {
            _factory = factory;
            _db = db;
        }

        // Registers a user in Supabase Auth then writes a profile + default business + role
        public async Task<(User user, string role)> RegisterAsync(UserRegisterRequest req)
        {
            var client = _factory.CreateClient();

            // Sign up in Supabase Auth
            var signUpRes = await client.Auth.SignUp(req.Email, req.Password, new Dictionary<string, object>
            {
                ["full_name"] = req.FullName,
                ["phone"] = req.Phone
            });

            if (signUpRes?.User == null)
                throw new Exception("Supabase Auth registration failed.");

            var user = signUpRes.User;

            // Create a default business for this user
            var businessObj = new
            {
                name = string.IsNullOrWhiteSpace(req.BusinessName) ? $"{req.FullName}'s Business" : req.BusinessName,
                industry = (string?)null,
                subscription_plan = "free",
                created_at = DateTime.UtcNow
            };
            var businessResp = await _db.CreateBusinessAsync(businessObj);
            var businessRow = businessResp.Models.FirstOrDefault();
            string businessId = businessRow?.GetType().GetProperty("id")?.GetValue(businessRow)?.ToString();

            // Link user to business via user_business_roles
            var roleRow = new
            {
                user_id = user.Id,            // Supabase auth user id (uuid string)
                business_id = businessId,
                role = "Owner",
                created_at = DateTime.UtcNow
            };
            await _db.CreateUserBusinessRoleAsync(roleRow);

            // Optional: insert a profile row in 'users' table
            var profile = new UserProfile
            {
                Id = Guid.Parse(user.Id), // convert uuid string to Guid (if your users.id is uuid)
                Full_name = req.FullName,
                Email = req.Email,
                Phone = req.Phone,
                Created_at = DateTime.UtcNow
            };
            await _db.InsertUserProfileAsync(profile);

            return (user, "Owner");
        }

        public async Task<User> LoginAsync(UserLoginRequest dto)
        {
            var client = _factory.CreateClient();
            var res = await client.Auth.SignIn(dto.Email, dto.Password);
            if (res?.User == null) return null;
            return res.User;
        }
    }
}
