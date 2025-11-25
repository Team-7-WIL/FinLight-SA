using FinLightSA.API.Models.DbModels;
using System.Collections.Generic;

namespace FinLightSA.API.Models;

public class CreateInvoiceRequest
{
    public string CustomerId { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public List<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}