using KioskoAPI.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace KioskoAPI.Services
{
    public class UsuariosService
    {
        private readonly IMongoCollection<Usuario> _usuariosCollection;

        public UsuariosService(IOptions<KioskoDatabaseSettings> kioskoDatabaseSettings)
        {
            var mongoClient = new MongoClient(kioskoDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(kioskoDatabaseSettings.Value.DatabaseName);
            _usuariosCollection = mongoDatabase.GetCollection<Usuario>(kioskoDatabaseSettings.Value.UsersCollectionName);
        }

        public async Task<List<Usuario>> GetAsync() =>
            await _usuariosCollection.Find(_ => true).ToListAsync();

        public async Task<Usuario?> GetAsync(string id) =>
            await _usuariosCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task<Usuario?> GetByCorreoAsync(string correo) =>
            await _usuariosCollection.Find(x => x.Correo == correo).FirstOrDefaultAsync();

        public async Task CreateAsync(Usuario newUsuario) =>
            await _usuariosCollection.InsertOneAsync(newUsuario);

        public async Task UpdateAsync(string id, Usuario updatedUsuario) =>
            await _usuariosCollection.ReplaceOneAsync(x => x.Id == id, updatedUsuario);

        public async Task RemoveAsync(string id) =>
            await _usuariosCollection.DeleteOneAsync(x => x.Id == id);
    }
}
