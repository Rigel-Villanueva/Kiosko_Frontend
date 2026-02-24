namespace KioskoAPI.Models
{
    public class KioskoDatabaseSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string ProjectsCollectionName { get; set; } = null!;
        public string UsersCollectionName { get; set; } = null!;
    }
}