using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordAndRoleToPerson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Password",
                table: "People",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "People",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Password",
                table: "People");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "People");
        }
    }
}
