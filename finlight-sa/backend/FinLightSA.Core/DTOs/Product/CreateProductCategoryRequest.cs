namespace FinLightSA.Core.DTOs.Product;

public class CreateProductCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
}