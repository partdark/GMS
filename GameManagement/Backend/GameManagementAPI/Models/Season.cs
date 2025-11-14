using System.ComponentModel.DataAnnotations;

namespace GameManagementAPI.Models
{
    public class Season
    {
        public int Id { get; set; }
        
        [Required]
        public DateTime StartDate { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public virtual ICollection<Event> Events { get; set; } = new List<Event>();
    }
}