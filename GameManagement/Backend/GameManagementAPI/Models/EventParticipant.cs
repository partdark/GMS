namespace GameManagementAPI.Models
{
    public class EventParticipant
    {
        public int EventId { get; set; }
        public int PersonId { get; set; }
        public decimal Payment { get; set; }
        
        public virtual Event Event { get; set; } = null!;
        public virtual Person Person { get; set; } = null!;
    }
}