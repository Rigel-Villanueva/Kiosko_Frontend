using KioskoAPI.Models;
using KioskoAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KioskoAPI.Controllers
{
    /// <summary>
    /// Gestión de Usuarios: Permite listar, editar, eliminar y validar roles como Maestro, Administrador y Estudiante.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly UsuariosService _usuariosService;

        public UsuariosController(UsuariosService usuariosService)
        {
            _usuariosService = usuariosService;
        }

        /// <summary>
        /// Obtiene la lista de todos los usuarios registrados en el Kiosko. (Solo Administradores)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "admin")] // Solo el admin puede ver a todos los usuarios
        public async Task<List<Usuario>> Get() =>
            await _usuariosService.GetAsync();

        /// <summary>
        /// Obtiene los detalles de un usuario en particular proporcionando su ID. (Cualquier rol)
        /// </summary>
        /// <param name="id">ID de MongoDB del usuario</param>
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

        /// <summary>
        /// Elimina físicamente a un usuario del sistema mediante su ID. (Solo Administradores)
        /// </summary>
        /// <param name="id">ID de MongoDB del usuario a eliminar</param>
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
        
        /// <summary>
        /// Permite a un Administrador aprobar la cuenta de un Maestro, otorgándole permisos para calificar proyectos.
        /// </summary>
        /// <param name="id">ID de MongoDB del maestro</param>
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

        /// <summary>
        /// Actualiza los datos generales de un usuario. (El Administrador puede editar a cualquiera; los demás solo a sí mismos).
        /// </summary>
        /// <param name="id">ID de MongoDB del usuario</param>
        /// <param name="updatedUsuario">Atributos actualizados del usuario</param>
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
