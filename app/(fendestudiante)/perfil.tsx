import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { LogOut, FolderOpen, CheckCircle, Clock, XCircle, ChevronRight } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Project } from "@/lib/types";

const BLUE = "#2563EB";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const BORDER = "#E2E8F0";

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        aprobado: { bg: "#DCFCE7", text: "#166534", label: "Aprobado" },
        pendiente: { bg: "#FEF9C3", text: "#854D0E", label: "Pendiente" },
        rechazado: { bg: "#FEE2E2", text: "#991B1B", label: "Rechazado" },
        evaluado: { bg: "#EDE9FE", text: "#6B21A8", label: "Evaluado" },
    };
    const s = config[status] || { bg: "#F1F5F9", text: MUTED, label: status };
    return (
        <View style={{ backgroundColor: s.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: s.text }}>{s.label}</Text>
        </View>
    );
}

export default function PerfilEstudianteScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { getMisProyectos } = useApp();

    const [stats, setStats] = useState({ total: 0, aprobado: 0, pendiente: 0, rechazado: 0 });
    const [recientes, setRecientes] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const proyectos = await getMisProyectos();
        setStats({
            total: proyectos.length,
            aprobado: proyectos.filter((p) => p.estatus === "aprobado" || p.estatus === "evaluado").length,
            pendiente: proyectos.filter((p) => p.estatus === "pendiente").length,
            rechazado: proyectos.filter((p) => p.estatus === "rechazado").length,
        });
        setRecientes(proyectos.slice(0, 3));
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, []);

    const initial = user?.name?.charAt(0).toUpperCase() || "E";

    const handleLogout = () => {
        logout();
        router.replace("/(auth)/login");
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FA" }} edges={["top"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Gradient header */}
                <LinearGradient colors={[BLUE, "#1D4ED8"]} style={styles.gradientHeader}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initial}</Text>
                        <View style={styles.verifiedDot}>
                            <CheckCircle size={14} color="#16A34A" />
                        </View>
                    </View>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.studentBadge}>
                        <Text style={styles.studentBadgeText}>ESTUDIANTE</Text>
                    </View>
                </LinearGradient>

                <View style={styles.body}>
                    {/* Statistics */}
                    <View style={styles.statsCard}>
                        <Text style={styles.statsTitle}>📊 My Statistics</Text>
                        {loading ? (
                            <ActivityIndicator color={BLUE} style={{ paddingVertical: 20 }} />
                        ) : (
                            <View style={styles.statsGrid}>
                                <View style={[styles.statCell, { backgroundColor: "#EFF6FF" }]}>
                                    <Text style={styles.statLabel}>TOTAL</Text>
                                    <View style={styles.statRow}>
                                        <Text style={[styles.statNum, { color: BLUE }]}>{stats.total}</Text>
                                        <FolderOpen size={18} color={BLUE} />
                                    </View>
                                </View>
                                <View style={[styles.statCell, { backgroundColor: "#F0FDF4" }]}>
                                    <Text style={styles.statLabel}>APPROVED</Text>
                                    <View style={styles.statRow}>
                                        <Text style={[styles.statNum, { color: "#16A34A" }]}>{stats.aprobado}</Text>
                                        <CheckCircle size={18} color="#16A34A" />
                                    </View>
                                </View>
                                <View style={[styles.statCell, { backgroundColor: "#FEFCE8" }]}>
                                    <Text style={styles.statLabel}>PENDING</Text>
                                    <View style={styles.statRow}>
                                        <Text style={[styles.statNum, { color: "#CA8A04" }]}>{stats.pendiente}</Text>
                                        <Clock size={18} color="#CA8A04" />
                                    </View>
                                </View>
                                <View style={[styles.statCell, { backgroundColor: "#FEF2F2" }]}>
                                    <Text style={styles.statLabel}>REJECTED</Text>
                                    <View style={styles.statRow}>
                                        <Text style={[styles.statNum, { color: "#DC2626" }]}>{stats.rechazado}</Text>
                                        <XCircle size={18} color="#DC2626" />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Recent Projects */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Projects</Text>
                            <TouchableOpacity onPress={() => router.push("/(fendestudiante)/mis-proyectos" as any)}>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? null : recientes.length === 0 ? (
                            <Text style={styles.emptyText}>No has subido proyectos aún.</Text>
                        ) : (
                            recientes.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={styles.recentItem}
                                    onPress={() => router.push(`/(fendestudiante)/feed/${p.id}` as any)}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.projectIcon}>
                                        <Text style={styles.projectEmoji}>📁</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.projectName} numberOfLines={1}>{p.nombre}</Text>
                                        <Text style={styles.projectDate}>
                                            Enviado:{" "}
                                            {new Date(p.fecha_creacion).toLocaleDateString("es-MX", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </Text>
                                    </View>
                                    <StatusBadge status={p.estatus} />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {/* Logout */}
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                        activeOpacity={0.85}
                    >
                        <LogOut size={18} color="#DC2626" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    gradientHeader: {
        alignItems: "center",
        paddingTop: 36,
        paddingBottom: 32,
        gap: 6,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    avatarText: { fontSize: 32, fontWeight: "700", color: WHITE },
    verifiedDot: {
        position: "absolute",
        bottom: 2,
        right: 2,
        backgroundColor: WHITE,
        borderRadius: 10,
        padding: 2,
    },
    userName: { fontSize: 20, fontWeight: "700", color: WHITE },
    userEmail: { fontSize: 13, color: "rgba(255,255,255,0.72)" },
    studentBadge: {
        marginTop: 6,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 5,
    },
    studentBadgeText: { fontSize: 11, fontWeight: "800", color: WHITE, letterSpacing: 1.5 },
    body: { padding: 20, gap: 20 },
    statsCard: {
        backgroundColor: WHITE,
        borderRadius: 20,
        padding: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        gap: 14,
    },
    statsTitle: { fontSize: 16, fontWeight: "700", color: TEXT },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    statCell: {
        flex: 1,
        minWidth: "45%",
        borderRadius: 14,
        padding: 14,
        gap: 8,
    },
    statLabel: { fontSize: 10, fontWeight: "700", color: MUTED, letterSpacing: 0.5 },
    statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    statNum: { fontSize: 28, fontWeight: "800" },
    section: { gap: 10 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: TEXT },
    seeAll: { fontSize: 13, fontWeight: "600", color: BLUE },
    recentItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: WHITE,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },
    projectIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
    },
    projectEmoji: { fontSize: 20 },
    projectName: { fontSize: 14, fontWeight: "600", color: TEXT },
    projectDate: { fontSize: 11, color: MUTED, marginTop: 2 },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1.5,
        borderColor: "#DC2626",
        borderRadius: 14,
        paddingVertical: 15,
        backgroundColor: "#FEF2F2",
    },
    logoutText: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
    emptyText: { textAlign: "center", color: MUTED, fontSize: 13 },
});
