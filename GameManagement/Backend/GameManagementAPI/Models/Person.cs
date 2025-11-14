using System.ComponentModel.DataAnnotations;

namespace GameManagementAPI.Models
{
    public class Person
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string GameName { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string? PhoneNumber { get; set; }
        
        [StringLength(100)]
        public string? Name { get; set; }
        
        [StringLength(100)]
        public string? Password { get; set; }
        
        [StringLength(20)]
        public string Role { get; set; } = "user";
        
        public virtual ICollection<EventParticipant> EventParticipants { get; set; } = new List<EventParticipant>();
    }
}