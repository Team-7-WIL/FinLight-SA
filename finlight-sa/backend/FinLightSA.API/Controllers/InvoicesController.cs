using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.Invoice;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;
using FinLightSA.API.Services;
using System.Security.Claims;
using Google;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly PdfService _pdfService;
    private readonly ILogger<InvoicesController> _logger;
    private readonly AuditService _auditService;

    public InvoicesController(
        ApplicationDbContext context,
        PdfService pdfService,
        ILogger<InvoicesController> logger,
        AuditService auditService)
    {
        _context = context;
        _pdfService = pdfService;
        _logger = logger;
        _auditService = auditService;
    }

    private Guid GetBusinessId()
    {
        var businessIdClaim = User.FindFirst("BusinessId")?.Value;
        return Guid.Parse(businessIdClaim!);
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<InvoiceDto>>>> GetInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .Where(i => i.BusinessId == businessId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            var totalCount = await query.CountAsync();
            var invoices = await query
                .OrderByDescending(i => i.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InvoiceDto
                {
                    Id = i.Id,
                    Number = i.Number,
                    Status = i.Status,
                    Customer = new CustomerSummaryDto
                    {
                        Id = i.Customer.Id,
                        Name = i.Customer.Name,
                        Email = i.Customer.Email
                    },
                    Items = i.Items.Select(item => new InvoiceItemDto
                    {
                        Id = item.Id,
                        ProductId = item.ProductId,
                        Description = item.Description,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        VatRate = item.VatRate,
                        LineTotal = item.LineTotal
                    }).ToList(),
                    Subtotal = i.Subtotal,
                    VatAmount = i.VatAmount,
                    Total = i.Total,
                    IssueDate = i.IssueDate,
                    DueDate = i.DueDate,
                    Notes = i.Notes,
                    CreatedAt = i.CreatedAt
                })
                .ToListAsync();

            var response = new PaginatedResponse<InvoiceDto>
            {
                Items = invoices,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<InvoiceDto>>
            {
                Success = true,
                Message = "Invoices retrieved successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoices");
            return StatusCode(500, new ApiResponse<PaginatedResponse<InvoiceDto>>
            {
                Success = false,
                Message = "Error retrieving invoices",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> GetInvoice(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id && i.BusinessId == businessId);

            if (invoice == null)
            {
                return NotFound(new ApiResponse<InvoiceDto>
                {
                    Success = false,
                    Message = "Invoice not found"
                });
            }

            var invoiceDto = new InvoiceDto
            {
                Id = invoice.Id,
                Number = invoice.Number,
                Status = invoice.Status,
                Customer = new CustomerSummaryDto
                {
                    Id = invoice.Customer.Id,
                    Name = invoice.Customer.Name,
                    Email = invoice.Customer.Email
                },
                Items = invoice.Items.Select(item => new InvoiceItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    VatRate = item.VatRate,
                    LineTotal = item.LineTotal
                }).ToList(),
                Subtotal = invoice.Subtotal,
                VatAmount = invoice.VatAmount,
                Total = invoice.Total,
                IssueDate = invoice.IssueDate,
                DueDate = invoice.DueDate,
                Notes = invoice.Notes,
                CreatedAt = invoice.CreatedAt
            };

            return Ok(new ApiResponse<InvoiceDto>
            {
                Success = true,
                Message = "Invoice retrieved successfully",
                Data = invoiceDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoice");
            return StatusCode(500, new ApiResponse<InvoiceDto>
            {
                Success = false,
                Message = "Error retrieving invoice",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        try
        {
            var businessId = GetBusinessId();

            // Generate invoice number
            var lastInvoice = await _context.Invoices
                .Where(i => i.BusinessId == businessId)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            var invoiceNumber = lastInvoice != null
                ? $"INV-{int.Parse(lastInvoice.Number.Split('-')[1]) + 1:D5}"
                : "INV-00001";

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                CustomerId = request.CustomerId,
                Number = invoiceNumber,
                Status = "Draft",
                IssueDate = request.IssueDate,
                DueDate = request.DueDate,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            decimal subtotal = 0;
            decimal vatTotal = 0;

            foreach (var itemRequest in request.Items)
            {
                var lineTotal = itemRequest.Quantity * itemRequest.UnitPrice;
                var vatAmount = lineTotal * itemRequest.VatRate;

                var item = new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    ProductId = itemRequest.ProductId,
                    Description = itemRequest.Description,
                    Quantity = itemRequest.Quantity,
                    UnitPrice = itemRequest.UnitPrice,
                    VatRate = itemRequest.VatRate,
                    LineTotal = lineTotal
                };

                invoice.Items.Add(item);
                subtotal += lineTotal;
                vatTotal += vatAmount;
            }

            invoice.Subtotal = subtotal;
            invoice.VatAmount = vatTotal;
            invoice.Total = subtotal + vatTotal;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            var customer = await _context.Customers.FindAsync(request.CustomerId);

            var invoiceDto = new InvoiceDto
            {
                Id = invoice.Id,
                Number = invoice.Number,
                Status = invoice.Status,
                Customer = new CustomerSummaryDto
                {
                    Id = customer!.Id,
                    Name = customer.Name,
                    Email = customer.Email
                },
                Items = invoice.Items.Select(item => new InvoiceItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    VatRate = item.VatRate,
                    LineTotal = item.LineTotal
                }).ToList(),
                Subtotal = invoice.Subtotal,
                VatAmount = invoice.VatAmount,
                Total = invoice.Total,
                IssueDate = invoice.IssueDate,
                DueDate = invoice.DueDate,
                Notes = invoice.Notes,
                CreatedAt = invoice.CreatedAt
            };

            // Log invoice creation
            await _auditService.LogInvoiceCreatedAsync(invoice.Id, invoice.Number, invoice.Total);

            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, new ApiResponse<InvoiceDto>
            {
                Success = true,
                Message = "Invoice created successfully",
                Data = invoiceDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice");
            return StatusCode(500, new ApiResponse<InvoiceDto>
            {
                Success = false,
                Message = "Error creating invoice",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> UpdateInvoiceStatus(Guid id, [FromBody] UpdateInvoiceStatusRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id && i.BusinessId == businessId);

            if (invoice == null)
            {
                return NotFound(new ApiResponse<InvoiceDto>
                {
                    Success = false,
                    Message = "Invoice not found"
                });
            }

            invoice.Status = request.Status;
            invoice.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Audit log for status change
            LogAuditAction("UPDATE_STATUS", "INVOICE", invoice.Id, $"Status changed to {request.Status} for invoice {invoice.Number}");

            return Ok(new ApiResponse<InvoiceDto>
            {
                Success = true,
                Message = "Invoice status updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating invoice status");
            return StatusCode(500, new ApiResponse<InvoiceDto>
            {
                Success = false,
                Message = "Error updating invoice status",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetInvoicePdf(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .Where(i => i.Id == id && i.BusinessId == businessId)
                .FirstOrDefaultAsync();

            if (invoice == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Invoice not found"
                });
            }

            var business = await _context.Businesses
                .Where(b => b.Id == businessId)
                .FirstOrDefaultAsync();

            if (business == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Business information not found"
                });
            }

            var customer = await _context.Customers
                .Where(c => c.Id == invoice.CustomerId)
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Customer information not found"
                });
            }

            var pdfBytes = _pdfService.GenerateInvoicePdf(invoice, business, customer);
            var fileName = $"Invoice-{invoice.Number}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice PDF");
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "Error generating invoice PDF",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}