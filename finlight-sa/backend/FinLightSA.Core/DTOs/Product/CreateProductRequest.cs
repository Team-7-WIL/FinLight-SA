using System.ComponentModel.DataAnnotations;

namespace FinLightSA.Core.DTOs.Product;

public class CreateProductRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal UnitPrice { get; set; }

    public bool IsService { get; set; } = false;

    [StringLength(50)]
    public string? Sku { get; set; }
}
