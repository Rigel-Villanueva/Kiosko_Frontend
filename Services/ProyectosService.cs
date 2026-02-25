using KioskoAPI.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace KioskoAPI.Services
{
    public class ProyectosService
    {
        private readonly IMongoCollection<Proyecto> _proyectosCollection;

        public ProyectosService(IOptions<KioskoDatabaseSettings> kioskoDatabaseSettings)
        {
            var mongoClient = new MongoClient(kioskoDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(kioskoDatabaseSettings.Value.DatabaseName);
            _proyectosCollection = mongoDatabase.GetCollection<Proyecto>(kioskoDatabaseSettings.Value.ProjectsCollectionName);
        }

        public async Task<List<Proyecto>> GetAsync() =>
            await _proyectosCollection.Find(_ => true).ToListAsync();

        public async Task<List<Proyecto>> GetAprobadosAsync() =>
            await _proyectosCollection.Find(x => x.Estatus == "aprobado" || x.Estatus == "evaluado").ToListAsync();

        public async Task<List<Proyecto>> GetMisProyectosAsync(string correo) =>
            await _proyectosCollection.Find(x => x.AutoresCorreos.Contains(correo)).ToListAsync();

        public async Task<Proyecto?> GetAsync(string id) =>
            await _proyectosCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task CreateAsync(Proyecto nuevoProyecto) =>
            await _proyectosCollection.InsertOneAsync(nuevoProyecto);

        public async Task UpdateAsync(string id, Proyecto updatedProyecto) =>
            await _proyectosCollection.ReplaceOneAsync(x => x.Id == id, updatedProyecto);

        public async Task AprobarProyectoAsync(string id)
        {
            var filter = Builders<Proyecto>.Filter.Eq(p => p.Id, id);
            var update = Builders<Proyecto>.Update.Set(p => p.Estatus, "aprobado");
            await _proyectosCollection.UpdateOneAsync(filter, update);
        }

        public async Task RemoveAsync(string id) =>
            await _proyectosCollection.DeleteOneAsync(x => x.Id == id);
    }
}
