using KioskoAPI.Models;
using KioskoAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KioskoAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly UsuariosService _usuariosService;

        public UsuariosController(UsuariosService usuariosService)
        {
            _usuariosService = usuariosService;
        }

        // GET: api/Usuarios
        [HttpGet]
        [Authorize(Roles = "admin")] // Solo el admin puede ver a todos los usuarios
        public async Task<List<Usuario>> Get() =>
            await _usuariosService.GetAsync();

        // GET: api/Usuarios/{id}
        [HttpGet("{id:length(24)}")]
        [Authorize] // Cualquier usuario logueado
        public async Task<ActionResult<Usuario>> Get(string id)
        {
            var usuario = await _usuariosService.GetAsync(id);

            if (usuario is null)
            {
                return NotFound();
            }

            return usuario;
        }

        // DELETE: api/Usuarios/{id}
        [HttpDelete("{id:length(24)}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var usuario = await _usuariosService.GetAsync(id);

            if (usuario is null)
            {
                return NotFound();
            }

            await _usuariosService.RemoveAsync(id);

            return NoContent();
        }
        
        // PUT para que el Admin verifique a un maestro
        [HttpPut("{id:length(24)}/verificar")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> VerificarMaestro(string id)
        {
             var usuario = await _usuariosService.GetAsync(id);
             if (usuario is null) return NotFound();
             
             if (usuario.Rol != "maestro") return BadRequest(new { error = "Solo se puede verificar a usuarios con rol maestro." });
             
             usuario.Verificado = true;
             await _usuariosService.UpdateAsync(id, usuario);
             
             return Ok(new { mensaje = "Maestro verificado correctamente" });
        }

        // PUT general: api/Usuarios/{id}
        [HttpPut("{id:length(24)}")]
        [Authorize] // Logueados
        public async Task<IActionResult> Update(string id, [FromBody] Usuario updatedUsuario)
        {
            var usuario = await _usuariosService.GetAsync(id);
            if (usuario is null) return NotFound();

            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            // Solo puedes editar si eres admin o si eres tú mismo
            if (currentUserRole != "admin" && currentUserId != id)
            {
                return Forbid();
            }

            // Mantenemos datos críticos intactos si no vienen en la petición (opcional pero recomendado)
            updatedUsuario.Id = usuario.Id; 
            if (currentUserRole != "admin")
            {
                // Si no es admin, no puede cambiarse su propio rol o estado de verificado
                updatedUsuario.Rol = usuario.Rol;
                updatedUsuario.Verificado = usuario.Verificado;
            }

            await _usuariosService.UpdateAsync(id, updatedUsuario);

            return NoContent();
        }
    }
}
