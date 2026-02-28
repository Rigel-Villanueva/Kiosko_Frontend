using KioskoAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace KioskoAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadsController : ControllerBase
    {
        private readonly SupabaseStorageService _storageService;

        public UploadsController(SupabaseStorageService storageService)
        {
            _storageService = storageService;
        }

        // POST: api/Uploads
        [HttpPost]
        [Authorize(Roles = "estudiante")] // Solo los estudiantes deberían estar subiendo archivos de proyecto
        public async Task<IActionResult> UploadFile(IFormFile requestFile)
        {
            try
            {
                if (requestFile == null || requestFile.Length == 0)
                {
                    return BadRequest(new { mensaje = "No se proporcionó ningún archivo o el archivo está vacío." });
                }

                // Llamamos a nuestro servicio de Supabase
                string publicUrl = await _storageService.UploadFileAsync(requestFile);

                // Devolvemos la URL pública recién generada para que el Frontend la guarde en el JSON del Proyecto
                return Ok(new { url = publicUrl });
            }
            catch (Exception ex)
            {
                // Envolvemos en un 500 para atrapar errores de red o permisos de Supabase
                return StatusCode(500, new { mensaje = "Error al subir el archivo a Storage", detalle = ex.Message });
            }
        }
    }
}
