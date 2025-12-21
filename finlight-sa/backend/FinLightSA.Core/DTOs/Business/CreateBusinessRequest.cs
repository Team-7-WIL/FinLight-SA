namespace FinLightSA.Core.DTOs.Business;

public class CreateBusinessRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? VatNumber { get; set; }
}