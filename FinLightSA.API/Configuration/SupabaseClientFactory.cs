using Supabase;
using Supabase.Gotrue;
using Supabase.Postgrest;

namespace FinLightSA.API.Configuration
{
    public class SupabaseClientFactory
    {
        private readonly IConfiguration _config;
        private Client? _client;

        public SupabaseClientFactory(IConfiguration config)
        {
            _config = config;
        }

        public Client GetClient()
        {
            if (_client != null)
                return _client;

            var url = _config["Supabase:Url"];
            var key = _config["Supabase:Key"];

            var options = new SupabaseOptions
            {
                AutoConnectRealtime = false,
            };

            _client = new Client(url, key, options);
            return _client;
        }
    }
}
