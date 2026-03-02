import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackendAPI } from "@/lib/api";

const AUTH_KEY = "podium_auth_user";
const AUTH_TOKEN_KEY = "podium_auth_token";

export type UserRole = "alumno" | "docente" | "admin";

export interface User {
    id: string;
    nombre: string;
    email: string;
    rol: UserRole;
    grupo?: string;
}

export const authStore = {
    // Iniciar sesión
    async login(email: string, password: string): Promise<User | null> {
        const response = await BackendAPI.login({ correo: email, password });
        if (!response || !response.token) return null;

        // Decodificar JWT simple (solo el payload) en Base64 para extraer el rol y nombre
        const base64Url = response.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const nameIdentifier = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        const claimName = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        const user: User = {
            id: nameIdentifier || "unknown_id",
            nombre: claimName || "Usuario",
            email: email,
            rol: (role?.toLowerCase() === "estudiante" ? "alumno" : role?.toLowerCase() === "maestro" ? "docente" : "admin"),
        };

        // Guardar Token y Usuario Auth State
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
        return user;
    },

    // Cerrar sesión
    async logout(): Promise<void> {
        await AsyncStorage.removeItem(AUTH_KEY);
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    },

    // Obtener usuario actual
    async getCurrentUser(): Promise<User | null> {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as User;
    },

    // Registrar nuevo usuario
    async register(
        nombre: string,
        email: string,
        password: string,
        rol: UserRole,
        grupo?: string
    ): Promise<boolean> {
        const payload = {
            nombre,
            correo: email,
            password,
            rol: rol === "alumno" ? "estudiante" : rol === "docente" ? "maestro" : "admin",
        };
        const response = await BackendAPI.register(payload);
        return true; // Si throwea error, lo ataja la UI
    },
};
