using FinLightSA.API.Models.DbModels;
using Supabase;
using Supabase.Postgrest;
using static Supabase.Postgrest.Constants;  // Fixed CS0138 with using static
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Supabase.Postgrest.Models;

namespace FinLightSA.API.Services;

public class DatabaseService
{
    private readonly Supabase.Client _client;

    public DatabaseService(Configuration.SupabaseClientFactory factory)
    {
        _client = factory.GetClient();
    }

    public async Task<T> InsertAsync<T>(T model) where T : BaseModel, new()
    {
        var res = await _client.From<T>().Insert(model);
        return res.Models.First();
    }

    public async Task UpdateAsync<T>(T model) where T : BaseModel, new()
    {
        await _client.From<T>().Update(model);
    }

    public async Task<List<T>> GetAllAsync<T>() where T : BaseModel, new()
    {
        var res = await _client.From<T>().Get();
        return res.Models;
    }

    public async Task<List<T>> QueryEqAsync<T>(string column, object value) where T : BaseModel, new()
    {
        var res = await _client.From<T>().Filter(column, Operator.Equals, value).Get();
        return res.Models;
    }

    public async Task<decimal> GetTotalIncomeAsync(string businessId)
    {
        var res = await _client.From<Payment>().Filter("business_id", Operator.Equals, businessId).Get();
        return res.Models.Sum(p => p.amount ?? 0);
    }

    public async Task<decimal> GetTotalExpensesAsync(string businessId)
    {
        var res = await _client.From<Expense>().Filter("business_id", Operator.Equals, businessId).Get();
        return res.Models.Sum(e => e.amount ?? 0);
    }
}