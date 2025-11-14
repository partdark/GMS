using System.ComponentModel.DataAnnotations;

namespace GameManagementAPI.Models
{
    public class Event
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public int SeasonId { get; set; }
        
        [Required]
        public decimal Payment { get; set; }
        
        [Required]
        public DateTime DateTime { get; set; } = DateTime.Now;
        
        public virtual Season? Season { get; set; }
        public virtual ICollection<EventParticipant> EventParticipants { get; set; } = new List<EventParticipant>();
    }
}