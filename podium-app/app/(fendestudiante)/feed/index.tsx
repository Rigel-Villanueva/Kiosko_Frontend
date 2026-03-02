import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    StatusBar,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Bell, Star } from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Project } from "@/lib/types";

const BG = "#F5F7FA";
const WHITE = "#FFFFFF";
const BLUE = "#2563EB";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

function getCategoryColor(cat: string): string {
    const map: Record<string, string> = {
        Design: "#7C3AED",
        Engineering: "#0891B2",
        Business: "#059669",
        Biology: "#16A34A",
        Computing: "#2563EB",
        Arts: "#DC2626",
        Science: "#D97706",
        Technology: "#0284C7",
        General: "#64748B",
    };
    return map[cat] || "#64748B";
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function FeaturedCard({ project, onPress }: { project: Project; onPress: () => void }) {
    const catColor = getCategoryColor(project.category || "General");
    return (
        <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.88}>
            <Image
                source={{ uri: project.image || `https://picsum.photos/seed/${project.id}/300/200` }}
                style={styles.featuredImg}
                resizeMode="cover"
            />
            {project.promedio_general > 0 && (
                <View style={styles.starBadge}>
                    <Star size={11} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.starText}>{Math.round(project.promedio_general)}</Text>
                </View>
            )}
            <View style={styles.featuredInfo}>
                <View style={[styles.catPill, { backgroundColor: `${catColor}18` }]}>
                    <Text style={[styles.catText, { color: catColor }]}>
                        {(project.category || "GENERAL").toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>{project.nombre}</Text>
                <View style={styles.authorRow}>
                    <View style={styles.authorDot}>
                        <Text style={styles.authorDotText}>{project.authorName?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.authorName} numberOfLines={1}>{project.authorName}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function RecentItem({ project, onPress }: { project: Project; onPress: () => void }) {
    const catColor = getCategoryColor(project.category || "General");
    return (
        <TouchableOpacity style={styles.recentItem} onPress={onPress} activeOpacity={0.88}>
            <Image
                source={{ uri: project.image || `https://picsum.photos/seed/${project.id}/150/150` }}
                style={styles.recentThumb}
                resizeMode="cover"
            />
            <View style={styles.recentInfo}>
                <View style={[styles.catPill, { backgroundColor: `${catColor}18`, alignSelf: "flex-start" }]}>
                    <Text style={[styles.catText, { color: catColor }]}>
                        {(project.category || "GENERAL").toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.recentTitle} numberOfLines={2}>{project.nombre}</Text>
                <View style={styles.recentMeta}>
                    <Text style={styles.byAuthor}>by {project.authorName}</Text>
                    <Text style={styles.timeText}>{timeAgo(project.fecha_creacion)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function FeedEstudianteScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { projects, isLoading, loadProjects, searchQuery, setSearchQuery } = useApp();
    const [refreshing, setRefreshing] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);

    useEffect(() => { loadProjects(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProjects();
        setRefreshing(false);
    };

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return projects;
        return projects.filter(
            (p) =>
                p.nombre.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.authorName?.toLowerCase().includes(q)
        );
    }, [projects, searchQuery]);

    const featured = useMemo(
        () => projects.filter((p) => p.promedio_general >= 80).slice(0, 6),
        [projects]
    );

    const firstName = user?.name?.split(" ")[0] || "Estudiante";
    const initial = user?.name?.charAt(0).toUpperCase() || "E";

    const goToDetail = (id: string) => router.push(`/(fendestudiante)/feed/${id}` as any);

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

            {/* Fixed header */}
            <View style={styles.header}>
                <View style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>{initial}</Text>
                </View>
                <Text style={styles.headerTitle}>Podium</Text>
                <TouchableOpacity style={styles.bellWrap}>
                    <Bell size={22} color={TEXT} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />
                }
            >
                {/* Welcome */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeText}>Welcome, {firstName}!</Text>
                    <Text style={styles.welcomeSub}>Ready to discover amazing student work?</Text>
                </View>

                {/* Search */}
                <View style={styles.searchWrap}>
                    <Search size={17} color={MUTED} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search projects or students"
                        placeholderTextColor={MUTED}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                </View>

                {/* Featured Projects */}
                {!searchQuery.trim() && featured.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Featured Projects</Text>
                            <TouchableOpacity onPress={() => setVisibleCount(999)}>
                                <Text style={styles.viewAll}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 14, paddingRight: 4 }}
                        >
                            {featured.map((p) => (
                                <FeaturedCard key={p.id} project={p} onPress={() => goToDetail(p.id)} />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Recent Projects */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {searchQuery.trim() ? "Results" : "Recent Projects"}
                    </Text>

                    {isLoading && projects.length === 0 ? (
                        <ActivityIndicator color={BLUE} style={{ marginTop: 32 }} />
                    ) : filtered.length === 0 ? (
                        <Text style={styles.emptyText}>No se encontraron proyectos</Text>
                    ) : (
                        <>
                            {filtered.slice(0, visibleCount).map((p) => (
                                <RecentItem key={p.id} project={p} onPress={() => goToDetail(p.id)} />
                            ))}
                            {visibleCount < filtered.length && (
                                <TouchableOpacity
                                    style={styles.loadMore}
                                    onPress={() => setVisibleCount((c) => c + 10)}
                                >
                                    <Text style={styles.loadMoreText}>Load more projects</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: WHITE,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${BLUE}20`,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarSmallText: { fontSize: 14, fontWeight: "700", color: BLUE },
    headerTitle: { fontSize: 17, fontWeight: "700", color: TEXT },
    bellWrap: { padding: 4 },
    scrollContent: { paddingBottom: 100, gap: 0 },
    welcomeSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4, gap: 4 },
    welcomeText: { fontSize: 26, fontWeight: "800", color: TEXT },
    welcomeSub: { fontSize: 14, color: MUTED },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginTop: 16,
    },
    searchInput: { flex: 1, fontSize: 14, color: TEXT },
    section: { paddingHorizontal: 20, marginTop: 24, gap: 12 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
    viewAll: { fontSize: 13, fontWeight: "600", color: BLUE },
    // Featured
    featuredCard: {
        width: 200,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: WHITE,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.09,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    featuredImg: { width: "100%", height: 130 },
    starBadge: {
        position: "absolute",
        top: 10,
        right: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "#1E293B",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    starText: { fontSize: 12, fontWeight: "700", color: "#FBBF24" },
    featuredInfo: { padding: 12, gap: 6 },
    catPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
    featuredTitle: { fontSize: 14, fontWeight: "700", color: TEXT, lineHeight: 20 },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    authorDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: `${MUTED}30`,
        alignItems: "center",
        justifyContent: "center",
    },
    authorDotText: { fontSize: 9, fontWeight: "700", color: MUTED },
    authorName: { fontSize: 12, color: MUTED, flex: 1 },
    // Recent
    recentItem: {
        flexDirection: "row",
        gap: 14,
        alignItems: "flex-start",
        backgroundColor: WHITE,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    recentThumb: { width: 72, height: 72, borderRadius: 10 },
    recentInfo: { flex: 1, gap: 5 },
    recentTitle: { fontSize: 14, fontWeight: "700", color: TEXT, lineHeight: 20 },
    recentMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    byAuthor: { fontSize: 12, color: MUTED },
    timeText: { fontSize: 11, color: MUTED },
    loadMore: { alignItems: "center", paddingVertical: 18 },
    loadMoreText: { fontSize: 14, fontWeight: "600", color: BLUE },
    emptyText: { textAlign: "center", color: MUTED, paddingTop: 32, fontSize: 14 },
});
