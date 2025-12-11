using System.Net.Http;
using System.Text;
using System.Text.Json;
using FinLightSA.Core.DTOs.OCR;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;
using FinLightSA.Core.DTOs.Invoice;
using Microsoft.EntityFrameworkCore;

namespace FinLightSA.API.Services;

public class OcrProcessingService
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OcrProcessingService> _logger;

    public OcrProcessingService(
        HttpClient httpClient,
        ApplicationDbContext context,
        ILogger<OcrProcessingService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _logger = logger;
    }

    public async Task<ReceiptProcessingResult> ProcessReceiptImageAsync(byte[] imageBytes, Guid businessId)
    {
        try
        {
            // First, call the AI service for OCR processing
            var ocrResult = await CallAIServiceForOCR(imageBytes, "receipt");

            if (ocrResult == null)
            {
                // Fallback to basic OCR if AI service fails
                return await ProcessWithBasicOCR(imageBytes);
            }

            return ocrResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing receipt image");
            return new ReceiptProcessingResult
            {
                Vendor = "Unknown",
                Amount = 0,
                Date = DateTime.Now.ToString("yyyy-MM-dd"),
                VatAmount = 0,
                Items = new List<ReceiptItemDto>(),
                RawText = "Processing failed",
                Confidence = 0
            };
        }
    }

    public async Task<InvoiceProcessingResult> ProcessInvoiceImageAsync(byte[] imageBytes, Guid businessId)
    {
        try
        {
            // Call the AI service for invoice processing
            var result = await CallAIServiceForOCR(imageBytes, "invoice");

            if (result == null)
            {
                return new InvoiceProcessingResult
                {
                    InvoiceNumber = "",
                    Vendor = "Unknown",
                    Customer = "",
                    Amount = 0,
                    Date = DateTime.Now.ToString("yyyy-MM-dd"),
                    DueDate = "",
                    VatAmount = 0,
                    Items = new List<InvoiceItemDto>(),
                    RawText = "Processing failed",
                    Confidence = 0
                };
            }

            // Convert receipt result to invoice result
            return new InvoiceProcessingResult
            {
                InvoiceNumber = ExtractInvoiceNumber(result.RawText),
                Vendor = result.Vendor,
                Customer = "", // Invoices typically don't have customer in OCR
                Amount = result.Amount,
                Date = result.Date,
                DueDate = CalculateDueDate(result.Date),
                VatAmount = result.VatAmount,
                Items = result.Items.Select(item => new InvoiceItemDto
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    VatRate = 0.15m // Default VAT rate
                }).ToList(),
                RawText = result.RawText,
                Confidence = result.Confidence
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing invoice image");
            return new InvoiceProcessingResult
            {
                InvoiceNumber = "",
                Vendor = "Unknown",
                Customer = "",
                Amount = 0,
                Date = DateTime.Now.ToString("yyyy-MM-dd"),
                DueDate = "",
                VatAmount = 0,
                Items = new List<InvoiceItemDto>(),
                RawText = "Processing failed",
                Confidence = 0
            };
        }
    }

    public async Task<CreateInvoiceFromReceiptResult> CreateInvoiceFromReceiptAsync(
        CreateInvoiceFromReceiptRequest request, Guid businessId)
    {
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
            IssueDate = DateTime.TryParse(request.Date, out var issueDate) ? issueDate : DateTime.UtcNow,
            DueDate = DateTime.TryParse(request.Date, out var dueDate) ? dueDate.AddDays(30) : DateTime.UtcNow.AddDays(30),
            Notes = $"Created from receipt - {request.Vendor}",
            CreatedAt = DateTime.UtcNow
        };

        decimal subtotal = 0;
        decimal vatTotal = 0;

        foreach (var itemRequest in request.Items)
        {
            var lineTotal = itemRequest.Quantity * itemRequest.UnitPrice;
            var vatAmount = lineTotal * 0.15m; // Default VAT rate

            var item = new InvoiceItem
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                Description = itemRequest.Description,
                Quantity = itemRequest.Quantity,
                UnitPrice = itemRequest.UnitPrice,
                VatRate = 0.15m,
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

        return new CreateInvoiceFromReceiptResult
        {
            InvoiceId = invoice.Id,
            InvoiceNumber = invoice.Number,
            Total = invoice.Total
        };
    }

    private async Task<ReceiptProcessingResult?> CallAIServiceForOCR(byte[] imageBytes, string documentType)
    {
        try
        {
            // Check if AI service is running
            var aiServiceUrl = Environment.GetEnvironmentVariable("AI_SERVICE_URL") ?? "http://localhost:8000";

            // First check if AI service is available
            try
            {
                var healthCheck = await _httpClient.GetAsync($"{aiServiceUrl}/health");
                if (!healthCheck.IsSuccessStatusCode)
                {
                    _logger.LogWarning("AI service health check failed with status {StatusCode}", healthCheck.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI service is not available at {Url}. Make sure the AI service is running.", aiServiceUrl);
                return null;
            }

            var requestData = new
            {
                image = Convert.ToBase64String(imageBytes),
                document_type = documentType
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestData),
                Encoding.UTF8,
                "application/json"
            );

            _logger.LogInformation("Calling AI service at {Url}/process-document", aiServiceUrl);
            var response = await _httpClient.PostAsync($"{aiServiceUrl}/process-document", jsonContent);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("AI service response: {Response}", responseContent);
                
                // Parse JSON response (AI service returns snake_case, we need to map manually)
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                
                // Use JsonDocument to parse and manually map fields
                using var doc = JsonDocument.Parse(responseContent);
                var root = doc.RootElement;
                
                var result = new ReceiptProcessingResult
                {
                    Vendor = root.GetProperty("vendor").GetString() ?? "Unknown",
                    Amount = root.TryGetProperty("amount", out var amountEl) ? amountEl.GetDecimal() : 0,
                    Date = root.TryGetProperty("date", out var dateEl) ? dateEl.GetString() ?? DateTime.Now.ToString("yyyy-MM-dd") : DateTime.Now.ToString("yyyy-MM-dd"),
                    VatAmount = root.TryGetProperty("vat_amount", out var vatEl) ? vatEl.GetDecimal() : 0,
                    RawText = root.TryGetProperty("raw_text", out var rawTextEl) ? rawTextEl.GetString() ?? "" : "",
                    Confidence = root.TryGetProperty("confidence", out var confEl) ? confEl.GetDecimal() : 0.5m,
                    Items = new List<ReceiptItemDto>()
                };
                
                // Parse items array
                if (root.TryGetProperty("items", out var itemsEl) && itemsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var itemEl in itemsEl.EnumerateArray())
                    {
                        result.Items.Add(new ReceiptItemDto
                        {
                            Description = itemEl.TryGetProperty("description", out var descEl) ? descEl.GetString() ?? "" : "",
                            Quantity = itemEl.TryGetProperty("quantity", out var qtyEl) ? qtyEl.GetInt32() : 1,
                            UnitPrice = itemEl.TryGetProperty("unit_price", out var unitPriceEl) ? unitPriceEl.GetDecimal() : 0,
                            Total = itemEl.TryGetProperty("total", out var totalEl) ? totalEl.GetDecimal() : 0
                        });
                    }
                }

                _logger.LogInformation("Successfully parsed OCR result: Vendor={Vendor}, Amount={Amount}, Items={ItemCount}", 
                    result.Vendor, result.Amount, result.Items.Count);
                
                // Enhance with AI categorization if available
                await EnhanceWithAICategorization(result, imageBytes);

                return result;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("AI service returned error status {StatusCode}: {Error}", response.StatusCode, errorContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI service call failed, falling back to basic OCR");
        }

        return null;
    }

    private async Task EnhanceWithAICategorization(ReceiptProcessingResult result, byte[] imageBytes)
    {
        try
        {
            var aiServiceUrl = Environment.GetEnvironmentVariable("AI_SERVICE_URL") ?? "http://localhost:8000";

            foreach (var item in result.Items)
            {
                var categoryRequest = new
                {
                    description = item.Description,
                    amount = item.Total
                };

                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(categoryRequest),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{aiServiceUrl}/categorize", jsonContent);

                if (response.IsSuccessStatusCode)
                {
                    var categoryResult = await response.Content.ReadFromJsonAsync<dynamic>();
                    // Could store category suggestions for later use
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI categorization failed");
        }
    }

    private async Task<ReceiptProcessingResult> ProcessWithBasicOCR(byte[] imageBytes)
    {
        // Fallback when AI service is not available
        _logger.LogWarning("Using basic OCR fallback - AI service not available");
        return new ReceiptProcessingResult
        {
            Vendor = "Unknown Vendor",
            Amount = 0,
            Date = DateTime.Now.ToString("yyyy-MM-dd"),
            VatAmount = 0,
            Items = new List<ReceiptItemDto>(),
            RawText = "AI service not available. Please start the AI service to enable OCR processing.",
            Confidence = 0.1m
        };
    }

    private string ExtractInvoiceNumber(string text)
    {
        // Simple pattern matching for invoice numbers
        var patterns = new[] { @"INV[-\s]*\d+", @"Invoice\s*#?\s*\d+", @"\d{3,}" };

        foreach (var pattern in patterns)
        {
            var match = System.Text.RegularExpressions.Regex.Match(text, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (match.Success)
            {
                return match.Value.Trim();
            }
        }

        return $"INV-{DateTime.Now:yyyyMMddHHmm}";
    }

    private string CalculateDueDate(string dateStr)
    {
        if (DateTime.TryParse(dateStr, out var date))
        {
            return date.AddDays(30).ToString("yyyy-MM-dd");
        }

        return DateTime.Now.AddDays(30).ToString("yyyy-MM-dd");
    }
}