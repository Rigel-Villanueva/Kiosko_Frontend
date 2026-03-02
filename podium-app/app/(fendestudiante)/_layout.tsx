import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Home, FolderOpen, Plus, User } from "lucide-react-native";

const BLUE = "#2563EB";
const MUTED = "#94A3B8";

export default function FendEstudianteLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: BLUE,
                tabBarInactiveTintColor: MUTED,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
            }}
        >
            <Tabs.Screen
                name="feed/index"
                options={{
                    title: "Feed",
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="mis-proyectos"
                options={{
                    title: "Proyectos",
                    tabBarIcon: ({ color, size }) => <FolderOpen size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="crear"
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View style={styles.fab}>
                            <Plus size={26} color="#fff" />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
            {/* Rutas ocultas del tab bar */}
            <Tabs.Screen name="feed/[id]" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingBottom: 20,
        paddingTop: 8,
        height: 72,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
    },
    tabLabel: { fontSize: 11, fontWeight: "500" },
    tabItem: { paddingTop: 4 },
    fab: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: BLUE,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 22,
        elevation: 6,
        shadowColor: BLUE,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
});
