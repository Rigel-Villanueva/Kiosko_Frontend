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
            var mongoUrl = new MongoUrl(kioskoDatabaseSettings.Value.ConnectionString);
            var settings = MongoClientSettings.FromUrl(mongoUrl);

            // Evitar validación estricta SSL de Windows local
            settings.SslSettings = new SslSettings
            {
                ServerCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true,
                EnabledSslProtocols = System.Security.Authentication.SslProtocols.Tls12
            };

            var mongoClient = new MongoClient(settings);
            var mongoDatabase = mongoClient.GetDatabase(kioskoDatabaseSettings.Value.DatabaseName);
            _proyectosCollection = mongoDatabase.GetCollection<Proyecto>(kioskoDatabaseSettings.Value.ProjectsCollectionName);
        }

        public async Task<List<Proyecto>> GetAsync() =>
            await _proyectosCollection.Find(_ => true).ToListAsync();

        public async Task<Proyecto?> GetAsync(string id) =>
            await _proyectosCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
    }
}
