using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace FinLightSA.API.Services;

public class AuditService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null ? Guid.Parse(userIdClaim) : null;
    }

    private Guid? GetCurrentBusinessId()
    {
        var businessIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("BusinessId")?.Value;
        return businessIdClaim != null ? Guid.Parse(businessIdClaim) : null;
    }

    public async Task LogActionAsync(string action, string module, Guid? recordId = null, string? details = null)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = GetCurrentUserId(),
            BusinessId = GetCurrentBusinessId(),
            Action = action,
            Module = module,
            RecordId = recordId,
            Details = details,
            Timestamp = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }

    // Convenience methods for common actions
    public async Task LogExpenseCreatedAsync(Guid expenseId, decimal amount, string category)
    {
        await LogActionAsync("Created", "Expense", expenseId,
            $"Created expense: {category} - R{amount:F2}");
    }

    public async Task LogExpenseUpdatedAsync(Guid expenseId, decimal amount, string category)
    {
        await LogActionAsync("Updated", "Expense", expenseId,
            $"Updated expense: {category} - R{amount:F2}");
    }

    public async Task LogExpenseDeletedAsync(Guid expenseId)
    {
        await LogActionAsync("Deleted", "Expense", expenseId,
            "Deleted expense");
    }

    public async Task LogInvoiceCreatedAsync(Guid invoiceId, string invoiceNumber, decimal amount)
    {
        await LogActionAsync("Created", "Invoice", invoiceId,
            $"Created invoice: {invoiceNumber} - R{amount:F2}");
    }

    public async Task LogInvoiceUpdatedAsync(Guid invoiceId, string invoiceNumber, decimal amount)
    {
        await LogActionAsync("Updated", "Invoice", invoiceId,
            $"Updated invoice: {invoiceNumber} - R{amount:F2}");
    }

    public async Task LogInvoiceDeletedAsync(Guid invoiceId)
    {
        await LogActionAsync("Deleted", "Invoice", invoiceId,
            "Deleted invoice");
    }

    public async Task LogBankStatementUploadedAsync(Guid statementId, string fileName)
    {
        await LogActionAsync("Uploaded", "BankStatement", statementId,
            $"Uploaded bank statement: {fileName}");
    }

    public async Task LogBankStatementProcessedAsync(Guid statementId, int transactionCount)
    {
        await LogActionAsync("Processed", "BankStatement", statementId,
            $"Processed bank statement with {transactionCount} transactions");
    }

    public async Task LogTransactionCategorizedAsync(Guid transactionId, string category)
    {
        await LogActionAsync("Categorized", "BankTransaction", transactionId,
            $"Categorized transaction as: {category}");
    }
}
