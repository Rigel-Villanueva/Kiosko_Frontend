using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace KioskoAPI.Models
{
    [BsonIgnoreExtraElements]
    public class Proyecto
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("nombre")]
        public string Nombre { get; set; } = null!;

        [BsonElement("tipo_app")]
        public string TipoApp { get; set; } = null!;

        [BsonElement("descripcion")]
        public string Descripcion { get; set; } = null!;

        [BsonElement("autores")]
        public List<string> Autores { get; set; } = new();

        [BsonElement("estatus")]
        public string Estatus { get; set; } = null!;

        [BsonElement("calificacion_promedio")]
        public double Calificacion { get; set; }

        [BsonElement("criterios_evaluacion")]
        public List<Criterio> Criterios { get; set; } = new();

        [BsonElement("recursos_multimedia")]
        public List<Recurso> Recursos { get; set; } = new();
        
        [BsonElement("repositorio_codigo")]
        public Repositorio Codigo { get; set; } = new();

        [BsonElement("reseñas")]
        public List<Reseña> Reseñas { get; set; } = new();
    }

    [BsonIgnoreExtraElements]
    public class Criterio {
        [BsonElement("aspecto")]
        public string Aspecto { get; set; } = null!;

        [BsonElement("puntaje_max")]
        public double PuntajeMax { get; set; }

        [BsonElement("obtenido")]
        public double Obtenido { get; set; }

        [BsonElement("comentario")]
        public string Comentario { get; set; } = "";
    }

    [BsonIgnoreExtraElements]
    public class Recurso {
        [BsonElement("tipo")]
        public string Tipo { get; set; } = null!;

        [BsonElement("titulo")]
        public string Titulo { get; set; } = null!;

        [BsonElement("url")]
        public string Url { get; set; } = null!;
    }

    [BsonIgnoreExtraElements]
    public class Repositorio {
        [BsonElement("plataforma")]
        public string Plataforma { get; set; } = null!;

        [BsonElement("url")]
        public string Url { get; set; } = null!;

        [BsonElement("lenguajes")]
        public List<string> Lenguajes { get; set; } = new();

        [BsonElement("frameworks")]
        public List<string> Frameworks { get; set; } = new();
    }

    [BsonIgnoreExtraElements]
    public class Reseña {
        [BsonElement("usuario")]
        public string Usuario { get; set; } = null!;

        [BsonElement("comentario")]
        public string Comentario { get; set; } = null!;

        [BsonElement("estrellas")]
        public int Estrellas { get; set; }
    }
}
