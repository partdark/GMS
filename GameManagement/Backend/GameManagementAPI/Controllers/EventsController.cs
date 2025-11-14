using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GameManagementAPI.Data;
using GameManagementAPI.Models;
using System.Linq.Expressions;

namespace GameManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly GameContext _context;

        public EventsController(GameContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] int? seasonId = null, [FromQuery] string sortBy = "dateTime", [FromQuery] string sortDirection = "desc")
        {
            var query = _context.Events.AsQueryable();
            
            if (seasonId.HasValue)
                query = query.Where(e => e.SeasonId == seasonId.Value);
            
            var totalCount = await query.CountAsync();
            
            var events = await query
                .ApplySort(sortBy, sortDirection)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.SeasonId,
                    e.Payment,
                    e.DateTime,
                    ParticipantCount = e.EventParticipants.Count()
                })
                .ToListAsync();
            
            return Ok(new
            {
                Events = events,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Event>> GetEvent(int id)
        {
            var eventItem = await _context.Events.FindAsync(id);
            if (eventItem == null) return NotFound();
            return eventItem;
        }

        [HttpPost]
        public async Task<ActionResult<Event>> PostEvent(Event eventItem)
        {
            var season = await _context.Seasons.FindAsync(eventItem.SeasonId);
            if (season == null || !season.IsActive)
            {
                return BadRequest("События можно создавать только в активном сезоне");
            }
            
            eventItem.Season = null;
            eventItem.EventParticipants = new List<EventParticipant>();
            _context.Events.Add(eventItem);
            await _context.SaveChangesAsync();
            return Ok(eventItem);
        }

        [HttpPost("{eventId}/participants/{personId}")]
        public async Task<IActionResult> AddParticipant(int eventId, int personId)
        {
            var participant = new EventParticipant { EventId = eventId, PersonId = personId };
            _context.EventParticipants.Add(participant);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("{eventId}/participants")]
        public async Task<ActionResult<IEnumerable<Person>>> GetEventParticipants(int eventId)
        {
            var participants = await _context.EventParticipants
                .Where(ep => ep.EventId == eventId)
                .Select(ep => ep.Person)
                .ToListAsync();
            return Ok(participants);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutEvent(int id, Event eventItem)
        {
            if (id != eventItem.Id) return BadRequest();
            
            try
            {
                var existingEvent = await _context.Events.FindAsync(id);
                if (existingEvent == null) return NotFound();
                
                var season = await _context.Seasons.FindAsync(eventItem.SeasonId);
                if (season == null || !season.IsActive)
                {
                    return BadRequest("События можно редактировать только в активном сезоне");
                }
                
                existingEvent.Name = eventItem.Name;
                existingEvent.Payment = eventItem.Payment;
                existingEvent.DateTime = eventItem.DateTime;
                existingEvent.SeasonId = eventItem.SeasonId;
                
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка обновления события: {ex.Message}");
            }
        }

        private bool EventExists(int id)
        {
            return _context.Events.Any(e => e.Id == id);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var eventItem = await _context.Events
                .Include(e => e.EventParticipants)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (eventItem == null) return NotFound();
            
            _context.Events.Remove(eventItem);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{eventId}/participants/{personId}")]
        public async Task<IActionResult> RemoveParticipant(int eventId, int personId)
        {
            var participant = await _context.EventParticipants
                .FirstOrDefaultAsync(ep => ep.EventId == eventId && ep.PersonId == personId);
            if (participant == null) return NotFound();
            _context.EventParticipants.Remove(participant);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

public static class QueryableExtensions
{
    public static IQueryable<Event> ApplySort(this IQueryable<Event> query, string sortBy, string sortDirection)
    {
        return sortBy.ToLower() switch
        {
            "id" => sortDirection == "asc" ? query.OrderBy(e => e.Id) : query.OrderByDescending(e => e.Id),
            "name" => sortDirection == "asc" ? query.OrderBy(e => e.Name) : query.OrderByDescending(e => e.Name),
            "seasonid" => sortDirection == "asc" ? query.OrderBy(e => e.SeasonId) : query.OrderByDescending(e => e.SeasonId),
            "payment" => sortDirection == "asc" ? query.OrderBy(e => e.Payment) : query.OrderByDescending(e => e.Payment),
            "datetime" => sortDirection == "asc" ? query.OrderBy(e => e.DateTime) : query.OrderByDescending(e => e.DateTime),
            _ => query.OrderByDescending(e => e.DateTime)
        };
    }
}