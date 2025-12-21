using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using FinLightSA.Core.Models;

namespace FinLightSA.API.Services;

public class PdfService
{
    public byte[] GenerateInvoicePdf(Invoice invoice, Business business, Customer customer)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                page.Header()
                    .Column(header =>
                    {
                        header.Item().Text("INVOICE")
                            .FontSize(24)
                            .SemiBold()
                            .FontColor(Colors.Blue.Darken2);

                        header.Item().PaddingTop(10)
                            .Row(row =>
                            {
                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().Text($"Invoice Number: {invoice.Number}")
                                        .FontSize(12)
                                        .SemiBold();
                                    col.Item().Text($"Issue Date: {invoice.IssueDate?.ToString("dd MMM yyyy") ?? "N/A"}");
                                    col.Item().Text($"Due Date: {invoice.DueDate?.ToString("dd MMM yyyy") ?? "N/A"}");
                                });

                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().Text(business.Name ?? "Business Name")
                                        .FontSize(14)
                                        .SemiBold();
                                    col.Item().Text(business.RegistrationNumber ?? "Business Registration");
                                    col.Item().Text($"VAT: {business.VatNumber ?? "N/A"}");
                                    col.Item().Text(business.Industry ?? "Industry");
                                });
                            });

                        header.Item().PaddingTop(20)
                            .Row(row =>
                            {
                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().Text("Bill To:")
                                        .FontSize(12)
                                        .SemiBold();
                                    col.Item().Text(customer.Name);
                                    col.Item().Text(customer.Email ?? "");
                                    col.Item().Text(customer.Phone ?? "");
                                    col.Item().Text(customer.Address ?? "");
                                });
                            });
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(40); // #
                            columns.RelativeColumn(4); // Description
                            columns.ConstantColumn(60); // Qty
                            columns.ConstantColumn(80); // Unit Price
                            columns.ConstantColumn(50); // VAT %
                            columns.ConstantColumn(80); // Line Total
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(Block).Text("#").SemiBold();
                            header.Cell().Element(Block).Text("Description").SemiBold();
                            header.Cell().Element(Block).Text("Qty").SemiBold();
                            header.Cell().Element(Block).Text("Unit Price").SemiBold();
                            header.Cell().Element(Block).Text("VAT %").SemiBold();
                            header.Cell().Element(Block).Text("Line Total").SemiBold();

                            static IContainer Block(IContainer container)
                            {
                                return container
                                    .Border(1)
                                    .Background(Colors.Grey.Lighten3)
                                    .Padding(5)
                                    .AlignCenter()
                                    .AlignMiddle();
                            }
                        });

                        foreach (var item in invoice.Items)
                        {
                            table.Cell().Element(Block).Text((invoice.Items.ToList().IndexOf(item) + 1).ToString());
                            table.Cell().Element(Block).Text(item.Description ?? "");
                            table.Cell().Element(Block).Text(item.Quantity.ToString());
                            table.Cell().Element(Block).Text($"R{item.UnitPrice:F2}");
                            table.Cell().Element(Block).Text($"{item.VatRate:P0}");
                            table.Cell().Element(Block).Text($"R{item.LineTotal:F2}");

                            static IContainer Block(IContainer container)
                            {
                                return container
                                    .Border(1)
                                    .Padding(5)
                                    .AlignLeft()
                                    .AlignMiddle();
                            }
                        }
                    });

                page.Footer()
                    .Column(footer =>
                    {
                        footer.Item().PaddingTop(20)
                            .Row(row =>
                            {
                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().PaddingBottom(5).Text("Notes:")
                                        .SemiBold();
                                    col.Item().Text(invoice.Notes ?? "No additional notes");
                                });

                                row.ConstantItem(200).Column(col =>
                                {
                                    col.Item().PaddingBottom(5).Text("Subtotal:")
                                        .SemiBold();
                                    col.Item().Text($"R{invoice.Subtotal:F2}");

                                    col.Item().PaddingTop(5).Text("VAT (Total):")
                                        .SemiBold();
                                    col.Item().Text($"R{invoice.VatAmount:F2}");

                                    col.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Black);

                                    col.Item().PaddingTop(5).Text("Total:")
                                        .FontSize(14)
                                        .SemiBold();
                                    col.Item().Text($"R{invoice.Total:F2}")
                                        .FontSize(14)
                                        .SemiBold()
                                        .FontColor(Colors.Blue.Darken2);
                                });
                            });

                        footer.Item().PaddingTop(30)
                            .Text("Thank you for your business!")
                            .FontSize(12)
                            .Italic()
                            .AlignCenter();
                    });
            });
        }).GeneratePdf();
    }

    static IContainer Block(IContainer container)
    {
        return container
            .Border(1)
            .Background(Colors.White)
            .Padding(5);
    }
}
