using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FinLightSA.Infrastructure.Services;

public class AIService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AIService> _logger;
    private readonly string _baseUrl;

    public AIService(HttpClient httpClient, IConfiguration configuration, ILogger<AIService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = configuration["AIService:BaseUrl"] ?? "http://localhost:8000";

        // Set base address for HttpClient
        _httpClient.BaseAddress = new Uri(_baseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<CategoryPredictionResponse?> CategorizeTransactionAsync(TransactionCategorizationRequest request)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/categorize", new
            {
                description = request.Description,
                amount = request.Amount,
                direction = request.Direction
            });

            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<CategoryPredictionResponse>();
            }

            _logger.LogWarning("AI categorization failed with status: {StatusCode}", response.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AI categorization service");
            return null;
        }
    }

    public async Task<List<TransactionWithPrediction>?> CategorizeTransactionsBatchAsync(List<TransactionCategorizationRequest> requests)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/categorize/batch",
                requests.Select(r => new
                {
                    description = r.Description,
                    amount = r.Amount,
                    direction = r.Direction
                }));

            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<List<TransactionWithPrediction>>();
            }

            _logger.LogWarning("AI batch categorization failed with status: {StatusCode}", response.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AI batch categorization service");
            return null;
        }
    }

    public async Task<ReceiptData?> ExtractReceiptDataAsync(byte[] imageData, string fileName)
    {
        try
        {
            using var content = new MultipartFormDataContent();
            using var stream = new MemoryStream(imageData);
            using var fileContent = new StreamContent(stream);

            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
            content.Add(fileContent, "file", fileName);

            var response = await _httpClient.PostAsync("/ocr/receipt", content);

            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<ReceiptData>();
            }

            _logger.LogWarning("OCR receipt extraction failed with status: {StatusCode}", response.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OCR receipt service");
            return null;
        }
    }

    public async Task<bool> SubmitFeedbackAsync(string description, string predictedCategory, string correctCategory, decimal amount)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/feedback", new
            {
                description,
                predicted_category = predictedCategory,
                correct_category = correctCategory,
                amount
            });

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting AI feedback");
            return false;
        }
    }

    public async Task<AIServiceHealth?> GetHealthAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/health");
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<AIServiceHealth>();
            }
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking AI service health");
            return null;
        }
    }
}

// DTOs for AI Service Communication
public class TransactionCategorizationRequest
{
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Direction { get; set; } = "Debit";
}

public class CategoryPredictionResponse
{
    public string Category { get; set; } = string.Empty;
    public float Confidence { get; set; }
    public List<Dictionary<string, object>> Alternatives { get; set; } = new();
}

public class TransactionWithPrediction
{
    public string Description { get; set; } = string.Empty;
    public float Amount { get; set; }
    public string Direction { get; set; } = string.Empty;
    public string PredictedCategory { get; set; } = string.Empty;
    public float Confidence { get; set; }
}

public class ReceiptData
{
    public string Vendor { get; set; } = string.Empty;
    public float Amount { get; set; }
    public string Date { get; set; } = string.Empty;
    public float? VatAmount { get; set; }
    public List<Dictionary<string, object>> Items { get; set; } = new();
}

public class AIServiceHealth
{
    public string Status { get; set; } = string.Empty;
    [JsonPropertyName("categorizer_loaded")]
    public bool CategorizerLoaded { get; set; }
    [JsonPropertyName("ocr_available")]
    public bool OcrAvailable { get; set; }
}
