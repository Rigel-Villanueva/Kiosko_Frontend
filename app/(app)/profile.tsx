import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    LogOut,
    RefreshCw,
    BookOpen,
    GraduationCap,
    ArrowRight,
    ClipboardCheck,
    Shield,
    ClipboardList,
    Users,
    CheckCircle,
    AlertTriangle,
    BarChart2,
} from "lucide-react-native";
import { GradientHeader } from "@/components/GradientHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, switchRole } = useAuth();
    const { projects, loadProjects, getAllProyectos, getAllUsuarios } = useApp();

    // Stats de admin
    const [adminStats, setAdminStats] = useState<{
        totalProyectos: number; pendientes: number; aprobados: number; evaluados: number;
        totalUsuarios: number; maestrosSinVerificar: number;
    } | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const loadAdminStats = useCallback(async () => {
        if (user?.role !== "admin") return;
        setStatsLoading(true);
        const [proyectos, usuarios] = await Promise.all([getAllProyectos(), getAllUsuarios()]);
        setAdminStats({
            totalProyectos: proyectos.length,
            pendientes: proyectos.filter((p: any) => p.estatus === "pendiente").length,
            aprobados: proyectos.filter((p: any) => p.estatus === "aprobado").length,
            evaluados: proyectos.filter((p: any) => p.estatus === "evaluado").length,
            totalUsuarios: usuarios.length,
            maestrosSinVerificar: usuarios.filter((u: any) =>
                (u.rol || u.Rol || "").toLowerCase() === "maestro" && !(u.verificado ?? u.Verificado)
            ).length,
        });
        setStatsLoading(false);
    }, [user?.role]);

    useEffect(() => {
        if (user?.role === "admin") {
            loadAdminStats();
        } else if (projects.length === 0) {
            loadProjects();
        }
    }, [user?.role]);

    const misProyectos = useMemo(
        () => projects.filter((p) => p.subido_por === user?.id || p.autores_correos.includes(user?.email || "")),
        [projects, user]
    );

    const pendientesPorCalificar = useMemo(
        () =>
            projects.filter(
                (p) =>
                    p.assignedTeacherId === user?.id &&
                    !p.evaluaciones_docentes.some((e) => e.maestro_id === user?.id)
            ),
        [projects, user]
    );

    const evaluados = useMemo(
        () => projects.filter((p) => p.evaluaciones_docentes.some((e) => e.maestro_id === user?.id)),
        [projects, user]
    );

    const initial = user?.name?.charAt(0).toUpperCase() || "U";
    const rolLabel = user?.role === "teacher" ? "Docente" : user?.role === "admin" ? "Administrador" : "Estudiante";
    const otherRole = user?.role === "teacher" ? "Estudiante" : "Docente";

    const handleLogout = () => {
        logout();
        router.replace("/(auth)/login");
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <GradientHeader>
                    <View style={styles.headerRow}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initial}</Text>
                            </View>
                            <View>
                                <Text style={styles.userName}>{user?.name}</Text>
                                <Text style={styles.userRole}>
                                    {rolLabel} | {user?.career || "Ingeniería"}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
                            <LogOut size={20} color="#FAFAFA" />
                        </TouchableOpacity>
                    </View>
                </GradientHeader>

                <View style={styles.body}>
                    {/* Demo role switch */}
                    <TouchableOpacity style={styles.switchBtn} onPress={switchRole} activeOpacity={0.85}>
                        <RefreshCw size={16} color={colors.mutedForeground} />
                        <Text style={styles.switchText}>Cambiar a {otherRole} (Demo)</Text>
                    </TouchableOpacity>

                    {/* Vista Admin */}
                    {user?.role === "admin" && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <BarChart2 size={20} color={colors.accent} />
                                <Text style={styles.sectionTitle}>Estadísticas del Sistema</Text>
                                <TouchableOpacity onPress={loadAdminStats} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                    <RefreshCw size={15} color={colors.mutedForeground} />
                                </TouchableOpacity>
                            </View>

                            {statsLoading ? (
                                <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
                            ) : adminStats ? (
                                <>
                                    {/* Fila proyectos */}
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statCard}>
                                            <ClipboardList size={20} color={colors.primary} />
                                            <Text style={styles.statNum}>{adminStats.totalProyectos}</Text>
                                            <Text style={styles.statLabel}>Proyectos</Text>
                                        </View>
                                        <View style={[styles.statCard, adminStats.pendientes > 0 && styles.statCardAlert]}>
                                            <AlertTriangle size={20} color={adminStats.pendientes > 0 ? "#92400E" : colors.mutedForeground} />
                                            <Text style={[styles.statNum, adminStats.pendientes > 0 && { color: "#92400E" }]}>{adminStats.pendientes}</Text>
                                            <Text style={styles.statLabel}>Pendientes</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <CheckCircle size={20} color="#059669" />
                                            <Text style={styles.statNum}>{adminStats.aprobados}</Text>
                                            <Text style={styles.statLabel}>Aprobados</Text>
                                        </View>
                                    </View>
                                    {/* Fila usuarios */}
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statCard}>
                                            <Users size={20} color={colors.primary} />
                                            <Text style={styles.statNum}>{adminStats.totalUsuarios}</Text>
                                            <Text style={styles.statLabel}>Usuarios</Text>
                                        </View>
                                        <View style={[styles.statCard, adminStats.maestrosSinVerificar > 0 && styles.statCardAlert]}>
                                            <Shield size={20} color={adminStats.maestrosSinVerificar > 0 ? "#92400E" : "#059669"} />
                                            <Text style={[styles.statNum, adminStats.maestrosSinVerificar > 0 && { color: "#92400E" }]}>
                                                {adminStats.maestrosSinVerificar}
                                            </Text>
                                            <Text style={styles.statLabel}>Sin verificar</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <GraduationCap size={20} color={colors.accent} />
                                            <Text style={styles.statNum}>{adminStats.evaluados}</Text>
                                            <Text style={styles.statLabel}>Evaluados</Text>
                                        </View>
                                    </View>
                                </>
                            ) : null}
                        </View>
                    )}

                    {/* Vista Estudiante */}
                    {user?.role === "student" && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <BookOpen size={20} color={colors.accent} />
                                <Text style={styles.sectionTitle}>
                                    Mis Proyectos ({misProyectos.length})
                                </Text>
                            </View>
                            {misProyectos.length === 0 ? (
                                <Text style={styles.emptyText}>No has publicado proyectos aún</Text>
                            ) : (
                                misProyectos.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.projectRow}
                                        onPress={() => router.push(`/(app)/feed/${p.id}`)}
                                        activeOpacity={0.85}
                                    >
                                        <Image
                                            source={{ uri: p.image || `https://picsum.photos/seed/${p.id}/200/200` }}
                                            style={styles.thumb}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.projectInfo}>
                                            <Text style={styles.projectName} numberOfLines={1}>{p.nombre}</Text>
                                            <View style={styles.projectMeta}>
                                                <GraduationCap size={12} color={colors.accent} />
                                                <Text style={styles.projectScore}>
                                                    {p.promedio_general > 0 ? `${p.promedio_general}%` : "Pendiente"}
                                                </Text>
                                                <StatusBadge status={p.estatus} />
                                            </View>
                                        </View>
                                        <ArrowRight size={18} color={colors.mutedForeground} />
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}

                    {/* Vista Docente */}
                    {user?.role === "teacher" && (
                        <>
                            {/* Pendientes */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <ClipboardCheck size={20} color={colors.accent} />
                                    <Text style={styles.sectionTitle}>
                                        Pendientes por Calificar ({pendientesPorCalificar.length})
                                    </Text>
                                </View>
                                {pendientesPorCalificar.length === 0 ? (
                                    <Text style={styles.emptyText}>No tienes proyectos asignados pendientes</Text>
                                ) : (
                                    pendientesPorCalificar.map((p) => (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={[styles.projectRow, styles.pendingRow]}
                                            onPress={() => router.push(`/(app)/feed/${p.id}`)}
                                            activeOpacity={0.85}
                                        >
                                            <Image
                                                source={{ uri: p.image || `https://picsum.photos/seed/${p.id}/200/200` }}
                                                style={styles.thumb}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.projectInfo}>
                                                <Text style={styles.projectName} numberOfLines={1}>{p.nombre}</Text>
                                                <StatusBadge status="pendiente" />
                                            </View>
                                            <ArrowRight size={18} color={colors.accent} />
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>

                            {/* Historial */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <BookOpen size={20} color={colors.mutedForeground} />
                                    <Text style={styles.sectionTitle}>
                                        Historial de Evaluaciones ({evaluados.length})
                                    </Text>
                                </View>
                                {evaluados.length === 0 ? (
                                    <Text style={styles.emptyText}>Aún no has evaluado proyectos</Text>
                                ) : (
                                    evaluados.map((p) => {
                                        const myEval = p.evaluaciones_docentes.find((e) => e.maestro_id === user?.id);
                                        return (
                                            <TouchableOpacity
                                                key={p.id}
                                                style={styles.projectRow}
                                                onPress={() => router.push(`/(app)/feed/${p.id}`)}
                                                activeOpacity={0.85}
                                            >
                                                <Image
                                                    source={{ uri: p.image || `https://picsum.photos/seed/${p.id}/200/200` }}
                                                    style={styles.thumb}
                                                    resizeMode="cover"
                                                />
                                                <View style={styles.projectInfo}>
                                                    <Text style={styles.projectName} numberOfLines={1}>{p.nombre}</Text>
                                                    <View style={styles.projectMeta}>
                                                        <View style={styles.evalScoreBadge}>
                                                            <Text style={styles.evalScoreText}>
                                                                {myEval?.promedio_por_maestro}%
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.evalDate}>{myEval?.fecha_evaluacion}</Text>
                                                    </View>
                                                </View>
                                                <ArrowRight size={18} color={colors.mutedForeground} />
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    userInfo: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: { fontSize: 22, fontWeight: "700", color: "#FAFAFA" },
    userName: { fontSize: 20, fontWeight: "700", color: "#FAFAFA" },
    userRole: { fontSize: 13, color: "rgba(250,250,250,0.8)", marginTop: 2 },
    logoutBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    body: { padding: 20, gap: 20 },
    switchBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    switchText: { fontSize: 14, color: colors.mutedForeground, fontWeight: "500" },
    section: { gap: 10 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingVertical: 16 },
    projectRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
    },
    pendingRow: {
        borderColor: `${colors.accent}40`,
        borderWidth: 2,
        backgroundColor: `${colors.accent}06`,
    },
    thumb: { width: 56, height: 56, borderRadius: 10 },
    projectInfo: { flex: 1, gap: 4 },
    projectName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    projectMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
    projectScore: { fontSize: 12, color: colors.accent, fontWeight: "500" },
    evalScoreBadge: {
        backgroundColor: `${colors.accent}18`,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    evalScoreText: { fontSize: 12, fontWeight: "700", color: colors.accent },
    evalDate: { fontSize: 11, color: colors.mutedForeground },
    // ── Estadísticas admin ──
    statsGrid: { flexDirection: "row", gap: 10 },
    statCard: {
        flex: 1, alignItems: "center", justifyContent: "center",
        gap: 6, padding: 14,
        backgroundColor: colors.card,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    },
    statCardAlert: {
        borderColor: "#FDE68A",
        backgroundColor: "#FEF3C7",
    },
    statNum: { fontSize: 22, fontWeight: "800", color: colors.foreground },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontWeight: "500", textAlign: "center" },
});

