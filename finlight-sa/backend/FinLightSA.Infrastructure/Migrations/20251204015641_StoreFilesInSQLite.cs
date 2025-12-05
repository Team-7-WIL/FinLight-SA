using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinLightSA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class StoreFilesInSQLite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReceiptContentType",
                table: "expenses",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "ReceiptData",
                table: "expenses",
                type: "BLOB",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptFileName",
                table: "expenses",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "bank_statements",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "FileData",
                table: "bank_statements",
                type: "BLOB",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_BusinessId",
                table: "audit_logs",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_UserId",
                table: "audit_logs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_logs_businesses_BusinessId",
                table: "audit_logs",
                column: "BusinessId",
                principalTable: "businesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_audit_logs_users_UserId",
                table: "audit_logs",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_logs_businesses_BusinessId",
                table: "audit_logs");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_logs_users_UserId",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_BusinessId",
                table: "audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_audit_logs_UserId",
                table: "audit_logs");

            migrationBuilder.DropColumn(
                name: "ReceiptContentType",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "ReceiptData",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "ReceiptFileName",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "bank_statements");

            migrationBuilder.DropColumn(
                name: "FileData",
                table: "bank_statements");
        }
    }
}
