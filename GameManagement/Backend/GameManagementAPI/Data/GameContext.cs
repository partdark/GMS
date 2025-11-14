using Microsoft.EntityFrameworkCore;
using GameManagementAPI.Models;

namespace GameManagementAPI.Data
{
    public class GameContext : DbContext
    {
        public GameContext(DbContextOptions<GameContext> options) : base(options) { }

        public DbSet<Person> People { get; set; }
        public DbSet<Season> Seasons { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<EventParticipant> EventParticipants { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EventParticipant>()
                .HasKey(ep => new { ep.EventId, ep.PersonId });

            modelBuilder.Entity<EventParticipant>()
                .HasOne(ep => ep.Event)
                .WithMany(e => e.EventParticipants)
                .HasForeignKey(ep => ep.EventId);

            modelBuilder.Entity<EventParticipant>()
                .HasOne(ep => ep.Person)
                .WithMany(p => p.EventParticipants)
                .HasForeignKey(ep => ep.PersonId);

            modelBuilder.Entity<Event>()
                .HasOne(e => e.Season)
                .WithMany(s => s.Events)
                .HasForeignKey(e => e.SeasonId);
        }
    }
}