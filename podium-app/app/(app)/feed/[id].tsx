import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Linking,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    GraduationCap,
    Users,
    GitBranch,
    Video,
    FileText,
    Presentation,
    ExternalLink,
    Send,
    MessageCircle,
    ShieldCheck,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";
import { DEFAULT_RUBRICA, EvaluacionDocente, RubricaCriterio } from "@/lib/types";

export default function DetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { projects, loadProjects, addComment, submitEvaluation } = useApp();

    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [evalExpanded, setEvalExpanded] = useState(false);
    const [rubrica, setRubrica] = useState<{ obtenido: number; obs: string }[]>(
        DEFAULT_RUBRICA.map(() => ({ obtenido: 0, obs: "" }))
    );
    const [retroFinal, setRetroFinal] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (projects.length === 0) loadProjects();
    }, []);

    const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

    if (!project) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    const ev = project.evidencias;
    const isTeacher = user?.role === "teacher";
    const hasEvaluated = isTeacher && project.evaluaciones_docentes.some(
        (e) => e.maestro_id === user?.id
    );
    const promedioCalc = rubrica.reduce((sum, r) => sum + (r.obtenido || 0), 0);

    const handleComment = () => {
        if (!commentText.trim() || !user) return;
        addComment(project.id, {
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            text: commentText.trim(),
            date: new Date().toISOString().split("T")[0],
        });
        setCommentText("");
    };

    const handleEvaluate = async () => {
        if (!user || promedioCalc === 0 || !retroFinal.trim()) return;
        setSubmitting(true);
        const evaluation: EvaluacionDocente = {
            maestro_id: user.id,
            nombre_maestro: user.name,
            fecha_evaluacion: new Date().toISOString().split("T")[0],
            promedio_por_maestro: promedioCalc,
            retroalimentacion_final: retroFinal,
            rubrica: DEFAULT_RUBRICA.map((r, i) => ({
                criterio: r.criterio,
                puntos_max: r.puntos_max,
                obtenido: rubrica[i].obtenido,
                obs: rubrica[i].obs,
            })),
        };
        const ok = await submitEvaluation(project.id, evaluation);
        setSubmitting(false);
        if (ok) Alert.alert("¡Éxito!", "Evaluación publicada correctamente.");
        else Alert.alert("Error", "No se pudo publicar la evaluación.");
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Image
                        source={{ uri: project.image || `https://picsum.photos/seed/${project.id}/600/400` }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.6)"]}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                        activeOpacity={0.85}
                    >
                        <ArrowLeft size={20} color={colors.foreground} />
                    </TouchableOpacity>
                    {/* Bottom chips */}
                    <View style={styles.heroBadges}>
                        <View style={styles.categoryChip}>
                            <Text style={styles.categoryText}>{project.category || "General"}</Text>
                        </View>
                        <StatusBadge status={project.estatus} />
                    </View>
                </View>

                <View style={styles.body}>
                    {/* Title */}
                    <Text style={styles.title}>{project.nombre}</Text>
                    <Text style={styles.author}>por {project.authorName}</Text>
                    <View style={styles.correosRow}>
                        {project.autores_correos.map((c, i) => (
                            <View key={i} style={styles.correoPill}>
                                <Text style={styles.correoText}>{c}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Metrics */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metricCard}>
                            <GraduationCap size={24} color={colors.accent} />
                            <Text style={styles.metricValue}>
                                {project.promedio_general > 0 ? `${project.promedio_general}%` : "--"}
                            </Text>
                            <Text style={styles.metricLabel}>Promedio Docente</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Users size={24} color={colors.mutedForeground} />
                            <Text style={styles.metricValue}>{project.communityRating}%</Text>
                            <Text style={styles.metricLabel}>Comunidad</Text>
                        </View>
                    </View>

                    {/* Descripción */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Descripción</Text>
                        <Text style={styles.description}>{project.descripcion}</Text>
                    </View>

                    {/* Evidencias */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Evidencias del Proyecto</Text>
                        {ev?.repositorio_git ? (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(ev.repositorio_git)}
                                style={styles.evidRow}
                            >
                                <GitBranch size={16} color={colors.mutedForeground} />
                                <Text style={styles.evidLabel}>Repositorio Git</Text>
                                <ExternalLink size={14} color={colors.accent} />
                            </TouchableOpacity>
                        ) : null}
                        {ev?.videos?.length > 0 && (
                            <View style={styles.evidSection}>
                                <View style={styles.evidRow}>
                                    <Video size={16} color={colors.mutedForeground} />
                                    <Text style={styles.evidLabel}>Videos ({ev.videos.length})</Text>
                                </View>
                                {ev.videos.map((v, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => Linking.openURL(v.url)}
                                        style={styles.videoChip}
                                    >
                                        <Video size={14} color={colors.accent} />
                                        <Text style={styles.videoTitle}>{v.titulo}</Text>
                                        <ExternalLink size={12} color={colors.accent} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {ev?.imagenes?.length > 0 && (
                            <View style={styles.evidSection}>
                                <Text style={styles.evidLabel}>Imágenes ({ev.imagenes.length})</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                    {ev.imagenes.map((uri, i) => (
                                        <Image key={i} source={{ uri }} style={styles.evImage} resizeMode="cover" />
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                        {ev?.documentos_pdf?.length > 0 && (
                            <View style={styles.evidSection}>
                                <View style={styles.evidRow}>
                                    <FileText size={16} color={colors.mutedForeground} />
                                    <Text style={styles.evidLabel}>Documentos ({ev.documentos_pdf.length})</Text>
                                </View>
                                {ev.documentos_pdf.map((d, i) => (
                                    <View key={i} style={styles.docChip}>
                                        <FileText size={14} color={colors.accent} />
                                        <Text style={styles.docText}>{d}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {ev?.diapositivas ? (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(ev.diapositivas)}
                                style={styles.evidRow}
                            >
                                <Presentation size={16} color={colors.mutedForeground} />
                                <Text style={[styles.evidLabel, { color: colors.accent }]}>Ver presentación</Text>
                                <ExternalLink size={14} color={colors.accent} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Evaluaciones Docentes */}
                    {project.evaluaciones_docentes?.length > 0 && (
                        <View style={styles.card}>
                            <TouchableOpacity
                                onPress={() => setEvalExpanded(!evalExpanded)}
                                style={styles.evalHeader}
                                activeOpacity={0.8}
                            >
                                <View style={styles.evidRow}>
                                    <ShieldCheck size={18} color={colors.accent} />
                                    <Text style={styles.cardTitle}>
                                        Evaluaciones ({project.evaluaciones_docentes.length})
                                    </Text>
                                </View>
                                {evalExpanded ? (
                                    <ChevronUp size={18} color={colors.mutedForeground} />
                                ) : (
                                    <ChevronDown size={18} color={colors.mutedForeground} />
                                )}
                            </TouchableOpacity>
                            {evalExpanded &&
                                project.evaluaciones_docentes.map((ev, i) => (
                                    <View key={i} style={styles.evalCard}>
                                        <View style={styles.evalHeaderRow}>
                                            <Text style={styles.evalTeacher}>{ev.nombre_maestro}</Text>
                                            <View style={styles.evalBadge}>
                                                <Text style={styles.evalBadgeText}>{ev.promedio_por_maestro}%</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.evalDate}>{ev.fecha_evaluacion}</Text>
                                        {ev.rubrica?.map((r, j) => (
                                            <View key={j} style={styles.rubricRow}>
                                                <Text style={styles.rubricCrit}>{r.criterio}</Text>
                                                <Text style={styles.rubricScore}>{r.obtenido}/{r.puntos_max}</Text>
                                            </View>
                                        ))}
                                        <Text style={styles.retroText}>{ev.retroalimentacion_final}</Text>
                                    </View>
                                ))}
                        </View>
                    )}

                    {/* Formulario evaluación (docente no ha evaluado) */}
                    {isTeacher && !hasEvaluated && (
                        <View style={styles.evalForm}>
                            <View style={styles.evidRow}>
                                <ShieldCheck size={20} color={colors.accent} />
                                <Text style={styles.evalFormTitle}>Evaluación Profesional</Text>
                            </View>
                            {DEFAULT_RUBRICA.map((crit, i) => (
                                <View key={i} style={styles.critCard}>
                                    <View style={styles.critHeader}>
                                        <Text style={styles.critName}>{crit.criterio}</Text>
                                        <Text style={styles.critMax}>Max: {crit.puntos_max}</Text>
                                    </View>
                                    <View style={styles.critInput}>
                                        <Text style={styles.critLabel}>Obtenido:</Text>
                                        <TextInput
                                            style={styles.numInput}
                                            value={String(rubrica[i].obtenido)}
                                            onChangeText={(v) => {
                                                const n = Math.min(crit.puntos_max, Math.max(0, Number(v) || 0));
                                                const copy = [...rubrica];
                                                copy[i] = { ...copy[i], obtenido: n };
                                                setRubrica(copy);
                                            }}
                                            keyboardType="numeric"
                                        />
                                        <View style={styles.progressWrap}>
                                            <View style={styles.progressBg}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${(rubrica[i].obtenido / crit.puntos_max) * 100}%` },
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                    <TextInput
                                        style={styles.obsInput}
                                        placeholder="Observaciones..."
                                        placeholderTextColor={colors.mutedForeground}
                                        value={rubrica[i].obs}
                                        onChangeText={(v) => {
                                            const copy = [...rubrica];
                                            copy[i] = { ...copy[i], obs: v };
                                            setRubrica(copy);
                                        }}
                                        multiline
                                        numberOfLines={2}
                                    />
                                </View>
                            ))}

                            <View style={styles.promedioBox}>
                                <Text style={styles.promedioLabel}>Promedio Calculado</Text>
                                <Text style={styles.promedioValue}>{promedioCalc}%</Text>
                            </View>

                            <TextInput
                                style={styles.retroInput}
                                placeholder="Retroalimentación final..."
                                placeholderTextColor={colors.mutedForeground}
                                value={retroFinal}
                                onChangeText={setRetroFinal}
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.evalBtn,
                                    (promedioCalc === 0 || !retroFinal.trim()) && { opacity: 0.5 },
                                ]}
                                onPress={handleEvaluate}
                                disabled={promedioCalc === 0 || !retroFinal.trim() || submitting}
                                activeOpacity={0.85}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.evalBtnText}>Publicar Evaluación</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Ya evaluó */}
                    {isTeacher && hasEvaluated && (
                        <View style={styles.alreadyEval}>
                            <CheckCircle2 size={24} color="#059669" />
                            <Text style={styles.alreadyEvalText}>Ya has evaluado este proyecto</Text>
                        </View>
                    )}

                    {/* Comentarios */}
                    <View style={styles.section}>
                        <View style={styles.evidRow}>
                            <MessageCircle size={18} color={colors.mutedForeground} />
                            <Text style={styles.sectionTitle}>
                                Comentarios ({project.comments?.length || 0})
                            </Text>
                        </View>
                        <View style={styles.commentRow}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Escribe un comentario..."
                                placeholderTextColor={colors.mutedForeground}
                                value={commentText}
                                onChangeText={setCommentText}
                                onSubmitEditing={handleComment}
                                returnKeyType="send"
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !commentText.trim() && { opacity: 0.5 }]}
                                onPress={handleComment}
                                disabled={!commentText.trim()}
                                activeOpacity={0.85}
                            >
                                <Send size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        {(!project.comments || project.comments.length === 0) && (
                            <Text style={styles.emptyComments}>No hay comentarios todavía.</Text>
                        )}
                        {project.comments?.map((c, i) => (
                            <View key={c.id || i} style={styles.commentCard}>
                                <View style={styles.commentHeader}>
                                    <View style={styles.commentMeta}>
                                        <View style={styles.commentAvatar}>
                                            <Text style={styles.commentAvatarText}>
                                                {c.userName?.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={styles.commentUser}>{c.userName}</Text>
                                    </View>
                                    <Text style={styles.commentDate}>{c.date}</Text>
                                </View>
                                <Text style={styles.commentText}>{c.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    hero: { height: 224, position: "relative" },
    heroImage: { width: "100%", height: "100%" },
    backBtn: {
        position: "absolute",
        top: 48,
        left: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.85)",
        alignItems: "center",
        justifyContent: "center",
    },
    heroBadges: {
        position: "absolute",
        bottom: 16,
        left: 20,
        right: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    categoryChip: {
        backgroundColor: colors.accent,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: { fontSize: 12, fontWeight: "600", color: "#FAFAFA" },
    body: { padding: 20, gap: 16 },
    title: { fontSize: 24, fontWeight: "700", color: colors.foreground },
    author: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
    correosRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    correoPill: {
        backgroundColor: colors.muted,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    correoText: { fontSize: 11, color: colors.mutedForeground },
    metricsRow: { flexDirection: "row", gap: 12 },
    metricCard: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        padding: 14,
        alignItems: "center",
        gap: 4,
    },
    metricValue: { fontSize: 20, fontWeight: "700", color: colors.foreground },
    metricLabel: { fontSize: 11, color: colors.mutedForeground, textAlign: "center" },
    section: { gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    description: { fontSize: 14, color: colors.mutedForeground, lineHeight: 22 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        padding: 18,
        gap: 10,
    },
    cardTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },
    evidRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    evidSection: { gap: 6 },
    evidLabel: { fontSize: 13, color: colors.foreground, flex: 1 },
    videoChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.muted,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    videoTitle: { flex: 1, fontSize: 13, color: colors.foreground },
    evImage: { width: 128, height: 96, borderRadius: 8, marginRight: 8 },
    docChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    docText: { fontSize: 13, color: colors.foreground },
    evalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    evalCard: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        gap: 6,
        marginTop: 8,
    },
    evalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    evalTeacher: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    evalBadge: { backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    evalBadgeText: { fontSize: 12, fontWeight: "700", color: "#FAFAFA" },
    evalDate: { fontSize: 11, color: colors.mutedForeground },
    rubricRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    rubricCrit: { fontSize: 12, color: colors.mutedForeground },
    rubricScore: { fontSize: 12, fontWeight: "600", color: colors.foreground },
    retroText: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
    evalForm: {
        borderRadius: 16,
        borderWidth: 2,
        borderColor: `${colors.accent}50`,
        backgroundColor: `${colors.accent}08`,
        padding: 18,
        gap: 12,
    },
    evalFormTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    critCard: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        gap: 8,
    },
    critHeader: { flexDirection: "row", justifyContent: "space-between" },
    critName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    critMax: { fontSize: 12, color: colors.mutedForeground },
    critInput: { flexDirection: "row", alignItems: "center", gap: 8 },
    critLabel: { fontSize: 12, color: colors.mutedForeground },
    numInput: {
        width: 60,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        textAlign: "center",
        fontSize: 14,
        color: colors.foreground,
        backgroundColor: colors.background,
        paddingVertical: 6,
    },
    progressWrap: { flex: 1 },
    progressBg: {
        height: 8,
        backgroundColor: colors.muted,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },
    obsInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        color: colors.foreground,
        minHeight: 56,
    },
    promedioBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: `${colors.primary}15`,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    promedioLabel: { fontSize: 13, fontWeight: "600", color: colors.foreground },
    promedioValue: { fontSize: 22, fontWeight: "700", color: colors.primary },
    retroInput: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.foreground,
        minHeight: 100,
    },
    evalBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    evalBtnText: { color: "#FAFAFA", fontWeight: "700", fontSize: 15 },
    alreadyEval: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#A7F3D0",
        borderRadius: 12,
        padding: 16,
    },
    alreadyEvalText: { fontSize: 14, fontWeight: "500", color: "#065F46" },
    commentRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.foreground,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyComments: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", marginTop: 8 },
    commentCard: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        gap: 6,
        marginTop: 8,
    },
    commentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    commentMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
    commentAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.muted,
        alignItems: "center",
        justifyContent: "center",
    },
    commentAvatarText: { fontSize: 11, fontWeight: "700", color: colors.foreground },
    commentUser: { fontSize: 13, fontWeight: "600", color: colors.foreground },
    commentDate: { fontSize: 11, color: colors.mutedForeground },
    commentText: { fontSize: 13, color: colors.mutedForeground },
});
