namespace FinLightSA.Core.DTOs.Expense;

public class ReceiptUploadResponse
{
    public string FileUrl { get; set; } = string.Empty;
    public Guid ReceiptId { get; set; } // ID to reference when creating expense
    public ReceiptExtractedData? ExtractedData { get; set; }
}

public class ReceiptExtractedData
{
    public string Vendor { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public decimal? VatAmount { get; set; }
    public List<ReceiptItem> Items { get; set; } = new();
}

public class ReceiptItem
{
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; } = 1;
}
