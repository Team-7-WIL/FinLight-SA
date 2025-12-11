namespace FinLightSA.Core.DTOs.Customer;

public class CustomerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? VatNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}