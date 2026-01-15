using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentToEventParticipant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Payment",
                table: "EventParticipants",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Payment",
                table: "EventParticipants");
        }
    }
}
