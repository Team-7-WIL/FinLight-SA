using FinLightSA.API.Models;
using FinLightSA.API.Models.DbModels;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly TokenService _token;
    private readonly DatabaseService _db;

    public AuthController(AuthService auth, TokenService token, DatabaseService db)
    {
        _auth = auth;
        _token = token;
        _db = db;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { success = false, message = "Email and Password required" });

        try
        {
            var (user, role) = await _auth.RegisterAsync(req);
            var jwt = _token.CreateToken(user.Id, user.Email ?? req.Email, role);
            return Ok(new { token = jwt, userId = user.Id, email = user.Email, role });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginRequest req)
    {
        var user = await _auth.LoginAsync(req);
        if (user == null) return Unauthorized(new { success = false, message = "Invalid credentials" });

        var roles = await _db.QueryEqAsync<UserBusinessRole>("user_id", user.Id);
        var role = roles.FirstOrDefault()?.role ?? "Staff";
        var jwt = _token.CreateToken(user.Id, user.Email ?? req.Email, role);
        return Ok(new { token = jwt, userId = user.Id, email = user.Email, role });
    }
}