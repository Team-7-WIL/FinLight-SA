using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.Invoice;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoiceTemplatesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<InvoiceTemplatesController> _logger;

    public InvoiceTemplatesController(ApplicationDbContext context, ILogger<InvoiceTemplatesController> logger)
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
    public async Task<ActionResult<ApiResponse<PaginatedResponse<InvoiceTemplateDto>>>> GetTemplates(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.InvoiceTemplates.Where(t => t.BusinessId == businessId);

            var totalCount = await query.CountAsync();
            var templates = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new InvoiceTemplateDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Description = t.Description,
                    TemplateData = t.TemplateData,
                    IsDefault = t.IsDefault,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            var response = new PaginatedResponse<InvoiceTemplateDto>
            {
                Items = templates,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<InvoiceTemplateDto>>
            {
                Success = true,
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoice templates");
            return StatusCode(500, new ApiResponse<PaginatedResponse<InvoiceTemplateDto>>
            {
                Success = false,
                Message = "Error retrieving invoice templates",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceTemplateDto>>> GetTemplate(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var template = await _context.InvoiceTemplates
                .FirstOrDefaultAsync(t => t.Id == id && t.BusinessId == businessId);

            if (template == null)
            {
                return NotFound(new ApiResponse<InvoiceTemplateDto>
                {
                    Success = false,
                    Message = "Invoice template not found"
                });
            }

            var templateDto = new InvoiceTemplateDto
            {
                Id = template.Id,
                Name = template.Name,
                Description = template.Description,
                TemplateData = template.TemplateData,
                IsDefault = template.IsDefault,
                CreatedAt = template.CreatedAt,
                UpdatedAt = template.UpdatedAt
            };

            return Ok(new ApiResponse<InvoiceTemplateDto>
            {
                Success = true,
                Data = templateDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoice template");
            return StatusCode(500, new ApiResponse<InvoiceTemplateDto>
            {
                Success = false,
                Message = "Error retrieving invoice template",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<InvoiceTemplateDto>>> CreateTemplate([FromBody] CreateInvoiceTemplateRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new ApiResponse<InvoiceTemplateDto>
                {
                    Success = false,
                    Message = "Template name is required"
                });
            }

            var businessId = GetBusinessId();

            // If marking as default, unmark others
            if (request.IsDefault)
            {
                var currentDefault = await _context.InvoiceTemplates
                    .FirstOrDefaultAsync(t => t.BusinessId == businessId && t.IsDefault);
                if (currentDefault != null)
                {
                    currentDefault.IsDefault = false;
                }
            }

            var template = new InvoiceTemplate
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                TemplateData = request.TemplateData,
                IsDefault = request.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            _context.InvoiceTemplates.Add(template);
            await _context.SaveChangesAsync();

            var templateDto = new InvoiceTemplateDto
            {
                Id = template.Id,
                Name = template.Name,
                Description = template.Description,
                TemplateData = template.TemplateData,
                IsDefault = template.IsDefault,
                CreatedAt = template.CreatedAt,
                UpdatedAt = template.UpdatedAt
            };

            return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, new ApiResponse<InvoiceTemplateDto>
            {
                Success = true,
                Message = "Invoice template created successfully",
                Data = templateDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice template");
            return StatusCode(500, new ApiResponse<InvoiceTemplateDto>
            {
                Success = false,
                Message = "Error creating invoice template",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceTemplateDto>>> UpdateTemplate(Guid id, [FromBody] UpdateInvoiceTemplateRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var template = await _context.InvoiceTemplates
                .FirstOrDefaultAsync(t => t.Id == id && t.BusinessId == businessId);

            if (template == null)
            {
                return NotFound(new ApiResponse<InvoiceTemplateDto>
                {
                    Success = false,
                    Message = "Invoice template not found"
                });
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                template.Name = request.Name.Trim();
            }

            if (request.Description != null)
            {
                template.Description = request.Description.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.TemplateData))
            {
                template.TemplateData = request.TemplateData;
            }

            if (request.IsDefault.HasValue)
            {
                if (request.IsDefault.Value)
                {
                    var currentDefault = await _context.InvoiceTemplates
                        .FirstOrDefaultAsync(t => t.BusinessId == businessId && t.IsDefault && t.Id != id);
                    if (currentDefault != null)
                    {
                        currentDefault.IsDefault = false;
                    }
                }
                template.IsDefault = request.IsDefault.Value;
            }

            template.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var templateDto = new InvoiceTemplateDto
            {
                Id = template.Id,
                Name = template.Name,
                Description = template.Description,
                TemplateData = template.TemplateData,
                IsDefault = template.IsDefault,
                CreatedAt = template.CreatedAt,
                UpdatedAt = template.UpdatedAt
            };

            return Ok(new ApiResponse<InvoiceTemplateDto>
            {
                Success = true,
                Message = "Invoice template updated successfully",
                Data = templateDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating invoice template");
            return StatusCode(500, new ApiResponse<InvoiceTemplateDto>
            {
                Success = false,
                Message = "Error updating invoice template",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTemplate(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var template = await _context.InvoiceTemplates
                .FirstOrDefaultAsync(t => t.Id == id && t.BusinessId == businessId);

            if (template == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invoice template not found"
                });
            }

            _context.InvoiceTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Invoice template deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting invoice template");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Error deleting invoice template",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
