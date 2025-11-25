using Supabase.Storage;
using System.IO;
using System.Threading.Tasks;

namespace FinLightSA.API.Services;

public class StorageService
{
    private readonly Supabase.Client _client;

    public StorageService(Configuration.SupabaseClientFactory factory)
    {
        _client = factory.GetClient();
    }

    public async Task<string> UploadFileAsync(string bucket, string filePath, Stream fileStream)
    {
        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();
        await _client.Storage.From(bucket).Upload(bytes, filePath);
        return _client.Storage.From(bucket).GetPublicUrl(filePath);
    }

    public async Task<string> GetSignedUrl(string bucket, string filePath, int expiresInMinutes = 60)
    {
        return await _client.Storage.From(bucket).CreateSignedUrl(filePath, expiresInMinutes * 60);
    }
}