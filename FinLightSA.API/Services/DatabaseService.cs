using Supabase;
using Supabase.Postgrest;
using FinLightSA.API.Configuration;

namespace FinLightSA.API.Services
{
    public class DatabaseService
    {
        private readonly Client _client;

        public DatabaseService(SupabaseClientFactory factory)
        {
            _client = factory.GetClient();
        }

        // Example SELECT
        public async Task<List<T>> GetAll<T>() where T : BaseModel, new()
        {
            var result = await _client.From<T>().Get();
            return result.Models;
        }

        // Example INSERT
        public async Task<T> Insert<T>(T model) where T : BaseModel, new()
        {
            var result = await _client.From<T>().Insert(model);
            return result.Models.First();
        }
    }
}
