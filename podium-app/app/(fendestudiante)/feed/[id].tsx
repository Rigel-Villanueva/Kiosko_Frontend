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
    GitBranch,
    Video,
    FileText,
    Presentation,
    ExternalLink,
    Send,
    MessageCircle,
    ShieldCheck,
    ChevronDown,
    ChevronUp,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const BLUE = "#2563EB";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";
const BG = "#F5F7FA";

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
        aprobado: { bg: "#DCFCE7", text: "#166534", label: "Aprobado" },
        pendiente: { bg: "#FEF9C3", text: "#854D0E", label: "Pendiente" },
        rechazado: { bg: "#FEE2E2", text: "#991B1B", label: "Rechazado" },
        evaluado: { bg: "#EDE9FE", text: "#6B21A8", label: "Evaluado" },
    };
    const s = map[status] || { bg: "#F1F5F9", text: MUTED, label: status };
    return (
        <View style={{ backgroundColor: s.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: s.text }}>{s.label}</Text>
        </View>
    );
}

export default function DetalleEstudianteScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { projects, loadProjects, addComment } = useApp();

    const [commentText, setCommentText] = useState("");
    const [evalExpanded, setEvalExpanded] = useState(false);

    useEffect(() => {
        if (projects.length === 0) loadProjects();
    }, []);

    const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

    if (!project) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BLUE} />
                </View>
            </SafeAreaView>
        );
    }

    const ev = project.evidencias;

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
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
                        <ArrowLeft size={20} color={TEXT} />
                    </TouchableOpacity>
                    <View style={styles.heroBadges}>
                        <View style={styles.categoryChip}>
                            <Text style={styles.categoryText}>{project.category || "General"}</Text>
                        </View>
                        <StatusBadge status={project.estatus} />
                    </View>
                </View>

                <View style={styles.body}>
                    {/* Title + authors */}
                    <Text style={styles.title}>{project.nombre}</Text>
                    <Text style={styles.author}>por {project.authorName}</Text>
                    <View style={styles.correosRow}>
                        {project.autores_correos.map((c, i) => (
                            <View key={i} style={styles.correoPill}>
                                <Text style={styles.correoText}>{c}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Score */}
                    {project.promedio_general > 0 && (
                        <View style={styles.scoreCard}>
                            <GraduationCap size={20} color={BLUE} />
                            <Text style={styles.scoreLabel}>Promedio Docente</Text>
                            <Text style={styles.scoreValue}>{project.promedio_general}%</Text>
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Descripción</Text>
                        <Text style={styles.description}>{project.descripcion}</Text>
                    </View>

                    {/* Evidencias */}
                    {(ev?.repositorio_git || ev?.videos?.length > 0 || ev?.imagenes?.length > 0 || ev?.documentos_pdf?.length > 0 || ev?.diapositivas) && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Evidencias del Proyecto</Text>
                            {ev?.repositorio_git ? (
                                <TouchableOpacity onPress={() => Linking.openURL(ev.repositorio_git)} style={styles.evidRow}>
                                    <GitBranch size={16} color={MUTED} />
                                    <Text style={styles.evidLabel}>Repositorio Git</Text>
                                    <ExternalLink size={14} color={BLUE} />
                                </TouchableOpacity>
                            ) : null}
                            {ev?.videos?.length > 0 && ev.videos.map((v, i) => (
                                <TouchableOpacity key={i} onPress={() => Linking.openURL(v.url)} style={styles.evidRow}>
                                    <Video size={16} color={MUTED} />
                                    <Text style={styles.evidLabel}>{v.titulo}</Text>
                                    <ExternalLink size={14} color={BLUE} />
                                </TouchableOpacity>
                            ))}
                            {ev?.imagenes?.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {ev.imagenes.map((uri, i) => (
                                        <Image key={i} source={{ uri }} style={styles.evidImg} resizeMode="cover" />
                                    ))}
                                </ScrollView>
                            )}
                            {ev?.documentos_pdf?.length > 0 && ev.documentos_pdf.map((d, i) => (
                                <View key={i} style={styles.docChip}>
                                    <FileText size={14} color={BLUE} />
                                    <Text style={styles.docText} numberOfLines={1}>{d}</Text>
                                </View>
                            ))}
                            {ev?.diapositivas ? (
                                <TouchableOpacity onPress={() => Linking.openURL(ev.diapositivas)} style={styles.evidRow}>
                                    <Presentation size={16} color={MUTED} />
                                    <Text style={[styles.evidLabel, { color: BLUE }]}>Ver presentación</Text>
                                    <ExternalLink size={14} color={BLUE} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    )}

                    {/* Teacher evaluations (read-only) */}
                    {project.evaluaciones_docentes?.length > 0 && (
                        <View style={styles.card}>
                            <TouchableOpacity
                                onPress={() => setEvalExpanded(!evalExpanded)}
                                style={styles.evalHeaderRow}
                                activeOpacity={0.8}
                            >
                                <View style={styles.evidRow}>
                                    <ShieldCheck size={18} color={BLUE} />
                                    <Text style={styles.cardTitle}>
                                        Evaluaciones ({project.evaluaciones_docentes.length})
                                    </Text>
                                </View>
                                {evalExpanded ? (
                                    <ChevronUp size={18} color={MUTED} />
                                ) : (
                                    <ChevronDown size={18} color={MUTED} />
                                )}
                            </TouchableOpacity>
                            {evalExpanded &&
                                project.evaluaciones_docentes.map((e, i) => (
                                    <View key={i} style={styles.evalCard}>
                                        <View style={styles.evalTop}>
                                            <Text style={styles.evalTeacher}>{e.nombre_maestro}</Text>
                                            <View style={styles.evalBadge}>
                                                <Text style={styles.evalBadgeText}>{e.promedio_por_maestro}%</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.evalDate}>{e.fecha_evaluacion}</Text>
                                        <Text style={styles.retroText}>{e.retroalimentacion_final}</Text>
                                    </View>
                                ))}
                        </View>
                    )}

                    {/* Comments */}
                    <View style={styles.section}>
                        <View style={styles.evidRow}>
                            <MessageCircle size={18} color={MUTED} />
                            <Text style={styles.sectionTitle}>
                                Comentarios ({project.comments?.length || 0})
                            </Text>
                        </View>
                        <View style={styles.commentRow}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Escribe un comentario..."
                                placeholderTextColor={MUTED}
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
                                <Send size={16} color={WHITE} />
                            </TouchableOpacity>
                        </View>
                        {(!project.comments || project.comments.length === 0) && (
                            <Text style={styles.emptyComments}>No hay comentarios todavía.</Text>
                        )}
                        {project.comments?.map((c, i) => (
                            <View key={c.id || i} style={styles.commentCard}>
                                <View style={styles.commentHeader}>
                                    <View style={styles.commentAvatar}>
                                        <Text style={styles.commentAvatarText}>
                                            {c.userName?.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.commentUser}>{c.userName}</Text>
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
    safe: { flex: 1, backgroundColor: BG },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    hero: { height: 224, position: "relative" },
    heroImage: { width: "100%", height: "100%" },
    backBtn: {
        position: "absolute", top: 48, left: 16,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center", justifyContent: "center",
    },
    heroBadges: {
        position: "absolute", bottom: 16, left: 20, right: 20,
        flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    },
    categoryChip: {
        backgroundColor: BLUE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    categoryText: { fontSize: 12, fontWeight: "600", color: WHITE },
    body: { padding: 20, gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: TEXT },
    author: { fontSize: 14, color: MUTED },
    correosRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    correoPill: {
        backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    correoText: { fontSize: 12, color: BLUE },
    scoreCard: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: WHITE, borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: BORDER,
    },
    scoreLabel: { flex: 1, fontSize: 14, color: MUTED },
    scoreValue: { fontSize: 20, fontWeight: "800", color: BLUE },
    section: { gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: TEXT },
    description: { fontSize: 14, color: MUTED, lineHeight: 22 },
    card: {
        backgroundColor: WHITE, borderRadius: 16,
        borderWidth: 1, borderColor: BORDER,
        padding: 16, gap: 10,
    },
    cardTitle: { fontSize: 15, fontWeight: "700", color: TEXT },
    evidRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    evidLabel: { flex: 1, fontSize: 13, color: TEXT },
    evidImg: { width: 100, height: 76, borderRadius: 8, marginRight: 8 },
    docChip: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: "#EFF6FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    docText: { flex: 1, fontSize: 13, color: TEXT },
    evalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    evalCard: {
        borderWidth: 1, borderColor: BORDER, borderRadius: 12,
        padding: 12, gap: 4, marginTop: 8,
    },
    evalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    evalTeacher: { fontSize: 14, fontWeight: "600", color: TEXT },
    evalBadge: { backgroundColor: BLUE, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    evalBadgeText: { fontSize: 12, fontWeight: "700", color: WHITE },
    evalDate: { fontSize: 11, color: MUTED },
    retroText: { fontSize: 12, color: MUTED, marginTop: 4 },
    commentRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    commentInput: {
        flex: 1, borderWidth: 1, borderColor: BORDER,
        backgroundColor: WHITE, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
        fontSize: 14, color: TEXT,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: BLUE, alignItems: "center", justifyContent: "center",
    },
    emptyComments: { fontSize: 13, color: MUTED, textAlign: "center", marginTop: 8 },
    commentCard: {
        backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER,
        borderRadius: 12, padding: 12, gap: 6, marginTop: 8,
    },
    commentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    commentAvatar: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: `${BLUE}20`, alignItems: "center", justifyContent: "center",
    },
    commentAvatarText: { fontSize: 11, fontWeight: "700", color: BLUE },
    commentUser: { flex: 1, fontSize: 13, fontWeight: "600", color: TEXT },
    commentDate: { fontSize: 11, color: MUTED },
    commentText: { fontSize: 13, color: MUTED },
});
