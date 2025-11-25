using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("public")]
    public IActionResult Public() => Ok(new { message = "public" });

    [Authorize]
    [HttpGet("private")]
    public IActionResult Private()
    {
        var uid = User.FindFirst("uid")?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        return Ok(new { message = "private", uid, email, role });
    }

    [Authorize(Roles = "Owner,Admin")]
    [HttpGet("owner-only")]
    public IActionResult OwnerOnly() => Ok(new { message = "owner admin only" });
}