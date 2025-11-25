using FinLightSA.API.Models;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinLightSA.API.Controllers
{
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
            try
            {
                var (user, role) = await _auth.RegisterAsync(req);

                var jwt = _token.CreateToken(user.Id, user.Email, role,
                    key: HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Jwt:Key"],
                    issuer: HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Jwt:Issuer"],
                    audience: HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Jwt:Audience"]
                );

                return Ok(new AuthResponse { Token = jwt, UserId = user.Id, Email = user.Email, Role = role });
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

            // Determine role from DB
            var rolesResp = await _db.GetUserRolesAsync(user.Id);
            var role = rolesResp.Models.FirstOrDefault()?.GetType().GetProperty("role")?.GetValue(rolesResp.Models.FirstOrDefault())?.ToString() ?? "Staff";

            var jwt = _token.CreateToken(user.Id, user.Email, role,
                key: HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Jwt:Key"],
                issuer: HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Jwt:Issuer"],
                audience: HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Jwt:Audience"]
            );

            return Ok(new AuthResponse { Token = jwt, UserId = user.Id, Email = user.Email, Role = role });
        }
    }
}
