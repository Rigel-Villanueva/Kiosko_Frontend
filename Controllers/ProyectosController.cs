using KioskoAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace KioskoAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProyectosController : ControllerBase
    {
        private readonly IMongoCollection<Proyecto> _proyectosCollection;

        public ProyectosController(IOptions<KioskoDatabaseSettings> settings)
        {
            var mongoClient = new MongoClient(settings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(settings.Value.DatabaseName);
            _proyectosCollection = mongoDatabase.GetCollection<Proyecto>(settings.Value.CollectionName);
        }

        [HttpGet]
        public async Task<List<Proyecto>> Get() =>
            await _proyectosCollection.Find(_ => true).ToListAsync();
    }
}
