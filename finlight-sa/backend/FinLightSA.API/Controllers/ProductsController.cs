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
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(ApplicationDbContext context, ILogger<ProductsController> logger)
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
    public async Task<ActionResult<ApiResponse<PaginatedResponse<ProductDto>>>> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.Products.Where(p => p.BusinessId == businessId);

            var totalCount = await query.CountAsync();
            var products = await query
                .Include(p => p.ProductCategory)
                .OrderBy(p => p.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    ProductCategoryId = p.ProductCategoryId,
                    ProductCategory = p.ProductCategory != null ? new ProductCategoryDto
                    {
                        Id = p.ProductCategory.Id,
                        Name = p.ProductCategory.Name,
                        Description = p.ProductCategory.Description,
                        Color = p.ProductCategory.Color,
                        CreatedAt = p.ProductCategory.CreatedAt,
                        UpdatedAt = p.ProductCategory.UpdatedAt
                    } : null,
                    Name = p.Name,
                    Description = p.Description,
                    UnitPrice = p.UnitPrice,
                    IsService = p.IsService,
                    Sku = p.Sku,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            var response = new PaginatedResponse<ProductDto>
            {
                Items = products,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<ProductDto>>
            {
                Success = true,
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, new ApiResponse<PaginatedResponse<ProductDto>>
            {
                Success = false,
                Message = "Error retrieving products"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetProduct(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var product = await _context.Products
                .Include(p => p.ProductCategory)
                .FirstOrDefaultAsync(p => p.Id == id && p.BusinessId == businessId);

            if (product == null)
            {
                return NotFound(new ApiResponse<ProductDto>
                {
                    Success = false,
                    Message = "Product not found"
                });
            }

            var productDto = new ProductDto
            {
                Id = product.Id,
                ProductCategoryId = product.ProductCategoryId,
                ProductCategory = product.ProductCategory != null ? new ProductCategoryDto
                {
                    Id = product.ProductCategory.Id,
                    Name = product.ProductCategory.Name,
                    Description = product.ProductCategory.Description,
                    Color = product.ProductCategory.Color,
                    CreatedAt = product.ProductCategory.CreatedAt,
                    UpdatedAt = product.ProductCategory.UpdatedAt
                } : null,
                Name = product.Name,
                Description = product.Description,
                UnitPrice = product.UnitPrice,
                IsService = product.IsService,
                Sku = product.Sku,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            };

            return Ok(new ApiResponse<ProductDto>
            {
                Success = true,
                Data = productDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product");
            return StatusCode(500, new ApiResponse<ProductDto>
            {
                Success = false,
                Message = "Error retrieving product"
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductDto>>> CreateProduct(CreateProductRequest request)
    {
        try
        {
            var businessId = GetBusinessId();

            var product = new Product
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                ProductCategoryId = request.ProductCategoryId,
                Name = request.Name,
                Description = request.Description,
                UnitPrice = request.UnitPrice,
                IsService = request.IsService,
                Sku = request.Sku,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Load the product with category for the response
            var savedProduct = await _context.Products
                .Include(p => p.ProductCategory)
                .FirstAsync(p => p.Id == product.Id);

            var productDto = new ProductDto
            {
                Id = savedProduct.Id,
                ProductCategoryId = savedProduct.ProductCategoryId,
                ProductCategory = savedProduct.ProductCategory != null ? new ProductCategoryDto
                {
                    Id = savedProduct.ProductCategory.Id,
                    Name = savedProduct.ProductCategory.Name,
                    Description = savedProduct.ProductCategory.Description,
                    Color = savedProduct.ProductCategory.Color,
                    CreatedAt = savedProduct.ProductCategory.CreatedAt,
                    UpdatedAt = savedProduct.ProductCategory.UpdatedAt
                } : null,
                Name = savedProduct.Name,
                Description = savedProduct.Description,
                UnitPrice = savedProduct.UnitPrice,
                IsService = savedProduct.IsService,
                Sku = savedProduct.Sku,
                CreatedAt = savedProduct.CreatedAt,
                UpdatedAt = savedProduct.UpdatedAt
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id },
                new ApiResponse<ProductDto>
                {
                    Success = true,
                    Data = productDto
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new ApiResponse<ProductDto>
            {
                Success = false,
                Message = "Error creating product"
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> UpdateProduct(Guid id, CreateProductRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var product = await _context.Products
                .Include(p => p.ProductCategory)
                .FirstOrDefaultAsync(p => p.Id == id && p.BusinessId == businessId);

            if (product == null)
            {
                return NotFound(new ApiResponse<ProductDto>
                {
                    Success = false,
                    Message = "Product not found"
                });
            }

            product.ProductCategoryId = request.ProductCategoryId;
            product.Name = request.Name;
            product.Description = request.Description;
            product.UnitPrice = request.UnitPrice;
            product.IsService = request.IsService;
            product.Sku = request.Sku;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var productDto = new ProductDto
            {
                Id = product.Id,
                ProductCategoryId = product.ProductCategoryId,
                ProductCategory = product.ProductCategory != null ? new ProductCategoryDto
                {
                    Id = product.ProductCategory.Id,
                    Name = product.ProductCategory.Name,
                    Description = product.ProductCategory.Description,
                    Color = product.ProductCategory.Color,
                    CreatedAt = product.ProductCategory.CreatedAt,
                    UpdatedAt = product.ProductCategory.UpdatedAt
                } : null,
                Name = product.Name,
                Description = product.Description,
                UnitPrice = product.UnitPrice,
                IsService = product.IsService,
                Sku = product.Sku,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            };

            return Ok(new ApiResponse<ProductDto>
            {
                Success = true,
                Data = productDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product");
            return StatusCode(500, new ApiResponse<ProductDto>
            {
                Success = false,
                Message = "Error updating product"
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProduct(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.BusinessId == businessId);

            if (product == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Product not found"
                });
            }

            // Check if product is used in any invoices
            var isUsedInInvoices = await _context.InvoiceItems
                .AnyAsync(ii => ii.ProductId == id);

            if (isUsedInInvoices)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cannot delete product that is used in invoices"
                });
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Product deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Error deleting product"
            });
        }
    }
}
