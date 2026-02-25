using KioskoAPI.Models;
using KioskoAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace KioskoAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] Usuario nuevoUsuario)
        {
            try
            {
                var usuario = await _authService.RegisterAsync(nuevoUsuario);
                return CreatedAtAction(nameof(Register), new { id = usuario.Id }, new { mensaje = "Usuario registrado exitosamente", usuario });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var token = await _authService.LoginAsync(request.Correo, request.Password);

            if (token == null)
                return Unauthorized(new { error = "Correo o contraseña incorrectos" });

            return Ok(new { Token = token });
        }
    }

    // DTO simple para recibir el login body logic
    public class LoginRequest
    {
        public string Correo { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
