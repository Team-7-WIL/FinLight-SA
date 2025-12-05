using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;

namespace FinLightSA.API.Controllers;

// DTO for AuditLog
public class AuditLogDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public Guid? BusinessId { get; set; }
    public string? BusinessName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public Guid? RecordId { get; set; }
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(ApplicationDbContext context, ILogger<AuditLogsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private Guid GetBusinessId()
    {
        var businessIdClaim = User.FindFirst("BusinessId")?.Value;
        return Guid.Parse(businessIdClaim!);
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<AuditLogDto>>>> GetAuditLogs(
        [FromQuery] string? action = null,
        [FromQuery] string? module = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.AuditLogs
                .Where(al => al.BusinessId == businessId);

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(al => al.Action == action);
            }

            if (!string.IsNullOrEmpty(module))
            {
                query = query.Where(al => al.Module == module);
            }

            if (startDate.HasValue)
            {
                query = query.Where(al => al.Timestamp >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(al => al.Timestamp <= endDate.Value);
            }

            var totalCount = await query.CountAsync();
            var auditLogs = await query
                .Include(al => al.User)
                .Include(al => al.Business)
                .OrderByDescending(al => al.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(al => new AuditLogDto
                {
                    Id = al.Id,
                    UserId = al.UserId,
                    UserName = al.User != null ? al.User.FullName : null,
                    BusinessId = al.BusinessId,
                    BusinessName = al.Business != null ? al.Business.Name : null,
                    Action = al.Action,
                    Module = al.Module,
                    RecordId = al.RecordId,
                    Details = al.Details,
                    Timestamp = al.Timestamp
                })
                .ToListAsync();

            var response = new PaginatedResponse<AuditLogDto>
            {
                Items = auditLogs,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<AuditLogDto>>
            {
                Success = true,
                Message = "Audit logs retrieved successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs");
            return StatusCode(500, new ApiResponse<PaginatedResponse<AuditLogDto>>
            {
                Success = false,
                Message = "Error retrieving audit logs",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("actions")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetAuditActions()
    {
        try
        {
            var businessId = GetBusinessId();
            var actions = await _context.AuditLogs
                .Where(al => al.BusinessId == businessId)
                .Select(al => al.Action)
                .Distinct()
                .OrderBy(action => action)
                .ToListAsync();

            return Ok(new ApiResponse<List<string>>
            {
                Success = true,
                Message = "Audit actions retrieved successfully",
                Data = actions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit actions");
            return StatusCode(500, new ApiResponse<List<string>>
            {
                Success = false,
                Message = "Error retrieving audit actions",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("modules")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetAuditModules()
    {
        try
        {
            var businessId = GetBusinessId();
            var modules = await _context.AuditLogs
                .Where(al => al.BusinessId == businessId)
                .Select(al => al.Module)
                .Distinct()
                .OrderBy(module => module)
                .ToListAsync();

            return Ok(new ApiResponse<List<string>>
            {
                Success = true,
                Message = "Audit modules retrieved successfully",
                Data = modules
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit modules");
            return StatusCode(500, new ApiResponse<List<string>>
            {
                Success = false,
                Message = "Error retrieving audit modules",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
