using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GameManagementAPI.Data;
using GameManagementAPI.Models;

namespace GameManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeasonsController : ControllerBase
    {
        private readonly GameContext _context;

        public SeasonsController(GameContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetSeasons([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var totalCount = await _context.Seasons.CountAsync();
            var seasons = await _context.Seasons
                .OrderByDescending(s => s.StartDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    s.Id,
                    s.StartDate,
                    s.IsActive,
                    EventsCount = _context.Events.Count(e => e.SeasonId == s.Id)
                })
                 .ToListAsync();

            return Ok(new
            {
                Seasons = seasons,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Season>> GetSeason(int id)
        {
            var season = await _context.Seasons.FindAsync(id);
            if (season == null) return NotFound();
            return season;
        }

        [HttpPost]
        public async Task<ActionResult<Season>> PostSeason(Season season)
        {
            _context.Seasons.Add(season);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSeason), new { id = season.Id }, season);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutSeason(int id, Season season)
        {
            if (id != season.Id) return BadRequest();
            
            var existingSeason = await _context.Seasons.FindAsync(id);
            if (existingSeason == null) return NotFound();
            
            existingSeason.StartDate = season.StartDate;
            existingSeason.IsActive = season.IsActive;
            
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool SeasonExists(int id)
        {
            return _context.Seasons.Any(e => e.Id == id);
        }

        [HttpGet("{id}/report")]
        public async Task<ActionResult> GetSeasonReport(int id, [FromQuery] bool paidOnly = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (pageSize <= 0) return BadRequest("PageSize must be greater than 0");

            var query = _context.EventParticipants
                .Where(ep => ep.Event.SeasonId == id)
                .GroupBy(ep => ep.Person)
                .Select(g => new
                {
                    Person = new
                    {
                        Id = g.Key.Id,
                        GameName = g.Key.GameName,
                        Name = g.Key.Name,
                        PhoneNumber = g.Key.PhoneNumber
                    },
                    EventsCount = g.Count(),
                    TotalPayment = g.Sum(x => x.Payment),
                    HasPayment = g.Any(x => x.Payment > 0)
                });

            if (paidOnly)
                query = query.Where(p => p.HasPayment);

            var totalCount = await query.CountAsync();
            var totalSum = await query.SumAsync(p => p.TotalPayment);

            var participants = await query
                .OrderBy(p => p.Person.GameName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                Participants = participants,
                TotalCount = totalCount,
                TotalSum = totalSum,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }



    }
}