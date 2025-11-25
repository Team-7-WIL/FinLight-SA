using FinLightSA.API.Models.DbModels;
using System.Collections.Generic;

namespace FinLightSA.API.Models;

public class RecordPaymentRequest
{
    public string CustomerId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime? PaymentDate { get; set; }
    public string Reference { get; set; } = string.Empty;
    public List<PaymentAllocation> Allocations { get; set; } = new List<PaymentAllocation>();
}