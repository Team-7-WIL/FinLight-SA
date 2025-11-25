using System.Net.Http;
using System.Text.Json;
using System.Text;
using System.Threading.Tasks;

namespace FinLightSA.API.Services;

public class AiService
{
    private readonly HttpClient _http;
    private const string AiUrl = "https://ai-microservice.example.com/categorize";

    public AiService(HttpClient http) => _http = http;

    public async Task<(string category, double confidence)> CategorizeTransactionAsync(string description)
    {
        var content = new StringContent(JsonSerializer.Serialize(new { description }), Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(AiUrl, content);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<AiResponse>(json);
        return (result?.Category ?? "Unknown", result?.Confidence ?? 0);
    }

    private class AiResponse
    {
        public string Category { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }
}