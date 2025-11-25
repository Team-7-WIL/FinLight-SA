using Microsoft.Extensions.Configuration;
using Postgrest;
using Supabase;

namespace FinLightSA.API.Configuration
{
    public class SupabaseClientFactory
    {
        private readonly IConfiguration _config;
        private Client _client;

        public SupabaseClientFactory(IConfiguration config)
        {
            _config = config;
        }

        public async Task<Client> CreateAndInitializeClientAsync()
        {
            if (_client != null) return _client;

            var url = _config["Supabase:Url"];
            var anon = _config["Supabase:AnonKey"];

            if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(anon))
                throw new InvalidOperationException("Supabase keys missing. Set Supabase:Url and Supabase:AnonKey.");

            _client = new Client(url, anon);
            await _client.InitializeAsync(); // connects realtime and prepares PostgREST
            return _client;
        }

        // synchronous wrapper if needed
        public Client CreateClient()
        {
            if (_client != null) return _client;
            var url = _config["Supabase:Url"];
            var anon = _config["Supabase:AnonKey"];
            _client = new Client(url, anon);
            return _client;
        }
    }
}
