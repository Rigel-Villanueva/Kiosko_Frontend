import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Project, Comment, EvaluacionDocente } from "@/lib/types";

export const API_URL = "https://kiosko-api.onrender.com/api";
const TOKEN_KEY = "podium_auth_token";

async function getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

/**
 * Mapea la respuesta del backend (snake_case C#-Mongo) a nuestro tipo Project UI.
 * El backend devuelve propiedades en camelCase cuando serializa desde C#.
 */
function mapProject(p: any): Project {
    // Los proyectos "aprobados" o "evaluados" son los visibles en el feed
    const evidencias = p.evidencias || p.Evidencias || {};
    return {
        id: p.id || p.Id || p._id || "",
        nombre: p.nombre || p.Nombre || "Sin título",
        descripcion: p.descripcion || p.Descripcion || "",
        subido_por: p.subidoPor || p.subido_por || p.SubidoPor || "",
        fecha_creacion:
            p.fechaCreacion || p.fecha_creacion || p.FechaCreacion || new Date().toISOString(),
        autores_correos: p.autoresCorreos || p.autores_correos || p.AutoresCorreos || [],
        estatus: (p.estatus || p.Estatus || "pendiente").toLowerCase(),
        promedio_general: p.promedioGeneral ?? p.promedio_general ?? p.PromedioGeneral ?? 0,
        evidencias: {
            repositorio_git:
                evidencias.repositorioGit || evidencias.repositorio_git || evidencias.RepositorioGit || "",
            videos: (evidencias.videos || evidencias.Videos || []).map((v: any) => ({
                titulo: v.titulo || v.Titulo || "",
                url: v.url || v.Url || "",
            })),
            imagenes: evidencias.imagenes || evidencias.Imagenes || [],
            documentos_pdf: evidencias.documentosPdf || evidencias.documentos_pdf || evidencias.DocumentosPdf || [],
            diapositivas: evidencias.diapositivas || evidencias.Diapositivas || "",
        },
        evaluaciones_docentes: (
            p.evaluacionesDocentes || p.evaluaciones_docentes || p.EvaluacionesDocentes || []
        ).map((e: any) => ({
            maestro_id: e.maestroId || e.maestro_id || e.MaestroId || "",
            nombre_maestro: e.nombreMaestro || e.nombre_maestro || e.NombreMaestro || "",
            fecha_evaluacion:
                e.fechaEvaluacion || e.fecha_evaluacion || e.FechaEvaluacion || "",
            promedio_por_maestro:
                e.promedioPorMaestro ?? e.promedio_por_maestro ?? e.PromedioPorMaestro ?? 0,
            retroalimentacion_final:
                e.retroalimentacionFinal || e.retroalimentacion_final || e.RetroalimentacionFinal || "",
            rubrica: (e.rubrica || e.Rubrica || []).map((r: any) => ({
                criterio: r.criterio || r.Criterio || "",
                puntos_max: r.puntosMax ?? r.puntos_max ?? r.PuntosMax ?? 0,
                obtenido: r.obtenido ?? r.Obtenido ?? 0,
                obs: r.obs || r.Obs || "",
            })),
        })),
        // ── extras para la UI ──
        category: p.category || "General",
        image:
            p.image ||
            (evidencias.imagenes?.[0]) ||
            (evidencias.Imagenes?.[0]) ||
            `https://picsum.photos/seed/${p.id || Math.random().toString(36).slice(2)}/400/300`,
        authorName:
            p.authorName ||
            p.nombre ||
            (p.autoresCorreos?.[0] || p.autores_correos?.[0] || "Desconocido"),
        authorAvatar: p.authorAvatar || "",
        communityRating: p.communityRating ?? 0,
        comments: p.comments || [],
        assignedTeacherId: p.assignedTeacherId || undefined,
    };
}

