import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
    CheckCircle,
    Trash2,
    Search,
    Star,
    ClipboardList,
    ChevronRight,
} from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";
import { Project } from "@/lib/types";

const ESTATUS_FILTERS = ["todos", "pendiente", "aprobado", "evaluado"] as const;
type Filter = (typeof ESTATUS_FILTERS)[number];

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

export default function AdminModerarScreen() {
    const { getAllProyectos, aprobarProyecto, eliminarProyecto } = useApp();
    const router = useRouter();
    const [proyectos, setProyectos] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<Filter>("pendiente");
    const [search, setSearch] = useState("");
    const [actionId, setActionId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getAllProyectos();
        setProyectos(data);
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const pendientesCount = proyectos.filter((p) => p.estatus === "pendiente").length;

    const filtered = proyectos.filter((p) => {
        const matchFilter = filter === "todos" || p.estatus === filter;
        const matchSearch =
            !search.trim() ||
            p.nombre.toLowerCase().includes(search.toLowerCase()) ||
            p.autores_correos.some((c) => c.toLowerCase().includes(search.toLowerCase()));
        return matchFilter && matchSearch;
    });

    const confirmarAprobar = (p: Project) => {
        Alert.alert(
            "Aprobar proyecto",
            `¿Publicar "${p.nombre}" en el feed?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Aprobar ✓",
                    onPress: async () => {
                        setActionId(p.id + ":apr");
                        const r = await aprobarProyecto(p.id);
                        setActionId(null);
                        if (r.ok) { Alert.alert("✅ Publicado", "El proyecto ya aparece en el feed."); load(); }
                        else Alert.alert("Error", r.error);
                    },
                },
            ]
        );
    };

    const confirmarEliminar = (p: Project) => {
        Alert.alert(
            "Eliminar proyecto",
            `¿Eliminar "${p.nombre}"? Esta acción es permanente.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setActionId(p.id + ":del");
                        const r = await eliminarProyecto(p.id);
                        setActionId(null);
                        if (r.ok) load();
                        else Alert.alert("Error", r.error);
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: Project }) => {
        const busy = actionId === item.id + ":apr" || actionId === item.id + ":del";
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(app)/admin/detalle/${item.id}` as any)}
                activeOpacity={0.85}
            >
                {/* Cabecera */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.nombre}</Text>
                        <Text style={styles.cardAuthor} numberOfLines={1}>
                            {item.autores_correos[0] || "Sin autor"}
                        </Text>
                        <EstatusBadge estatus={item.estatus} />
                    </View>
                    <View style={styles.cardMeta}>
                        {item.promedio_general > 0 && (
                            <View style={styles.ratingRow}>
                                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                <Text style={styles.ratingText}>{item.promedio_general.toFixed(1)}</Text>
                            </View>
                        )}
                        <ChevronRight size={18} color={colors.mutedForeground} />
                    </View>
                </View>

                <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>

                {/* Acciones */}
                {busy ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
                ) : (
                    <View style={styles.actions}>
                        {item.estatus === "pendiente" && (
                            <TouchableOpacity
                                style={styles.btnAprobar}
                                onPress={() => confirmarAprobar(item)}
                                activeOpacity={0.8}
                            >
                                <CheckCircle size={15} color="#fff" />
                                <Text style={styles.btnAprobarText}>Aprobar</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.btnEliminar}
                            onPress={() => confirmarEliminar(item)}
                            activeOpacity={0.8}
                        >
                            <Trash2 size={15} color="#DC2626" />
                            <Text style={styles.btnEliminarText}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <GradientHeader>
                <View style={styles.headerRow}>
                    <ClipboardList size={22} color="#FAFAFA" />
                    <View>
                        <Text style={styles.headerTitle}>Moderación</Text>
                        <Text style={styles.headerSub}>
                            {pendientesCount > 0
                                ? `${pendientesCount} proyecto${pendientesCount !== 1 ? "s" : ""} pendiente${pendientesCount !== 1 ? "s" : ""}`
                                : "Todo al día ✓"}
                        </Text>
                    </View>
                </View>
            </GradientHeader>

            {/* Buscador */}
            <View style={styles.searchBox}>
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar proyecto o autor..."
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Filtros */}
            <View style={styles.filters}>
                {ESTATUS_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, filter === f && styles.filterChipActive]}
                        onPress={() => setFilter(f)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            {f === "pendiente" && pendientesCount > 0 ? ` (${pendientesCount})` : ""}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(p) => p.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <CheckCircle size={52} color={colors.muted} />
                        <Text style={styles.emptyTitle}>
                            {loading ? "Cargando proyectos..." : "No hay proyectos aquí"}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {!loading && filter === "pendiente"
                                ? "No hay proyectos esperando aprobación"
                                : ""}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerTitle: { fontSize: 22, fontWeight: "700", color: "#FAFAFA" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
    searchBox: {
        flexDirection: "row", alignItems: "center", gap: 10,
        margin: 16, paddingHorizontal: 14, paddingVertical: 11,
        backgroundColor: colors.card, borderRadius: 12,
        borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.foreground },
    filters: {
        flexDirection: "row", paddingHorizontal: 16,
        gap: 8, marginBottom: 10, flexWrap: "wrap",
    },
    filterChip: {
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1,
        borderColor: colors.border, backgroundColor: colors.card,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, color: colors.mutedForeground, fontWeight: "500" },
    filterTextActive: { color: "#FAFAFA", fontWeight: "700" },
    list: { padding: 16, gap: 14, paddingBottom: 32 },
    card: {
        backgroundColor: colors.card, borderRadius: 16,
        padding: 16, borderWidth: 1, borderColor: colors.border,
        gap: 10, elevation: 2,
        shadowColor: "#000", shadowOpacity: 0.05,
        shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: { flexDirection: "row", gap: 12 },
    cardTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },
    cardAuthor: { fontSize: 12, color: colors.mutedForeground },
    cardMeta: { alignItems: "flex-end", gap: 6, justifyContent: "space-between" },
    ratingRow: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "#FEF3C7", borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    ratingText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
    cardDesc: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
    badge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontSize: 12, fontWeight: "600" },
    actions: { flexDirection: "row", gap: 10, marginTop: 4 },
    btnAprobar: {
        flex: 1, flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: 6,
        backgroundColor: "#059669", borderRadius: 10, paddingVertical: 10,
    },
    btnAprobarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    btnEliminar: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, borderWidth: 1, borderColor: "#DC2626",
        borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16,
    },
    btnEliminarText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
    empty: { alignItems: "center", paddingTop: 72, gap: 12 },
    emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.mutedForeground },
    emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: "center", paddingHorizontal: 32 },
});
