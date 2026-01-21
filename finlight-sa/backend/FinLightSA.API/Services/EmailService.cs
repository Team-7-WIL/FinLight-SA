using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FinLightSA.API.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string? _smtpHost;
    private readonly int _smtpPort;
    private readonly string? _smtpUsername;
    private readonly string? _smtpPassword;
    private readonly bool _enableSsl;
    private readonly string? _fromEmail;
    private readonly string? _fromName;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        _smtpHost = _configuration["Email:SmtpHost"];
        _smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
        _smtpUsername = _configuration["Email:SmtpUsername"];
        _smtpPassword = _configuration["Email:SmtpPassword"];
        _enableSsl = bool.Parse(_configuration["Email:EnableSsl"] ?? "true");
        _fromEmail = _configuration["Email:FromEmail"] ?? "noreply@finlightsa.co.za";
        _fromName = _configuration["Email:FromName"] ?? "FinLight SA";
    }

    public async Task<bool> SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        byte[]? attachmentBytes = null,
        string? attachmentFileName = null)
    {
        try
        {
            // If email is not configured, log and return success (for development)
            if (string.IsNullOrEmpty(_smtpHost))
            {
                _logger.LogWarning("Email service not configured. Email would be sent to: {ToEmail}, Subject: {Subject}", toEmail, subject);
                return true; // Return true in development to not break the flow
            }

            using var client = new SmtpClient(_smtpHost, _smtpPort)
            {
                EnableSsl = _enableSsl,
                Credentials = !string.IsNullOrEmpty(_smtpUsername) 
                    ? new NetworkCredential(_smtpUsername, _smtpPassword)
                    : null
            };

            using var message = new MailMessage
            {
                From = new MailAddress(_fromEmail!, _fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            message.To.Add(toEmail);

            if (attachmentBytes != null && !string.IsNullOrEmpty(attachmentFileName))
            {
                using var stream = new MemoryStream(attachmentBytes);
                var attachment = new Attachment(stream, attachmentFileName, "application/pdf");
                message.Attachments.Add(attachment);
            }

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {ToEmail}", toEmail);
            return false;
        }
    }

    public async Task<bool> SendQuotationEmailAsync(
        string toEmail,
        string customerName,
        string quotationNumber,
        decimal total,
        byte[]? pdfBytes = null)
    {
        var subject = $"Quotation {quotationNumber} from FinLight SA";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Quotation {quotationNumber}</h2>
                <p>Dear {customerName},</p>
                <p>Thank you for your interest in our services. Please find attached your quotation.</p>
                <p><strong>Total Amount:</strong> R {total:F2}</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br/>FinLight SA</p>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, subject, body, pdfBytes, $"Quotation-{quotationNumber}.pdf");
    }

    public async Task<bool> SendInvoiceEmailAsync(
        string toEmail,
        string customerName,
        string invoiceNumber,
        decimal total,
        byte[]? pdfBytes = null)
    {
        var subject = $"Invoice {invoiceNumber} from FinLight SA";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Invoice {invoiceNumber}</h2>
                <p>Dear {customerName},</p>
                <p>Please find attached your invoice.</p>
                <p><strong>Total Amount:</strong> R {total:F2}</p>
                <p>Please make payment by the due date indicated on the invoice.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br/>FinLight SA</p>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, subject, body, pdfBytes, $"Invoice-{invoiceNumber}.pdf");
    }
}

