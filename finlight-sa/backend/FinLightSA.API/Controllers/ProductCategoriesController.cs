using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.Product;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductCategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductCategoriesController> _logger;

    public ProductCategoriesController(ApplicationDbContext context, ILogger<ProductCategoriesController> logger)
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
    public async Task<ActionResult<ApiResponse<PaginatedResponse<ProductCategoryDto>>>> GetProductCategories(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.ProductCategories.Where(pc => pc.BusinessId == businessId);

            var totalCount = await query.CountAsync();
            var categories = await query
                .OrderBy(pc => pc.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(pc => new ProductCategoryDto
                {
                    Id = pc.Id,
                    Name = pc.Name,
                    Description = pc.Description,
                    Color = pc.Color,
                    CreatedAt = pc.CreatedAt,
                    UpdatedAt = pc.UpdatedAt
                })
                .ToListAsync();

            var response = new PaginatedResponse<ProductCategoryDto>
            {
                Items = categories,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<ProductCategoryDto>>
            {
                Success = true,
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product categories");
            return StatusCode(500, new ApiResponse<PaginatedResponse<ProductCategoryDto>>
            {
                Success = false,
                Message = "Error retrieving product categories"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProductCategoryDto>>> GetProductCategory(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var category = await _context.ProductCategories
                .FirstOrDefaultAsync(pc => pc.Id == id && pc.BusinessId == businessId);

            if (category == null)
            {
                return NotFound(new ApiResponse<ProductCategoryDto>
                {
                    Success = false,
                    Message = "Product category not found"
                });
            }

            var categoryDto = new ProductCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            };

            return Ok(new ApiResponse<ProductCategoryDto>
            {
                Success = true,
                Data = categoryDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product category");
            return StatusCode(500, new ApiResponse<ProductCategoryDto>
            {
                Success = false,
                Message = "Error retrieving product category"
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductCategoryDto>>> CreateProductCategory(CreateProductCategoryRequest request)
    {
        try
        {
            var businessId = GetBusinessId();

            var category = new ProductCategory
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                Name = request.Name,
                Description = request.Description,
                Color = request.Color,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductCategories.Add(category);
            await _context.SaveChangesAsync();

            var categoryDto = new ProductCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            };

            return CreatedAtAction(nameof(GetProductCategory), new { id = category.Id },
                new ApiResponse<ProductCategoryDto>
                {
                    Success = true,
                    Data = categoryDto
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product category");
            return StatusCode(500, new ApiResponse<ProductCategoryDto>
            {
                Success = false,
                Message = "Error creating product category"
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ProductCategoryDto>>> UpdateProductCategory(Guid id, CreateProductCategoryRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var category = await _context.ProductCategories
                .FirstOrDefaultAsync(pc => pc.Id == id && pc.BusinessId == businessId);

            if (category == null)
            {
                return NotFound(new ApiResponse<ProductCategoryDto>
                {
                    Success = false,
                    Message = "Product category not found"
                });
            }

            category.Name = request.Name;
            category.Description = request.Description;
            category.Color = request.Color;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var categoryDto = new ProductCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            };

            return Ok(new ApiResponse<ProductCategoryDto>
            {
                Success = true,
                Data = categoryDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product category");
            return StatusCode(500, new ApiResponse<ProductCategoryDto>
            {
                Success = false,
                Message = "Error updating product category"
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProductCategory(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var category = await _context.ProductCategories
                .FirstOrDefaultAsync(pc => pc.Id == id && pc.BusinessId == businessId);

            if (category == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Product category not found"
                });
            }

            // Check if category is used by products
            var isUsedByProducts = await _context.Products
                .AnyAsync(p => p.ProductCategoryId == id);

            if (isUsedByProducts)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cannot delete category that contains products"
                });
            }

            _context.ProductCategories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Product category deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product category");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Error deleting product category"
            });
        }
    }
}