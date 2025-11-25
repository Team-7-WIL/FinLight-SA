using FinLightSA.API.Models.DbModels;
using System.Threading.Tasks;

namespace FinLightSA.API.Services;

public class AuditService
{
    private readonly DatabaseService _db;

    public AuditService(DatabaseService db) => _db = db;

    public async Task LogActionAsync(string userId, string businessId, string action, string module, string recordId)
    {
        var log = new AuditLog
        {
            user_id = userId,
            business_id = businessId,
            action = action,
            module = module,
            record_id = recordId,
            timestamp = DateTime.UtcNow
        };
        await _db.InsertAsync(log);
    }
}