interface AppContextType {
    projects: Project[];
    isLoading: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    loadProjects: () => Promise<void>;
    getProject: (id: string) => Project | undefined;
    getMisProyectos: () => Promise<Project[]>;
    addProject: (data: Partial<Project>) => Promise<{ ok: boolean; error?: string }>;
    updateProyecto: (id: string, data: Partial<Project>) => Promise<{ ok: boolean; error?: string }>;
    addComment: (projectId: string, comment: Omit<Comment, "id">) => void;
    submitEvaluation: (
        projectId: string,
        evaluation: EvaluacionDocente
    ) => Promise<{ ok: boolean; error?: string }>;
    uploadFile: (fileUri: string, fileName: string, mimeType: string) => Promise<string>;
    // ── Admin ──
    getAllProyectos: () => Promise<Project[]>;
    aprobarProyecto: (id: string) => Promise<{ ok: boolean; error?: string }>;
    eliminarProyecto: (id: string) => Promise<{ ok: boolean; error?: string }>;
    getAllUsuarios: () => Promise<any[]>;
    verificarMaestro: (id: string) => Promise<{ ok: boolean; error?: string }>;
    eliminarUsuario: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    /**
     * GET /api/Proyectos
     * Devuelve proyectos con estatus "aprobado" o "evaluado" (feed público)
     */
    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_URL}/Proyectos`, { headers });
            if (res.ok) {
                const data = await res.json();
                setProjects(Array.isArray(data) ? data.map(mapProject) : []);
            }
        } catch (e) {
            console.error("loadProjects error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * GET /api/Proyectos/mis-proyectos (Requiere auth)
     * Devuelve todos los proyectos del usuario logueado (cualquier estatus)
     */
    const getMisProyectos = async (): Promise<Project[]> => {
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_URL}/Proyectos/mis-proyectos`, { headers });
            if (res.ok) {
                const data = await res.json();
                return Array.isArray(data) ? data.map(mapProject) : [];
            }
        } catch { }
        return [];
    };

    const getProject = (id: string) => projects.find((p) => p.id === id);

    /**
     * POST /api/Proyectos (Solo rol "estudiante" autorizado)
     * Body: Proyecto completo con evidencias
     */
    const addProject = async (
        data: Partial<Project>
    ): Promise<{ ok: boolean; error?: string }> => {
        try {
            const headers = await getHeaders();
            // El backend usa PascalCase gracias a la serialización de C#/ASP.NET
            const body = {
                Nombre: data.nombre,
                Descripcion: data.descripcion,
                AutoresCorreos: data.autores_correos,
                Evidencias: {
                    RepositorioGit: data.evidencias?.repositorio_git,
                    Videos: data.evidencias?.videos?.map((v) => ({ Titulo: v.titulo, Url: v.url })),
                    Imagenes: data.evidencias?.imagenes,
                    DocumentosPdf: data.evidencias?.documentos_pdf,
                    Diapositivas: data.evidencias?.diapositivas,
                },
            };
            const res = await fetch(`${API_URL}/Proyectos`, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });
            if (res.ok) {
                // No recargamos el feed público porque el proyecto queda "pendiente"
                return { ok: true };
            }
            const errData = await res.json().catch(() => ({}));
            return { ok: false, error: errData.error || errData.mensaje || `HTTP ${res.status}` };
        } catch (e: any) {
            return { ok: false, error: "Error de conexión." };
        }
    };

    /** PUT /api/Proyectos/{id} — el estudiante edita su propio proyecto (backend lo devuelve a pendiente) */
    const updateProyecto = async (
        id: string,
        data: Partial<Project>
    ): Promise<{ ok: boolean; error?: string }> => {
        try {
            const headers = await getHeaders();
            const body = {
                Nombre: data.nombre,
                Descripcion: data.descripcion,
                AutoresCorreos: data.autores_correos,
                Evidencias: {
                    RepositorioGit: data.evidencias?.repositorio_git,
                    Videos: data.evidencias?.videos?.map((v) => ({ Titulo: v.titulo, Url: v.url })),
                    Imagenes: data.evidencias?.imagenes,
                    DocumentosPdf: data.evidencias?.documentos_pdf,
                    Diapositivas: data.evidencias?.diapositivas,
                },
            };
            const res = await fetch(`${API_URL}/Proyectos/${id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(body),
            });
            if (res.ok || res.status === 204) return { ok: true };
            const err = await res.json().catch(() => ({}));
            return { ok: false, error: err.error || err.mensaje || `HTTP ${res.status}` };
        } catch {
            return { ok: false, error: "Error de conexión." };
        }
    };

    /** Comentarios solo existen localmente (el backend no tiene endpoint de comentarios) */
    const addComment = (projectId: string, comment: Omit<Comment, "id">) => {
        const newComment: Comment = { ...comment, id: Date.now().toString() };
        setProjects((prev) =>
            prev.map((p) =>
                p.id === projectId
                    ? { ...p, comments: [...(p.comments || []), newComment] }
                    : p
            )
        );
    };

    /**
     * PUT /api/Proyectos/{id}/evaluar (Solo rol "maestro" verificado)
     * Body: EvaluacionDocente con rubrica
     */
    const submitEvaluation = async (
        projectId: string,
        evaluation: EvaluacionDocente
    ): Promise<{ ok: boolean; error?: string }> => {
        try {
            const headers = await getHeaders();
            const body = {
                Rubrica: evaluation.rubrica.map((r) => ({
                    Criterio: r.criterio,
                    PuntosMax: r.puntos_max,
                    Obtenido: r.obtenido,
                    Obs: r.obs,
                })),
                RetroalimentacionFinal: evaluation.retroalimentacion_final,
            };
            const res = await fetch(`${API_URL}/Proyectos/${projectId}/evaluar`, {
                method: "PUT",
                headers,
                body: JSON.stringify(body),
            });
            if (res.ok) {
                await loadProjects(); // Recargamos para reflejar el nuevo promedio
                return { ok: true };
            }
            const errData = await res.json().catch(() => ({}));
            return { ok: false, error: errData.error || errData.mensaje || `HTTP ${res.status}` };
        } catch {
            return { ok: false, error: "Error de conexión." };
        }
    };

    /**
     * POST /api/Uploads (Solo rol "estudiante")
     * multipart/form-data con el archivo → devuelve { url }
     */
    const uploadFile = async (
        fileUri: string,
        fileName: string,
        mimeType: string
    ): Promise<string> => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const formData = new FormData();
        formData.append("requestFile", {
            uri: fileUri,
            name: fileName,
            type: mimeType,
        } as any);

        const res = await fetch(`${API_URL}/Uploads`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                // NO ponemos Content-Type aquí – fetch lo pone solo con boundary
            },
            body: formData,
        });

        if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
        const data = await res.json();
        return data.url as string;
    };
    // ── FUNCIONES ADMIN ──────────────────────────────────────────────────

    /** GET /api/Proyectos/todos — todos los proyectos (cualquier estatus) */
    const getAllProyectos = async (): Promise<Project[]> => {
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_URL}/Proyectos/todos`, { headers });
            if (res.ok) {
                const data = await res.json();
                return Array.isArray(data) ? data.map(mapProject) : [];
            }
        } catch { }
        return [];
    };

    /** PUT /api/Proyectos/{id}/aprobar — aprueba el proyecto */
    const aprobarProyecto = async (id: string): Promise<{ ok: boolean; error?: string }> => {
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_URL}/Proyectos/${id}/aprobar`, {
                method: "PUT",
                headers,
            });
            if (res.ok) return { ok: true };
            const err = await res.json().catch(() => ({}));
            return { ok: false, error: err.error || err.mensaje || `HTTP ${res.status}` };
        } catch {
            return { ok: false, error: "Error de conexión." };
        }
    };

    /** DELETE /api/Proyectos/{id} — elimina el proyecto */
    const eliminarProyecto = async (id: string): Promise<{ ok: boolean; error?: string }> => {
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_URL}/Proyectos/${id}`, {
                method: "DELETE",
                headers,
            });
            if (res.ok || res.status === 204) return { ok: true };
            const err = await res.json().catch(() => ({}));
            return { ok: false, error: err.error || `HTTP ${res.status}` };
        } catch {
            return { ok: false, error: "Error de conexión." };
        }
    };

    /** GET /api/Usuarios — todos los usuarios (solo admin) */
    const getAllUsuarios = async (): Promise<any[]> => {
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_URL}/Usuarios`, { headers });
            if (res.ok) return await res.json();
        } catch { }
        return [];
    };

    /** PUT /api/Usuarios/{id}/verificar — verifica un maestro */
    const verificarMaestro = async (id: string): Promise<{ ok: boolean; error?: string }> => {
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_URL}/Usuarios/${id}/verificar`, {
                method: "PUT",
                headers,
            });
            if (res.ok) return { ok: true };
            const err = await res.json().catch(() => ({}));
            return { ok: false, error: err.error || `HTTP ${res.status}` };
        } catch {
            return { ok: false, error: "Error de conexión." };
        }
    };

    /** DELETE /api/Usuarios/{id} — elimina un usuario */
    const eliminarUsuario = async (id: string): Promise<{ ok: boolean; error?: string }> => {
        try {
            const headers = await getHeaders();
            const res = await fetch(`${API_URL}/Usuarios/${id}`, {
                method: "DELETE",
                headers,
            });
            if (res.ok || res.status === 204) return { ok: true };
            const err = await res.json().catch(() => ({}));
            return { ok: false, error: err.error || `HTTP ${res.status}` };
        } catch {
            return { ok: false, error: "Error de conexión." };
        }
    };

    return (
        <AppContext.Provider
            value={{
                projects,
                isLoading,
                searchQuery,
                setSearchQuery,
                loadProjects,
                getProject,
                getMisProyectos,
                addProject,
                updateProyecto,
                addComment,
                submitEvaluation,
                uploadFile,
                getAllProyectos,
                aprobarProyecto,
                eliminarProyecto,
                getAllUsuarios,
                verificarMaestro,
                eliminarUsuario,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider");
    return ctx;
}
