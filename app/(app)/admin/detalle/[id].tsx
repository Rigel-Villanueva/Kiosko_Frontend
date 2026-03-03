import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    CheckCircle,
    Trash2,
    Star,
    GitBranch,
    Video,
    Image,
    FileText,
    Presentation,
    Calendar,
    Mail,
    Award,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";
import { Project } from "@/lib/types";
import { API_URL } from "@/context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ESTATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pendiente: { bg: "#FEF3C7", text: "#92400E" },
    aprobado: { bg: "#D1FAE5", text: "#065F46" },
    evaluado: { bg: "#EDE9FE", text: "#5B21B6" },
    rechazado: { bg: "#FEE2E2", text: "#991B1B" },
};

function EstatusBadge({ estatus }: { estatus: string }) {
    const s = ESTATUS_COLORS[estatus] || { bg: "#F3F4F6", text: "#374151" };
    return (
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>
                {estatus.charAt(0).toUpperCase() + estatus.slice(1)}
            </Text>
        </View>
    );
}

function SectionTitle({ label }: { label: string }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionLabel}>{label}</Text>
            <View style={styles.sectionLine} />
        </View>
    );
}

export default function AdminDetalleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { aprobarProyecto, eliminarProyecto } = useApp();
    const [proyecto, setProyecto] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchProject = useCallback(async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("podium_auth_token");
            const res = await fetch(`${API_URL}/Proyectos/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const raw = await res.json();
                const ev = raw.evidencias || raw.Evidencias || {};
                setProyecto({
                    id: raw.id || raw.Id || id,
                    nombre: raw.nombre || raw.Nombre || "Sin título",
                    descripcion: raw.descripcion || raw.Descripcion || "",
                    subido_por: raw.subidoPor || raw.SubidoPor || "",
                    fecha_creacion: raw.fechaCreacion || raw.FechaCreacion || "",
                    autores_correos: raw.autoresCorreos || raw.AutoresCorreos || [],
                    estatus: (raw.estatus || raw.Estatus || "pendiente").toLowerCase(),
                    promedio_general: raw.promedioGeneral ?? raw.PromedioGeneral ?? 0,
                    evidencias: {
                        repositorio_git: ev.repositorioGit || ev.RepositorioGit || "",
                        videos: (ev.videos || ev.Videos || []).map((v: any) => ({
                            titulo: v.titulo || v.Titulo || "",
                            url: v.url || v.Url || "",
                        })),
                        imagenes: ev.imagenes || ev.Imagenes || [],
                        documentos_pdf: ev.documentosPdf || ev.DocumentosPdf || [],
                        diapositivas: ev.diapositivas || ev.Diapositivas || "",
                    },
                    evaluaciones_docentes: (raw.evaluacionesDocentes || raw.EvaluacionesDocentes || []).map((e: any) => ({
                        maestro_id: e.maestroId || e.MaestroId || "",
                        nombre_maestro: e.nombreMaestro || e.NombreMaestro || "Maestro",
                        fecha_evaluacion: e.fechaEvaluacion || e.FechaEvaluacion || "",
                        promedio_por_maestro: e.promedioPorMaestro ?? e.PromedioPorMaestro ?? 0,
                        retroalimentacion_final: e.retroalimentacionFinal || e.RetroalimentacionFinal || "",
                        rubrica: (e.rubrica || e.Rubrica || []).map((r: any) => ({
                            criterio: r.criterio || r.Criterio || "",
                            puntos_max: r.puntosMax ?? r.PuntosMax ?? 0,
                            obtenido: r.obtenido ?? r.Obtenido ?? 0,
                            obs: r.obs || r.Obs || "",
                        })),
                    })),
                    category: "General",
                    image: "",
                    authorName: "",
                    authorAvatar: "",
                    communityRating: 0,
                    comments: [],
                });
            }
        } catch (e) {
            Alert.alert("Error", "No se pudo cargar el proyecto.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchProject(); }, [fetchProject]);

    const handleAprobar = () => {
        Alert.alert(
            "Aprobar proyecto",
            `¿Publicar "${proyecto?.nombre}" en el feed público?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Aprobar ✓",
                    onPress: async () => {
                        setActionLoading(true);
                        const r = await aprobarProyecto(id!);
                        setActionLoading(false);
                        if (r.ok) {
                            Alert.alert("✅ Publicado", "El proyecto ya aparece en el feed.", [
                                { text: "OK", onPress: () => router.back() },
                            ]);
                        } else Alert.alert("Error", r.error);
                    },
                },
            ]
        );
    };

    const handleEliminar = () => {
        Alert.alert(
            "Eliminar proyecto",
            `¿Eliminar permanentemente "${proyecto?.nombre}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(true);
                        const r = await eliminarProyecto(id!);
                        setActionLoading(false);
                        if (r.ok) router.back();
                        else Alert.alert("Error", r.error);
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!proyecto) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <Text style={{ color: colors.mutedForeground }}>Proyecto no encontrado.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>← Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const ev = proyecto.evidencias;

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header con gradiente */}
            <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ArrowLeft size={22} color="#FAFAFA" />
                </TouchableOpacity>
                <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.headerTitle} numberOfLines={2}>{proyecto.nombre}</Text>
                    <EstatusBadge estatus={proyecto.estatus} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Metadatos */}
                <View style={styles.card}>
                    <View style={styles.metaRow}>
                        <Calendar size={15} color={colors.mutedForeground} />
                        <Text style={styles.metaText}>
                            {proyecto.fecha_creacion
                                ? new Date(proyecto.fecha_creacion).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
                                : "Fecha desconocida"}
                        </Text>
                    </View>
                    {proyecto.autores_correos.map((c: string) => (
                        <View key={c} style={styles.metaRow}>
                            <Mail size={15} color={colors.mutedForeground} />
                            <Text style={styles.metaText}>{c}</Text>
                        </View>
                    ))}
                    {proyecto.promedio_general > 0 && (
                        <View style={styles.metaRow}>
                            <Star size={15} color="#F59E0B" fill="#F59E0B" />
                            <Text style={[styles.metaText, { fontWeight: "700" }]}>
                                Promedio: {proyecto.promedio_general.toFixed(1)} / 100
                            </Text>
                        </View>
                    )}
                </View>

                {/* Descripción */}
                <SectionTitle label="Descripción" />
                <View style={styles.card}>
                    <Text style={styles.description}>{proyecto.descripcion || "Sin descripción."}</Text>
                </View>

                {/* Evidencias */}
                <SectionTitle label="Evidencias" />
                <View style={styles.card}>
                    {ev.repositorio_git ? (
                        <TouchableOpacity
                            style={styles.evidRow}
                            onPress={() => Linking.openURL(ev.repositorio_git)}
                        >
                            <GitBranch size={16} color={colors.primary} />
                            <Text style={styles.evidLink} numberOfLines={1}>{ev.repositorio_git}</Text>
                        </TouchableOpacity>
                    ) : null}

                    {ev.videos?.length > 0 && (
                        <View style={styles.evidRow}>
                            <Video size={16} color={colors.primary} />
                            <Text style={styles.evidText}>{ev.videos.length} video{ev.videos.length !== 1 ? "s" : ""}</Text>
                        </View>
                    )}
                    {ev.imagenes?.length > 0 && (
                        <View style={styles.evidRow}>
                            <Image size={16} color={colors.primary} />
                            <Text style={styles.evidText}>{ev.imagenes.length} imagen{ev.imagenes.length !== 1 ? "es" : ""}</Text>
                        </View>
                    )}
                    {ev.documentos_pdf?.length > 0 && (
                        <View style={styles.evidRow}>
                            <FileText size={16} color={colors.primary} />
                            <Text style={styles.evidText}>{ev.documentos_pdf.length} PDF{ev.documentos_pdf.length !== 1 ? "s" : ""}</Text>
                        </View>
                    )}
                    {ev.diapositivas ? (
                        <TouchableOpacity
                            style={styles.evidRow}
                            onPress={() => Linking.openURL(ev.diapositivas)}
                        >
                            <Presentation size={16} color={colors.primary} />
                            <Text style={styles.evidLink} numberOfLines={1}>Diapositivas</Text>
                        </TouchableOpacity>
                    ) : null}
                    {!ev.repositorio_git && !ev.videos?.length && !ev.imagenes?.length &&
                        !ev.documentos_pdf?.length && !ev.diapositivas && (
                            <Text style={styles.metaText}>Sin evidencias registradas.</Text>
                        )}
                </View>

                {/* Evaluaciones docentes */}
                {proyecto.evaluaciones_docentes?.length > 0 && (
                    <>
                        <SectionTitle label="Evaluaciones" />
                        {proyecto.evaluaciones_docentes.map((ev, i) => (
                            <View key={i} style={styles.evalCard}>
                                <View style={styles.evalHeader}>
                                    <Award size={16} color={colors.accent} />
                                    <Text style={styles.evalMaestro}>{ev.nombre_maestro}</Text>
                                    <View style={styles.evalScore}>
                                        <Text style={styles.evalScoreText}>
                                            {ev.promedio_por_maestro.toFixed(0)} pts
                                        </Text>
                                    </View>
                                </View>
                                {ev.retroalimentacion_final ? (
                                    <Text style={styles.evalFeedback}>{ev.retroalimentacion_final}</Text>
                                ) : null}
                            </View>
                        ))}
                    </>
                )}

                {/* ─── ZONA ADMIN ─── */}
                <View style={styles.adminZone}>
                    <Text style={styles.adminZoneLabel}>🛡 Acciones de Administrador</Text>

                    {proyecto.estatus === "pendiente" && (
                        <TouchableOpacity
                            style={[styles.btnAprobar, actionLoading && { opacity: 0.6 }]}
                            onPress={handleAprobar}
                            disabled={actionLoading}
                            activeOpacity={0.8}
                        >
                            {actionLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <CheckCircle size={18} color="#fff" />
                                    <Text style={styles.btnAprobarText}>Aprobar y publicar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.btnEliminar, actionLoading && { opacity: 0.6 }]}
                        onPress={handleEliminar}
                        disabled={actionLoading}
                        activeOpacity={0.8}
                    >
                        <Trash2 size={18} color="#DC2626" />
                        <Text style={styles.btnEliminarText}>Eliminar proyecto</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: "row", alignItems: "flex-start",
        gap: 14, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 24,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center", marginTop: 2,
    },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#FAFAFA", lineHeight: 26 },
    content: { padding: 20, gap: 4, paddingBottom: 48 },
    card: {
        backgroundColor: colors.card, borderRadius: 14,
        padding: 16, borderWidth: 1, borderColor: colors.border,
        marginBottom: 4, gap: 10,
    },
    evalCard: {
        backgroundColor: colors.card, borderRadius: 14,
        padding: 16, borderWidth: 1, borderColor: colors.border,
        marginBottom: 8, gap: 8,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
    sectionLine: { flex: 1, height: 1, backgroundColor: colors.border },
    sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.mutedForeground, letterSpacing: 1 },
    badge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 13, fontWeight: "700" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    metaText: { fontSize: 13, color: colors.mutedForeground },
    description: { fontSize: 14, color: colors.foreground, lineHeight: 22 },
    evidRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    evidLink: { fontSize: 13, color: colors.primary, flex: 1, textDecorationLine: "underline" },
    evidText: { fontSize: 13, color: colors.foreground },
    evalHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    evalMaestro: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground },
    evalScore: {
        backgroundColor: colors.primary + "20",
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    },
    evalScoreText: { fontSize: 13, fontWeight: "700", color: colors.primary },
    evalFeedback: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
    adminZone: {
        marginTop: 20, padding: 16,
        borderRadius: 16, borderWidth: 1.5,
        borderColor: colors.primary + "40",
        backgroundColor: colors.primary + "08",
        gap: 12,
    },
    adminZoneLabel: {
        fontSize: 13, fontWeight: "700",
        color: colors.primary, marginBottom: 4,
    },
    btnAprobar: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: 8,
        backgroundColor: "#059669",
        borderRadius: 12, paddingVertical: 14,
    },
    btnAprobarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    btnEliminar: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: 8,
        borderWidth: 1.5, borderColor: "#DC2626",
        borderRadius: 12, paddingVertical: 14,
    },
    btnEliminarText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
