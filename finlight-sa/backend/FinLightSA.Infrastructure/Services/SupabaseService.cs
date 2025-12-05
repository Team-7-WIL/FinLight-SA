using Supabase;
using Microsoft.Extensions.Configuration;
using System.Linq;

namespace FinLightSA.Infrastructure.Services;

public class SupabaseService
{
    private readonly Client _client;

    public SupabaseService(IConfiguration configuration)
    {
        var url = configuration["Supabase:Url"] ?? throw new ArgumentNullException("Supabase URL not configured");
        var key = configuration["Supabase:ServiceKey"] ?? throw new ArgumentNullException("Supabase key not configured");

        var options = new Supabase.SupabaseOptions
        {
            AutoRefreshToken = true,
            AutoConnectRealtime = true
        };

        _client = new Client(url, key, options);
    }

    public Client GetClient() => _client;

    public async Task<string> UploadFileAsync(string bucket, string fileName, byte[] fileData, string contentType)
    {
        try
        {
            var result = await _client.Storage
                .From(bucket)
                .Upload(fileData, fileName, new Supabase.Storage.FileOptions
                {
                    ContentType = contentType,
                    Upsert = false
                });

            return _client.Storage.From(bucket).GetPublicUrl(fileName);
        }
        catch (Supabase.Storage.Exceptions.SupabaseStorageException ex) when (ex.Message.Contains("Bucket not found") || ex.Message.Contains("bucket"))
        {
            // Bucket doesn't exist - provide helpful error message
            throw new InvalidOperationException(
                $"Bucket '{bucket}' does not exist in Supabase. Please create the bucket '{bucket}' in your Supabase Storage dashboard. " +
                $"Required buckets: 'receipts' and 'bank-statements'", ex);
        }
    }

    public async Task<byte[]> DownloadFileAsync(string bucket, string fileName)
    {
        return await _client.Storage.From(bucket).Download(fileName, (Supabase.Storage.TransformOptions?)null);
    }

    public async Task<bool> DeleteFileAsync(string bucket, string fileName)
    {
        await _client.Storage.From(bucket).Remove(new List<string> { fileName });
        return true;
    }
}