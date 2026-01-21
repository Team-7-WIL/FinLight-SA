using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.DTOs.Quotation;
using FinLightSA.Core.DTOs.Invoice;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;
using FinLightSA.API.Services;
using System.Security.Claims;

namespace FinLightSA.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class QuotationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly PdfService _pdfService;
    private readonly EmailService _emailService;
    private readonly ILogger<QuotationsController> _logger;
    private readonly AuditService _auditService;

    public QuotationsController(
        ApplicationDbContext context,
        PdfService pdfService,
        EmailService emailService,
        ILogger<QuotationsController> logger,
        AuditService auditService)
    {
        _context = context;
        _pdfService = pdfService;
        _emailService = emailService;
        _logger = logger;
        _auditService = auditService;
    }

    private Guid GetBusinessId()
    {
        var businessIdClaim = User.FindFirst("BusinessId")?.Value;
        return Guid.Parse(businessIdClaim!);
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<QuotationDto>>>> GetQuotations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null)
    {
        try
        {
            var businessId = GetBusinessId();
            var query = _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .Where(q => q.BusinessId == businessId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(q => q.Status == status);
            }

            var totalCount = await query.CountAsync();
            var quotations = await query
                .OrderByDescending(q => q.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(q => new QuotationDto
                {
                    Id = q.Id,
                    Number = q.Number,
                    Status = q.Status,
                    Customer = new CustomerSummaryDto
                    {
                        Id = q.Customer.Id,
                        Name = q.Customer.Name,
                        Email = q.Customer.Email
                    },
                    Items = q.Items.Select(item => new QuotationItemDto
                    {
                        Id = item.Id,
                        ProductId = item.ProductId,
                        Description = item.Description,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        VatRate = item.VatRate,
                        LineTotal = item.LineTotal
                    }).ToList(),
                    Subtotal = q.Subtotal,
                    VatAmount = q.VatAmount,
                    Total = q.Total,
                    IssueDate = q.IssueDate,
                    ExpiryDate = q.ExpiryDate,
                    Notes = q.Notes,
                    ConvertedToInvoiceId = q.ConvertedToInvoiceId,
                    CreatedAt = q.CreatedAt
                })
                .ToListAsync();

            var response = new PaginatedResponse<QuotationDto>
            {
                Items = quotations,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };

            return Ok(new ApiResponse<PaginatedResponse<QuotationDto>>
            {
                Success = true,
                Message = "Quotations retrieved successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving quotations");
            return StatusCode(500, new ApiResponse<PaginatedResponse<QuotationDto>>
            {
                Success = false,
                Message = "Error retrieving quotations",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<QuotationDto>>> GetQuotation(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var quotation = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id && q.BusinessId == businessId);

            if (quotation == null)
            {
                return NotFound(new ApiResponse<QuotationDto>
                {
                    Success = false,
                    Message = "Quotation not found"
                });
            }

            var quotationDto = new QuotationDto
            {
                Id = quotation.Id,
                Number = quotation.Number,
                Status = quotation.Status,
                Customer = new CustomerSummaryDto
                {
                    Id = quotation.Customer.Id,
                    Name = quotation.Customer.Name,
                    Email = quotation.Customer.Email
                },
                Items = quotation.Items.Select(item => new QuotationItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    VatRate = item.VatRate,
                    LineTotal = item.LineTotal
                }).ToList(),
                Subtotal = quotation.Subtotal,
                VatAmount = quotation.VatAmount,
                Total = quotation.Total,
                IssueDate = quotation.IssueDate,
                ExpiryDate = quotation.ExpiryDate,
                Notes = quotation.Notes,
                ConvertedToInvoiceId = quotation.ConvertedToInvoiceId,
                CreatedAt = quotation.CreatedAt
            };

            return Ok(new ApiResponse<QuotationDto>
            {
                Success = true,
                Message = "Quotation retrieved successfully",
                Data = quotationDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving quotation");
            return StatusCode(500, new ApiResponse<QuotationDto>
            {
                Success = false,
                Message = "Error retrieving quotation",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<QuotationDto>>> CreateQuotation([FromBody] CreateQuotationRequest request)
    {
        try
        {
            var businessId = GetBusinessId();

            // Generate quotation number
            var lastQuotation = await _context.Quotations
                .Where(q => q.BusinessId == businessId)
                .OrderByDescending(q => q.CreatedAt)
                .FirstOrDefaultAsync();

            var quotationNumber = lastQuotation != null
                ? $"QUO-{int.Parse(lastQuotation.Number.Split('-')[1]) + 1:D5}"
                : "QUO-00001";

            var quotation = new Quotation
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                CustomerId = request.CustomerId,
                Number = quotationNumber,
                Status = "Draft",
                IssueDate = request.IssueDate ?? DateTime.UtcNow,
                ExpiryDate = request.ExpiryDate ?? DateTime.UtcNow.AddDays(30),
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            decimal subtotal = 0;
            decimal vatTotal = 0;

            foreach (var itemRequest in request.Items)
            {
                var lineTotal = itemRequest.Quantity * itemRequest.UnitPrice;
                var vatAmount = lineTotal * itemRequest.VatRate;

                var item = new QuotationItem
                {
                    Id = Guid.NewGuid(),
                    QuotationId = quotation.Id,
                    ProductId = itemRequest.ProductId,
                    Description = itemRequest.Description,
                    Quantity = itemRequest.Quantity,
                    UnitPrice = itemRequest.UnitPrice,
                    VatRate = itemRequest.VatRate,
                    LineTotal = lineTotal
                };

                quotation.Items.Add(item);
                subtotal += lineTotal;
                vatTotal += vatAmount;
            }

            quotation.Subtotal = subtotal;
            quotation.VatAmount = vatTotal;
            quotation.Total = subtotal + vatTotal;

            _context.Quotations.Add(quotation);
            await _context.SaveChangesAsync();

            var customer = await _context.Customers.FindAsync(request.CustomerId);

            var quotationDto = new QuotationDto
            {
                Id = quotation.Id,
                Number = quotation.Number,
                Status = quotation.Status,
                Customer = new CustomerSummaryDto
                {
                    Id = customer!.Id,
                    Name = customer.Name,
                    Email = customer.Email
                },
                Items = quotation.Items.Select(item => new QuotationItemDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    VatRate = item.VatRate,
                    LineTotal = item.LineTotal
                }).ToList(),
                Subtotal = quotation.Subtotal,
                VatAmount = quotation.VatAmount,
                Total = quotation.Total,
                IssueDate = quotation.IssueDate,
                ExpiryDate = quotation.ExpiryDate,
                Notes = quotation.Notes,
                CreatedAt = quotation.CreatedAt
            };

            return CreatedAtAction(nameof(GetQuotation), new { id = quotation.Id }, new ApiResponse<QuotationDto>
            {
                Success = true,
                Message = "Quotation created successfully",
                Data = quotationDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating quotation");
            return StatusCode(500, new ApiResponse<QuotationDto>
            {
                Success = false,
                Message = "Error creating quotation",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<ApiResponse<QuotationDto>>> UpdateQuotationStatus(Guid id, [FromBody] UpdateQuotationStatusRequest request)
    {
        try
        {
            var businessId = GetBusinessId();
            var quotation = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id && q.BusinessId == businessId);

            if (quotation == null)
            {
                return NotFound(new ApiResponse<QuotationDto>
                {
                    Success = false,
                    Message = "Quotation not found"
                });
            }

            quotation.Status = request.Status;
            quotation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<QuotationDto>
            {
                Success = true,
                Message = "Quotation status updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quotation status");
            return StatusCode(500, new ApiResponse<QuotationDto>
            {
                Success = false,
                Message = "Error updating quotation status",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("{id}/convert-to-invoice")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> ConvertToInvoice(Guid id, [FromBody] ConvertQuotationToInvoiceRequest? request)
    {
        try
        {
            _logger.LogInformation("[ConvertToInvoice] Starting conversion for quotation: {QuotationId}", id);
            var businessId = GetBusinessId();
            _logger.LogInformation("[ConvertToInvoice] BusinessId: {BusinessId}", businessId);
            
            var quotation = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id && q.BusinessId == businessId);

            if (quotation == null)
            {
                _logger.LogWarning("[ConvertToInvoice] Quotation not found: {QuotationId}", id);
                return NotFound(new ApiResponse<InvoiceDto>
                {
                    Success = false,
                    Message = "Quotation not found"
                });
            }

            if (quotation.ConvertedToInvoiceId.HasValue)
            {
                return BadRequest(new ApiResponse<InvoiceDto>
                {
                    Success = false,
                    Message = "Quotation has already been converted to an invoice"
                });
            }

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
                CustomerId = quotation.CustomerId,
                Number = invoiceNumber,
                Status = "Draft",
                IssueDate = request?.IssueDate ?? quotation.IssueDate ?? DateTime.UtcNow,
                DueDate = request?.DueDate ?? quotation.ExpiryDate ?? DateTime.UtcNow.AddDays(30),
                Notes = request?.Notes ?? quotation.Notes,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var quotationItem in quotation.Items)
            {
                var invoiceItem = new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    ProductId = quotationItem.ProductId,
                    Description = quotationItem.Description,
                    Quantity = quotationItem.Quantity,
                    UnitPrice = quotationItem.UnitPrice,
                    VatRate = quotationItem.VatRate,
                    LineTotal = quotationItem.LineTotal
                };
                invoice.Items.Add(invoiceItem);
            }

            invoice.Subtotal = quotation.Subtotal;
            invoice.VatAmount = quotation.VatAmount;
            invoice.Total = quotation.Total;

            quotation.ConvertedToInvoiceId = invoice.Id;
            quotation.Status = "Converted";
            quotation.UpdatedAt = DateTime.UtcNow;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Use the customer that was already loaded via Include
            var customer = quotation.Customer;

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

            await _auditService.LogInvoiceCreatedAsync(invoice.Id, invoice.Number, invoice.Total);

            _logger.LogInformation("[ConvertToInvoice] Successfully converted quotation {QuotationId} to invoice {InvoiceId}", id, invoice.Id);

            return Ok(new ApiResponse<InvoiceDto>
            {
                Success = true,
                Message = "Quotation converted to invoice successfully",
                Data = invoiceDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ConvertToInvoice] Error converting quotation to invoice. QuotationId: {QuotationId}, Error: {Error}", id, ex.Message);
            return StatusCode(500, new ApiResponse<InvoiceDto>
            {
                Success = false,
                Message = "Error converting quotation to invoice",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetQuotationPdf(Guid id)
    {
        try
        {
            var businessId = GetBusinessId();
            var quotation = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .Where(q => q.Id == id && q.BusinessId == businessId)
                .FirstOrDefaultAsync();

            if (quotation == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Quotation not found"
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
                .Where(c => c.Id == quotation.CustomerId)
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Customer information not found"
                });
            }

            var pdfBytes = _pdfService.GenerateQuotationPdf(quotation, business, customer);
            var fileName = $"Quotation-{quotation.Number}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating quotation PDF");
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "Error generating quotation PDF",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("{id}/send-email")]
    public async Task<ActionResult<ApiResponse<bool>>> SendQuotationEmail(Guid id, [FromBody] SendQuotationEmailRequest? request)
    {
        try
        {
            _logger.LogInformation("[SendQuotationEmail] Starting email send for quotation: {QuotationId}", id);
            var businessId = GetBusinessId();
            _logger.LogInformation("[SendQuotationEmail] BusinessId: {BusinessId}", businessId);
            
            var quotation = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .Where(q => q.Id == id && q.BusinessId == businessId)
                .FirstOrDefaultAsync();

            if (quotation == null)
            {
                _logger.LogWarning("[SendQuotationEmail] Quotation not found: {QuotationId}", id);
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Quotation not found"
                });
            }

            var customer = await _context.Customers.FindAsync(quotation.CustomerId);
            if (customer == null || string.IsNullOrEmpty(customer.Email))
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Customer email not found"
                });
            }

            var toEmail = request?.ToEmail ?? customer.Email;
            _logger.LogInformation("[SendQuotationEmail] Generating PDF and sending to: {ToEmail}", toEmail);
            
            var pdfBytes = _pdfService.GenerateQuotationPdf(
                quotation,
                await _context.Businesses.FindAsync(businessId)!,
                customer);

            var success = await _emailService.SendQuotationEmailAsync(
                toEmail,
                customer.Name,
                quotation.Number,
                quotation.Total,
                pdfBytes);

            if (success)
            {
                _logger.LogInformation("[SendQuotationEmail] Email sent successfully, updating status to 'Sent'");
                quotation.Status = "Sent";
                quotation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            else
            {
                _logger.LogWarning("[SendQuotationEmail] Email service returned false for quotation {QuotationId}", id);
            }

            return Ok(new ApiResponse<bool>
            {
                Success = success,
                Message = success ? "Quotation email sent successfully" : "Failed to send quotation email",
                Data = success
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SendQuotationEmail] Error sending quotation email. QuotationId: {QuotationId}, Error: {Error}", id, ex.Message);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "Error sending quotation email",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}

