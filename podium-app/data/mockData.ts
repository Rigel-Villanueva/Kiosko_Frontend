// Mock data — listo para reemplazar con llamadas a la API REST de tu compañero
export type UserRole = "alumno" | "docente";

export interface User {
    id: string;
    nombre: string;
    email: string;
    rol: UserRole;
    avatar?: string;
    grupo?: string; // para alumnos
    materia?: string; // para docentes
}

export interface Proyecto {
    id: string;
    titulo: string;
    descripcion: string;
    tecnologias: string[];
    alumnoId: string;
    alumnoNombre: string;
    alumnoEmail: string;
    grupo: string;
    docenteId?: string;
    docenteNombre?: string;
    visibilidad: "publico" | "privado";
    imagen?: string;
    demoUrl?: string;
    codigoUrl?: string;
    calificacion?: number; // 1-5 estrellas
    retroalimentacion?: string;
    fechaCreacion: string;
    estado: "pendiente" | "evaluado";
}

// Mock usuarios
export const MOCK_USUARIOS: User[] = [
    {
        id: "u1",
        nombre: "Ana García López",
        email: "ana.garcia@universidad.edu",
        rol: "alumno",
        grupo: "5C",
        avatar: undefined,
    },
    {
        id: "u2",
        nombre: "Carlos Méndez Ruiz",
        email: "carlos.mendez@universidad.edu",
        rol: "alumno",
        grupo: "4B",
        avatar: undefined,
    },
    {
        id: "u3",
        nombre: "Dr. Jorge Hernández",
        email: "jorge.hernandez@universidad.edu",
        rol: "docente",
        materia: "Arquitecturas Web y Orientadas a Servicios",
        avatar: undefined,
    },
    {
        id: "u4",
        nombre: "Mtra. Sandra Vidal",
        email: "sandra.vidal@universidad.edu",
        rol: "docente",
        materia: "Desarrollo de Aplicaciones Móviles",
        avatar: undefined,
    },
];

// Mock proyectos
export const MOCK_PROYECTOS: Proyecto[] = [
    {
        id: "p1",
        titulo: "Sistema de Inventario con React",
        descripcion:
            "Aplicación web para gestión de inventario con CRUD completo, reportes en PDF y autenticación JWT. Desarrollada como proyecto final de la materia de Arquitecturas Web.",
        tecnologias: ["React", "Node.js", "MongoDB", "Express", "JWT"],
        alumnoId: "u1",
        alumnoNombre: "Ana García López",
        alumnoEmail: "ana.garcia@universidad.edu",
        grupo: "5C",
        docenteId: "u3",
        docenteNombre: "Dr. Jorge Hernández",
        visibilidad: "publico",
        demoUrl: "https://inventario-demo.vercel.app",
        codigoUrl: "https://github.com/ana/inventario",
        calificacion: 5,
        retroalimentacion:
            "Excelente implementación de la arquitectura REST. El código está bien estructurado y la documentación es clara. Puntos de mejora: agregar tests unitarios y mejorar el manejo de errores en el frontend.",
        fechaCreacion: "2026-02-10T09:00:00Z",
        estado: "evaluado",
    },
    {
        id: "p2",
        titulo: "App de Tareas con Flutter",
        descripcion:
            "Aplicación móvil de gestión de tareas con sincronización en tiempo real usando Firebase. Incluye notificaciones push y modo offline.",
        tecnologias: ["Flutter", "Dart", "Firebase", "Firestore"],
        alumnoId: "u2",
        alumnoNombre: "Carlos Méndez Ruiz",
        alumnoEmail: "carlos.mendez@universidad.edu",
        grupo: "4B",
        docenteId: "u4",
        docenteNombre: "Mtra. Sandra Vidal",
        visibilidad: "publico",
        demoUrl: undefined,
        codigoUrl: "https://github.com/carlos/flutter-tasks",
        calificacion: 4,
        retroalimentacion:
            "Buen manejo del estado con Provider. La UI es limpia y funcional. Mejorar la experiencia de sincronización offline.",
        fechaCreacion: "2026-02-15T10:30:00Z",
        estado: "evaluado",
    },
    {
        id: "p3",
        titulo: "API REST para E-commerce",
        descripcion:
            "Backend completo para tienda en línea con autenticación, carrito, pagos con Stripe y panel de administración. Arquitectura en microservicios.",
        tecnologias: ["Node.js", "Express", "PostgreSQL", "Docker", "Stripe"],
        alumnoId: "u1",
        alumnoNombre: "Ana García López",
        alumnoEmail: "ana.garcia@universidad.edu",
        grupo: "5C",
        docenteId: "u3",
        docenteNombre: "Dr. Jorge Hernández",
        visibilidad: "publico",
        demoUrl: "https://ecommerce-api.railway.app",
        codigoUrl: "https://github.com/ana/ecommerce-api",
        fechaCreacion: "2026-02-20T14:00:00Z",
        estado: "pendiente",
    },
    {
        id: "p4",
        titulo: "Dashboard de Análisis con Python",
        descripcion:
            "Sistema de visualización de datos con gráficas interactivas usando Dash y Plotly. Analiza datos de ventas ficticias con ML.",
        tecnologias: ["Python", "Dash", "Plotly", "Pandas", "Scikit-learn"],
        alumnoId: "u2",
        alumnoNombre: "Carlos Méndez Ruiz",
        alumnoEmail: "carlos.mendez@universidad.edu",
        grupo: "4B",
        docenteId: "u4",
        docenteNombre: "Mtra. Sandra Vidal",
        visibilidad: "publico",
        fechaCreacion: "2026-02-22T11:00:00Z",
        estado: "pendiente",
    },
];

// Función helper — reemplazar con fetch() a la API de tu compañero
export const getProyectosByDocente = (docenteId: string) =>
    MOCK_PROYECTOS.filter((p) => p.docenteId === docenteId);

export const getProyectosPendientes = (docenteId: string) =>
    MOCK_PROYECTOS.filter(
        (p) => p.docenteId === docenteId && p.estado === "pendiente"
    );

export const getProyectosByAlumno = (alumnoId: string) =>
    MOCK_PROYECTOS.filter((p) => p.alumnoId === alumnoId);

export const getProyectoById = (id: string) =>
    MOCK_PROYECTOS.find((p) => p.id === id);
