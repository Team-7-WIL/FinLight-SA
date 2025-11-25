using Supabase;
using Supabase.Gotrue;
using Supabase.Postgrest;

namespace FinLightSA.API.Configuration;

public class SupabaseClientFactory
{
    private readonly IConfiguration _config;
    private Supabase.Client? _client;

    public SupabaseClientFactory(IConfiguration config)
    {
        _config = config;
    }

    public async Task<Supabase.Client> CreateAndInitializeClientAsync()
    {
        if (_client != null) return _client;

        var url = _config["Supabase:Url"];
        var key = _config["Supabase:AnonKey"];

        if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key))
            throw new InvalidOperationException("Supabase:Url or Supabase:AnonKey missing. Set user-secrets.");

        var options = new SupabaseOptions { AutoConnectRealtime = false, AutoRefreshToken = true };

        _client = new Supabase.Client(url, key, options);
        await _client.InitializeAsync();
        return _client;
    }

    public Supabase.Client GetClient()
    {
        if (_client != null) return _client;
        var url = _config["Supabase:Url"];
        var key = _config["Supabase:AnonKey"];
        _client = new Supabase.Client(url, key);
        return _client;
    }

    public Supabase.Client CreateServiceRoleClient()
    {
        var url = _config["Supabase:Url"];
        var serviceKey = _config["Supabase:ServiceRoleKey"];
        if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(serviceKey))
            throw new InvalidOperationException("Supabase ServiceRoleKey missing in secrets.");
        return new Supabase.Client(url, serviceKey);
    }
}