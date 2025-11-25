using System.Net.Http;
using System.Threading.Tasks;

namespace FinLightSA.API.Services;

public class BankService
{
    private readonly HttpClient _http;
    private const string StitchUrl = "https://api.stitch.money/v1/transactions";

    public BankService(HttpClient http) => _http = http;

    public async Task<string> ImportTransactionsAsync(string accessToken)
    {
        _http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        var response = await _http.GetStringAsync(StitchUrl);
        return response;
    }
}