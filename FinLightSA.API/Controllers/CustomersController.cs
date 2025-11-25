using FinLightSA.API.Models.DbModels;
using FinLightSA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly DatabaseService _db;
    private readonly AuditService _audit;

    public CustomersController(DatabaseService db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] Customer model)
    {
        var userId = User.FindFirst("uid")?.Value;
        if (userId == null) return Unauthorized();

        model.business_id = await GetUserBusinessIdAsync(userId);
        if (string.IsNullOrEmpty(model.business_id)) return BadRequest("No business associated");

        var result = await _db.InsertAsync(model);
        await _audit.LogActionAsync(userId, model.business_id, "ADD_CUSTOMER", "Customers", result.id);
        return Ok(result);
    }

    private async Task<string?> GetUserBusinessIdAsync(string userId)
    {
        var roles = await _db.QueryEqAsync<UserBusinessRole>("user_id", userId);
        return roles.FirstOrDefault()?.business_id;
    }
}