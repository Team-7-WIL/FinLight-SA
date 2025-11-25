using FinLightSA.API.Configuration;
using FinLightSA.API.Models;
using FinLightSA.API.Models.DbModels;
using Supabase;
using Supabase.Gotrue;

namespace FinLightSA.API.Services;

public class AuthService
{
    private readonly SupabaseClientFactory _factory;
    private readonly DatabaseService _db;

    public AuthService(SupabaseClientFactory factory, DatabaseService db)
    {
        _factory = factory;
        _db = db;
    }

    public async Task<(Supabase.Gotrue.User user, string role)> RegisterAsync(UserRegisterRequest req)
    {
        var client = _factory.GetClient();

        try
        {
            var signUpRes = await client.Auth.SignUp(req.Email ?? "", req.Password ?? "");
            var supaUser = signUpRes.User ?? throw new Exception("Supabase signup failed.");

            var business = new Business
            {
                name = string.IsNullOrWhiteSpace(req.BusinessName) ? $"{req.FullName}'s Business" : req.BusinessName,
                industry = null,
                subscription_plan = "free",
                created_at = DateTime.UtcNow
            };
            var insertedBusiness = await _db.InsertAsync(business);

            var roleRow = new UserBusinessRole
            {
                user_id = supaUser.Id,
                business_id = insertedBusiness.id,
                role = "Owner",
                created_at = DateTime.UtcNow
            };
            await _db.InsertAsync(roleRow);

            var profile = new UserProfile
            {
                id = supaUser.Id,
                full_name = req.FullName,
                email = req.Email,
                phone = req.Phone,
                created_at = DateTime.UtcNow
            };
            await _db.InsertAsync(profile);

            return (supaUser, "Owner");
        }
        catch (Exception ex)
        {
            throw new Exception($"Registration failed: {ex.Message}");
        }
    }

    public async Task<Supabase.Gotrue.User?> LoginAsync(UserLoginRequest dto)
    {
        var client = _factory.GetClient();
        var res = await client.Auth.SignIn(dto.Email ?? "", dto.Password ?? "");
        return res.User;
    }
}