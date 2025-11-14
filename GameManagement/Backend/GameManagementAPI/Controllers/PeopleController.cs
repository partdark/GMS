using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GameManagementAPI.Data;
using GameManagementAPI.Models;

namespace GameManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PeopleController : ControllerBase
    {
        private readonly GameContext _context;

        public PeopleController(GameContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetPeople([FromQuery] int page = 1, [FromQuery] int pageSize = 100, [FromQuery] string sortBy = "gameName", [FromQuery] string sortDirection = "asc")
        {
            var totalCount = await _context.People.CountAsync();
            var people = await _context.People
                .ApplySortPeople(sortBy, sortDirection)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            
            return Ok(new { People = people, TotalCount = totalCount, Page = page, PageSize = pageSize });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Person>> GetPerson(int id)
        {
            var person = await _context.People.FindAsync(id);
            if (person == null) return NotFound();
            return person;
        }

        [HttpPost]
        public async Task<ActionResult<Person>> PostPerson(Person person)
        {
            _context.People.Add(person);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPerson), new { id = person.Id }, person);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPerson(int id, Person person)
        {
            if (id != person.Id) return BadRequest();
            
            try
            {
                var existingPerson = await _context.People.FindAsync(id);
                if (existingPerson == null) return NotFound();
                
                existingPerson.GameName = person.GameName;
                existingPerson.Name = person.Name;
                existingPerson.PhoneNumber = person.PhoneNumber;
                if (!string.IsNullOrEmpty(person.Password))
                    existingPerson.Password = person.Password;
                existingPerson.Role = person.Role;
                
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка обновления участника: {ex.Message}");
            }
        }

        [HttpGet("{id}/report")]
        public async Task<ActionResult> GetPersonReport(int id, [FromQuery] int seasonId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string sortBy = "dateTime", [FromQuery] string sortDirection = "desc")
        {
            var query = _context.EventParticipants
                .Where(ep => ep.PersonId == id)
                .Include(ep => ep.Event)
                .Where(ep => ep.Event.SeasonId == seasonId)
                .Select(ep => ep.Event);

            var totalCount = await query.CountAsync();
            var events = await query
                .ApplySortEvents(sortBy, sortDirection)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalSum = await _context.EventParticipants
                .Where(ep => ep.PersonId == id)
                .Include(ep => ep.Event)
                .Where(ep => ep.Event.SeasonId == seasonId)
                .SumAsync(ep => ep.Event.Payment);
            
            return Ok(new
            {
                Events = events,
                TotalCount = totalCount,
                TotalEventsCount = totalCount,
                TotalSum = totalSum,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePerson(int id)
        {
            var person = await _context.People.FindAsync(id);
            if (person == null) return NotFound();
            _context.People.Remove(person);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

public static class PeopleQueryableExtensions
{
    public static IQueryable<Person> ApplySortPeople(this IQueryable<Person> query, string sortBy, string sortDirection)
    {
        return sortBy.ToLower() switch
        {
            "id" => sortDirection == "asc" ? query.OrderBy(p => p.Id) : query.OrderByDescending(p => p.Id),
            "gamename" => sortDirection == "asc" ? query.OrderBy(p => p.GameName) : query.OrderByDescending(p => p.GameName),
            "name" => sortDirection == "asc" ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
            "phonenumber" => sortDirection == "asc" ? query.OrderBy(p => p.PhoneNumber) : query.OrderByDescending(p => p.PhoneNumber),
            "role" => sortDirection == "asc" ? query.OrderBy(p => p.Role) : query.OrderByDescending(p => p.Role),
            _ => query.OrderBy(p => p.GameName)
        };
    }
}

public static class EventsQueryableExtensions
{
    public static IQueryable<Event> ApplySortEvents(this IQueryable<Event> query, string sortBy, string sortDirection)
    {
        return sortBy.ToLower() switch
        {
            "id" => sortDirection == "asc" ? query.OrderBy(e => e.Id) : query.OrderByDescending(e => e.Id),
            "name" => sortDirection == "asc" ? query.OrderBy(e => e.Name) : query.OrderByDescending(e => e.Name),
            "payment" => sortDirection == "asc" ? query.OrderBy(e => e.Payment) : query.OrderByDescending(e => e.Payment),
            "datetime" => sortDirection == "asc" ? query.OrderBy(e => e.DateTime) : query.OrderByDescending(e => e.DateTime),
            _ => query.OrderByDescending(e => e.DateTime)
        };
    }
}