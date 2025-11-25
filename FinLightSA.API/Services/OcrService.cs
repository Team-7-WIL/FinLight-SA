using Google.Cloud.Vision.V1;
using System.Threading.Tasks;

namespace FinLightSA.API.Services;

public class OcrService
{
    private readonly ImageAnnotatorClient _client;

    public OcrService()
    {
        _client = ImageAnnotatorClient.Create();
    }

    public async Task<string> ExtractTextFromImageAsync(byte[] imageBytes)
    {
        var image = Image.FromBytes(imageBytes);
        var response = await _client.DetectTextAsync(image);
        return response.FirstOrDefault()?.Description ?? string.Empty;
    }
}