using KioskoAPI.Models;
using KioskoAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace KioskoAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProyectosController : ControllerBase
    {
        private readonly ProyectosService _proyectosService;

        public ProyectosController(ProyectosService proyectosService)
        {
            _proyectosService = proyectosService;
        }

        // GET: api/Proyectos (Público, solo aprobados)
        [HttpGet]
        public async Task<List<Proyecto>> GetAprobados() =>
            await _proyectosService.GetAprobadosAsync();

        // GET: api/Proyectos/todos (Solo Admin)
        [HttpGet("todos")]
        [Authorize(Roles = "admin")]
        public async Task<List<Proyecto>> GetAll() =>
            await _proyectosService.GetAsync();

        // GET: api/Proyectos/mis-proyectos (Ver mis propios proyectos, solo logueados)
        [HttpGet("mis-proyectos")]
        [Authorize]
        public async Task<List<Proyecto>> GetMisProyectos()
        {
            var correo = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(correo)) return new List<Proyecto>();

            return await _proyectosService.GetMisProyectosAsync(correo);
        }

        // GET: api/Proyectos/{id} (Público, ver detalles de uno aprobado)
        [HttpGet("{id:length(24)}")]
        public async Task<ActionResult<Proyecto>> Get(string id)
        {
            var proyecto = await _proyectosService.GetAsync(id);
            if (proyecto is null) return NotFound();
            return proyecto;
        }

        // POST: api/Proyectos (Solo estudiantes pueden subir)
        [HttpPost]
        [Authorize(Roles = "estudiante")]
        public async Task<IActionResult> Post([FromBody] Proyecto nuevoProyecto)
        {
            // Setear el ID del creador leyendo el token JWT
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var correo = User.FindFirst(ClaimTypes.Email)?.Value;

            if (userId == null || correo == null) return Unauthorized();

            nuevoProyecto.SubidoPor = userId;
            nuevoProyecto.Estatus = "pendiente"; // Obligamos a que inicie pendiente
            nuevoProyecto.FechaCreacion = DateTime.UtcNow;

            // Aseguramos que el creador esté en la lista de autores
            if (!nuevoProyecto.AutoresCorreos.Contains(correo))
            {
                nuevoProyecto.AutoresCorreos.Add(correo);
            }

            await _proyectosService.CreateAsync(nuevoProyecto);

            return CreatedAtAction(nameof(Get), new { id = nuevoProyecto.Id }, nuevoProyecto);
        }

        // PUT: api/Proyectos/{id}/aprobar (Solo Admin aprueba)
        [HttpPut("{id:length(24)}/aprobar")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Aprobar(string id)
        {
            var proyecto = await _proyectosService.GetAsync(id);
            if (proyecto is null) return NotFound();

            await _proyectosService.AprobarProyectoAsync(id);
            return Ok(new { mensaje = "Proyecto aprobado y publicado en el Kiosko" });
        }

        // DELETE: api/Proyectos/{id} (Admin o el propio estudiante que lo subió)
        [HttpDelete("{id:length(24)}")]
        [Authorize]
        public async Task<IActionResult> Delete(string id)
        {
            var proyecto = await _proyectosService.GetAsync(id);
            if (proyecto is null) return NotFound();

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (userRole != "admin" && proyecto.SubidoPor != userId)
            {
                return Forbid(); // No eres admin y no subiste tú este proyecto
            }

            await _proyectosService.RemoveAsync(id);
            return NoContent();
        }
    }
}
