import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
    FolderOpen,
    Plus,
    Pencil,
    Trash2,
    ChevronRight,
    AlertCircle,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { Project } from "@/lib/types";

const BLUE = "#2563EB";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";
const BG = "#F5F7FA";

const FILTROS = [
    { key: "todos", label: "Todos" },
    { key: "pendiente", label: "Pendiente" },
    { key: "aprobado", label: "Aprobado" },
    { key: "evaluado", label: "Evaluado" },
    { key: "rechazado", label: "Rechazado" },
];

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
            <Text style={{ fontSize: 11, fontWeight: "700", color: s.text }}>{s.label}</Text>
        </View>
    );
}

export default function MisProyectosScreen() {
    const router = useRouter();
    const { getMisProyectos, eliminarProyecto } = useApp();
    const [proyectos, setProyectos] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("todos");
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getMisProyectos();
        setProyectos(data);
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const filtered = filtro === "todos"
        ? proyectos
        : proyectos.filter((p) => p.estatus === filtro);

    const handleDelete = (p: Project) => {
        Alert.alert(
            "Eliminar proyecto",
            `¿Seguro que deseas eliminar "${p.nombre}"? Esta acción no se puede deshacer.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(p.id);
                        const result = await eliminarProyecto(p.id);
                        setDeleting(null);
                        if (result.ok) {
                            setProyectos((prev) => prev.filter((x) => x.id !== p.id));
                        } else {
                            Alert.alert("Error", result.error || "No se pudo eliminar el proyecto.");
                        }
                    },
                },
            ]
        );
    };

    const cantidadPorFiltro = (key: string) =>
        key === "todos" ? proyectos.length : proyectos.filter((p) => p.estatus === key).length;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <FolderOpen size={22} color={BLUE} />
                    <Text style={styles.headerTitle}>Mis Proyectos</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push("/(fendestudiante)/crear" as any)}
                >
                    <Plus size={18} color={WHITE} />
                </TouchableOpacity>
            </View>

            {/* Filtros */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtrosRow}
            >
                {FILTROS.map((f) => {
                    const count = cantidadPorFiltro(f.key);
                    const active = filtro === f.key;
                    return (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filtroPill, active && styles.filtroPillActive]}
                            onPress={() => setFiltro(f.key)}
                        >
                            <Text style={[styles.filtroText, active && styles.filtroTextActive]}>
                                {f.label} {count > 0 ? `(${count})` : ""}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Lista */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BLUE} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <FolderOpen size={48} color={`${MUTED}50`} />
                    <Text style={styles.emptyTitle}>
                        {filtro === "todos" ? "Aún no has subido proyectos" : `Sin proyectos ${filtro}s`}
                    </Text>
                    {filtro === "todos" && (
                        <TouchableOpacity
                            style={styles.emptyBtn}
                            onPress={() => router.push("/(fendestudiante)/crear" as any)}
                        >
                            <Plus size={16} color={WHITE} />
                            <Text style={styles.emptyBtnText}>Subir mi primer proyecto</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                    {/* Aviso si hay rechazados */}
                    {proyectos.some((p) => p.estatus === "rechazado") && filtro === "todos" && (
                        <View style={styles.alertBanner}>
                            <AlertCircle size={16} color="#DC2626" />
                            <Text style={styles.alertText}>
                                Tienes {proyectos.filter((p) => p.estatus === "rechazado").length} proyecto(s) rechazado(s). Puedes editarlos y volver a enviar.
                            </Text>
                        </View>
                    )}

                    {filtered.map((p) => (
                        <View key={p.id} style={[styles.card, p.estatus === "rechazado" && styles.cardRechazado]}>
                            <TouchableOpacity
                                style={styles.cardContent}
                                onPress={() => router.push(`/(fendestudiante)/feed/${p.id}` as any)}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.iconBox, { backgroundColor: p.estatus === "rechazado" ? "#FEE2E2" : "#EFF6FF" }]}>
                                    <Text style={styles.iconEmoji}>📁</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardName} numberOfLines={1}>{p.nombre}</Text>
                                    <Text style={styles.cardDate}>
                                        {new Date(p.fecha_creacion).toLocaleDateString("es-MX", {
                                            month: "short", day: "numeric", year: "numeric",
                                        })}
                                    </Text>
                                </View>
                                <StatusBadge status={p.estatus} />
                                <ChevronRight size={16} color={MUTED} />
                            </TouchableOpacity>

                            {/* Acciones */}
                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => router.push({ pathname: "/(fendestudiante)/crear" as any, params: { editId: p.id } })}
                                >
                                    <Pencil size={14} color={BLUE} />
                                    <Text style={[styles.actionText, { color: BLUE }]}>Editar</Text>
                                </TouchableOpacity>
                                <View style={styles.actionDivider} />
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleDelete(p)}
                                    disabled={deleting === p.id}
                                >
                                    {deleting === p.id ? (
                                        <ActivityIndicator size="small" color="#DC2626" />
                                    ) : (
                                        <>
                                            <Trash2 size={14} color="#DC2626" />
                                            <Text style={[styles.actionText, { color: "#DC2626" }]}>Eliminar</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
    addBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: BLUE, alignItems: "center", justifyContent: "center",
    },
    filtrosRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
    filtroPill: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, backgroundColor: WHITE,
        borderWidth: 1, borderColor: BORDER,
    },
    filtroPillActive: { backgroundColor: BLUE, borderColor: BLUE },
    filtroText: { fontSize: 13, fontWeight: "600", color: MUTED },
    filtroTextActive: { color: WHITE },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyTitle: { fontSize: 15, color: MUTED, fontWeight: "500" },
    emptyBtn: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: BLUE, borderRadius: 12,
        paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
    },
    emptyBtnText: { fontSize: 14, fontWeight: "600", color: WHITE },
    listContent: { padding: 20, gap: 12, paddingBottom: 100 },
    alertBanner: {
        flexDirection: "row", alignItems: "flex-start", gap: 10,
        backgroundColor: "#FEF2F2", borderRadius: 12,
        borderWidth: 1, borderColor: "#FECACA", padding: 12, marginBottom: 4,
    },
    alertText: { flex: 1, fontSize: 13, color: "#DC2626" },
    card: {
        backgroundColor: WHITE, borderRadius: 16,
        borderWidth: 1, borderColor: BORDER, overflow: "hidden",
    },
    cardRechazado: { borderColor: "#FECACA" },
    cardContent: {
        flexDirection: "row", alignItems: "center",
        padding: 14, gap: 12,
    },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    iconEmoji: { fontSize: 20 },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 14, fontWeight: "600", color: TEXT },
    cardDate: { fontSize: 11, color: MUTED, marginTop: 2 },
    cardActions: {
        flexDirection: "row", borderTopWidth: 1, borderTopColor: BORDER,
    },
    actionBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, paddingVertical: 10,
    },
    actionText: { fontSize: 13, fontWeight: "600" },
    actionDivider: { width: 1, backgroundColor: BORDER },
});
