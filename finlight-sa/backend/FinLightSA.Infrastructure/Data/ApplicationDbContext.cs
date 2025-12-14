using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.Models;
using Google.Api;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection.Emit;
using System.Security.Claims;
using System.Text;

namespace FinLightSA.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Business> Businesses { get; set; }
    public DbSet<UserBusinessRole> UserBusinessRoles { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<ProductCategory> ProductCategories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceItem> InvoiceItems { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<PaymentAllocation> PaymentAllocations { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<BankStatement> BankStatements { get; set; }
    public DbSet<BankTransaction> BankTransactions { get; set; }
    public DbSet<AiFeedback> AiFeedbacks { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
        });

        // Business configuration
        modelBuilder.Entity<Business>(entity =>
        {
            entity.ToTable("businesses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
        });

        // UserBusinessRole configuration
        modelBuilder.Entity<UserBusinessRole>(entity =>
        {
            entity.ToTable("user_business_roles");
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.User)
                .WithMany(u => u.BusinessRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Business)
                .WithMany(b => b.UserRoles)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Customer configuration
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("customers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);

            entity.HasOne(e => e.Business)
                .WithMany(b => b.Customers)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ProductCategory configuration
        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.ToTable("product_categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);

            entity.HasOne(e => e.Business)
                .WithMany(b => b.ProductCategories)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);

            entity.HasOne(e => e.Business)
                .WithMany(b => b.Products)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ProductCategory)
                .WithMany(pc => pc.Products)
                .HasForeignKey(e => e.ProductCategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Invoice configuration
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.ToTable("invoices");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Number).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.VatAmount).HasPrecision(18, 2);
            entity.Property(e => e.Total).HasPrecision(18, 2);

            entity.HasOne(e => e.Business)
                .WithMany(b => b.Invoices)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Customer)
                .WithMany(c => c.Invoices)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // InvoiceItem configuration
        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.ToTable("invoice_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.VatRate).HasPrecision(5, 4);
            entity.Property(e => e.LineTotal).HasPrecision(18, 2);

            entity.HasOne(e => e.Invoice)
                .WithMany(i => i.Items)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                .WithMany(p => p.InvoiceItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Payment configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("payments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 2);

            entity.HasOne(e => e.Business)
                .WithMany()
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Customer)
                .WithMany(c => c.Payments)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // PaymentAllocation configuration
        modelBuilder.Entity<PaymentAllocation>(entity =>
        {
            entity.ToTable("payment_allocations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 2);

            entity.HasOne(e => e.Payment)
                .WithMany(p => p.Allocations)
                .HasForeignKey(e => e.PaymentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Invoice)
                .WithMany(i => i.PaymentAllocations)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Expense configuration
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.ToTable("expenses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 2);

            entity.HasOne(e => e.Business)
                .WithMany(b => b.Expenses)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Expenses)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // BankStatement configuration
        modelBuilder.Entity<BankStatement>(entity =>
        {
            entity.ToTable("bank_statements");
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Business)
                .WithMany(b => b.BankStatements)
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // BankTransaction configuration
        modelBuilder.Entity<BankTransaction>(entity =>
        {
            entity.ToTable("bank_transactions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.ConfidenceScore).HasPrecision(5, 4);

            entity.HasOne(e => e.BankStatement)
                .WithMany(bs => bs.Transactions)
                .HasForeignKey(e => e.BankStatementId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AiFeedback configuration
        modelBuilder.Entity<AiFeedback>(entity =>
        {
            entity.ToTable("ai_feedback");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ConfidenceScore).HasPrecision(5, 4);
        });

        // AuditLog configuration
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_logs");
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Business)
                .WithMany()
                .HasForeignKey(e => e.BusinessId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
