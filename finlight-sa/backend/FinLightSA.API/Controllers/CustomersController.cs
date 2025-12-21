using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.Customer;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ApplicationDbContext context, ILogger<CustomersController> logger)
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
    public async Task<ActionResult<ApiResponse<PaginatedResponse<CustomerDto>>>> GetCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.Customers.Where(c => c.BusinessId == businessId);

            var totalCount = await query.CountAsync();
            var customers = await query
                .OrderBy(c => c.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CustomerDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    Phone = c.Phone,
                    Address = c.Address,
                    VatNumber = c.VatNumber,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            var response = new PaginatedResponse<CustomerDto>
            {
                Items = customers,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<CustomerDto>>
            {
                Success = true,
                Message = "Customers retrieved successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customers");
            return StatusCode(500, new ApiResponse<PaginatedResponse<CustomerDto>>
            {
                Success = false,
                Message = "Error retrieving customers",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        try
        {
            var businessId = GetBusinessId();

            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address,
                VatNumber = request.VatNumber,
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var customerDto = new CustomerDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Address = customer.Address,
                VatNumber = customer.VatNumber,
                CreatedAt = customer.CreatedAt
            };

            return CreatedAtAction(nameof(GetCustomers), new { id = customer.Id }, new ApiResponse<CustomerDto>
            {
                Success = true,
                Message = "Customer created successfully",
                Data = customerDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer");
            return StatusCode(500, new ApiResponse<CustomerDto>
            {
                Success = false,
                Message = "Error creating customer",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> UpdateCustomer(Guid id, [FromBody] CreateCustomerRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var customer = await _context.Customers.Where(c => c.Id == id && c.BusinessId == businessId).FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new ApiResponse<CustomerDto>
                {
                    Success = false,
                    Message = "Customer not found"
                });
            }

            customer.Name = request.Name;
            customer.Email = request.Email;
            customer.Phone = request.Phone;
            customer.Address = request.Address;
            customer.VatNumber = request.VatNumber;
            customer.UpdatedAt = DateTime.UtcNow;

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();

            var customerDto = new CustomerDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Address = customer.Address,
                VatNumber = customer.VatNumber,
                CreatedAt = customer.CreatedAt
            };

            return Ok(new ApiResponse<CustomerDto>
            {
                Success = true,
                Message = "Customer updated successfully",
                Data = customerDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer");
            return StatusCode(500, new ApiResponse<CustomerDto>
            {
                Success = false,
                Message = "Error updating customer",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCustomer(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var customer = await _context.Customers.Where(c => c.Id == id && c.BusinessId == businessId).FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Customer not found"
                });
            }

            // Check if customer has any associated invoices
            var hasInvoices = await _context.Invoices.AnyAsync(i => i.CustomerId == id);
            if (hasInvoices)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Cannot delete customer with associated invoices"
                });
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Customer deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Error deleting customer",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}