import React from "react";
import { Tabs, Redirect } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Home, Plus, User, ClipboardList, Users, Shield } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/constants/colors";
import { ActivityIndicator } from "react-native";

export default function AppLayout() {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

    // ─── Tab bar del Administrador ───────────────────────────────────────────
    if (user?.role === "admin") {
        return (
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: colors.accent,
                    tabBarInactiveTintColor: colors.mutedForeground,
                    tabBarLabelStyle: styles.tabLabel,
                    tabBarItemStyle: styles.tabItem,
                }}
            >
                {/* Ocultamos las rutas normales */}
                <Tabs.Screen name="feed" options={{ href: null }} />
                <Tabs.Screen name="create" options={{ href: null }} />

                {/* 4 tabs del admin */}
                <Tabs.Screen
                    name="admin/home"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="admin"
                    options={{
                        title: "Proyectos",
                        tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="admin/usuarios"
                    options={{
                        title: "Usuarios",
                        tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Perfil",
                        tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
                    }}
                />
            </Tabs>
        );
    }

    // ─── Tab bar de Estudiante / Maestro ─────────────────────────────────────
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
            }}
        >
            {/* Ocultamos rutas admin */}
            <Tabs.Screen name="admin" options={{ href: null }} />
            <Tabs.Screen name="admin/usuarios" options={{ href: null }} />

            <Tabs.Screen
                name="feed"
                options={{
                    title: "Inicio",
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title: "",
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.createBtn}>
                            <Plus size={28} color="#fff" />
                        </View>
                    ),
                    // Solo estudiantes pueden crear
                    href: user?.role === "student" ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
        paddingBottom: 24,
        height: 80,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
    },
    tabLabel: { fontSize: 11, fontWeight: "500" },
    tabItem: { paddingTop: 4 },
    createBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        elevation: 8,
        shadowColor: colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
});
