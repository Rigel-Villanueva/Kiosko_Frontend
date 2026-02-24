using KioskoAPI.Models;
using KioskoAPI.Services;
using Microsoft.AspNetCore.Mvc;

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

        [HttpGet]
        public async Task<List<Proyecto>> Get() =>
            await _proyectosService.GetAsync();

        [HttpGet("{id:length(24)}")]
        public async Task<ActionResult<Proyecto>> Get(string id)
        {
            var proyecto = await _proyectosService.GetAsync(id);

            if (proyecto is null)
            {
                return NotFound();
            }

            return proyecto;
        }
    }
}
