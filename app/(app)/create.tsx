import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Globe,
    Plus,
    X,
    Paperclip,
    GitBranch,
    Video,
    Trash2,
    FileText,
    Presentation,
    ImageIcon,
    Upload,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { GradientHeader } from "@/components/GradientHeader";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/colors";
import { uploadToSupabase } from "@/lib/supabase";

export default function CreateScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { addProject } = useApp();

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [correos, setCorreos] = useState([user?.email || ""]);
    const [gitRepo, setGitRepo] = useState("");
    const [videos, setVideos] = useState([{ titulo: "", url: "" }]);
    const [imagenes, setImagenes] = useState<string[]>([]);
    const [pdfs, setPdfs] = useState<string[]>([]);
    const [slides, setSlides] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<"imagenes" | "pdf" | null>(null);

    // ── Seleccionar imágenes desde galería o cámara ──
    const pickImage = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets.length > 0) {
            setUploading("imagenes");
            try {
                const urls = await Promise.all(
                    result.assets.map((asset) =>
                        uploadToSupabase(
                            asset.uri,
                            asset.fileName || `img_${Date.now()}.jpg`,
                            asset.mimeType || "image/jpeg",
                            "imagenes"
                        )
                    )
                );
                setImagenes((prev) => [...prev, ...urls]);
            } catch (e: any) {
                Alert.alert("Error de upload", e.message || "No se pudo subir la imagen.");
            } finally {
                setUploading(null);
            }
        }
    };

    // ── Seleccionar PDF desde el sistema de archivos ──
    const pickPdf = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: "application/pdf",
            multiple: true,
            copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets.length > 0) {
            setUploading("pdf");
            try {
                const urls = await Promise.all(
                    result.assets.map((asset) =>
                        uploadToSupabase(
                            asset.uri,
                            asset.name || `doc_${Date.now()}.pdf`,
                            asset.mimeType || "application/pdf",
                            "pdfs"
                        )
                    )
                );
                setPdfs((prev) => [...prev, ...urls]);
            } catch (e: any) {
                Alert.alert("Error de upload", e.message || "No se pudo subir el PDF.");
            } finally {
                setUploading(null);
            }
        }
    };

    const handlePublicar = async () => {
        if (!titulo.trim() || !descripcion.trim()) {
            Alert.alert("Campos requeridos", "El título y la descripción son obligatorios.");
            return;
        }
        setLoading(true);
        const result = await addProject({
            nombre: titulo.trim(),
            descripcion: descripcion.trim(),
            subido_por: user?.id || "",
            fecha_creacion: new Date().toISOString().split("T")[0],
            autores_correos: correos.filter((c) => c.trim()),
            estatus: "pendiente",
            promedio_general: 0,
            evidencias: {
                repositorio_git: gitRepo.trim(),
                videos: videos.filter((v) => v.url.trim()),
                imagenes,
                documentos_pdf: pdfs,
                diapositivas: slides.trim(),
            },
            evaluaciones_docentes: [],
            category: "General",
            image: imagenes[0] || "",
            authorName: user?.name || "",
            authorAvatar: user?.avatar || "",
            communityRating: 0,
            comments: [],
        });
        setLoading(false);
        if (result.ok) {
            Alert.alert("¡Publicado!", "Tu proyecto fue enviado para revisión.", [
                { text: "OK", onPress: () => router.replace("/(app)/feed") },
            ]);
        } else {
            Alert.alert("Error", result.error || "No se pudo publicar el proyecto.");
        }
    };

    const isUploading = uploading !== null;

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 60 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <GradientHeader>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backBtn}
                            activeOpacity={0.8}
                        >
                            <ArrowLeft size={18} color="#FAFAFA" />
                            <Text style={styles.backText}>Regresar</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Nueva Publicación</Text>
                        <Text style={styles.headerSub}>Comparte tu proyecto con la comunidad</Text>
                    </GradientHeader>

                    <View style={styles.body}>
                        {/* Visibilidad */}
                        <View style={styles.visWrap}>
                            <Globe size={16} color="#FAFAFA" />
                            <Text style={styles.visText}>Pública · Pendiente de revisión</Text>
                        </View>

                        {/* Título */}
                        <View style={styles.fieldWrap}>
                            <Text style={styles.label}>Título del proyecto *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Sistema de Gestión Escolar"
                                placeholderTextColor={colors.mutedForeground}
                                value={titulo}
                                onChangeText={setTitulo}
                            />
                        </View>

                        {/* Descripción */}
                        <View style={styles.fieldWrap}>
                            <Text style={styles.label}>Descripción *</Text>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                placeholder="Describe tu proyecto..."
                                placeholderTextColor={colors.mutedForeground}
                                value={descripcion}
                                onChangeText={setDescripcion}
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        {/* Correos autores */}
                        <View style={styles.fieldWrap}>
                            <Text style={styles.label}>Correos de los autores</Text>
                            {correos.map((c, i) => (
                                <View key={i} style={[styles.dynamicRow, { marginBottom: 6 }]}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="correo@ejemplo.com"
                                        placeholderTextColor={colors.mutedForeground}
                                        value={c}
                                        onChangeText={(v) => {
                                            const copy = [...correos];
                                            copy[i] = v;
                                            setCorreos(copy);
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    {correos.length > 1 && (
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => setCorreos(correos.filter((_, idx) => idx !== i))}
                                        >
                                            <X size={16} color={colors.mutedForeground} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => setCorreos([...correos, ""])}
                            >
                                <Plus size={14} color={colors.accent} />
                                <Text style={styles.addBtnText}>Agregar otro autor</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ── EVIDENCIAS CARD ── */}
                        <View style={styles.evidCard}>
                            <View style={styles.evidCardHeader}>
                                <Paperclip size={20} color={colors.accent} />
                                <Text style={styles.evidCardTitle}>Evidencias del Proyecto</Text>
                            </View>

                            {/* Git */}
                            <View style={styles.fieldWrap}>
                                <View style={styles.evidLabelRow}>
                                    <GitBranch size={14} color={colors.mutedForeground} />
                                    <Text style={styles.evidFieldLabel}>Repositorio Git</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="https://github.com/..."
                                    placeholderTextColor={colors.mutedForeground}
                                    value={gitRepo}
                                    onChangeText={setGitRepo}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Videos */}
                            <View style={styles.fieldWrap}>
                                <View style={styles.evidLabelRow}>
                                    <Video size={14} color={colors.mutedForeground} />
                                    <Text style={styles.evidFieldLabel}>Videos (URL)</Text>
                                </View>
                                {videos.map((v, i) => (
                                    <View key={i} style={{ gap: 6, marginBottom: 6 }}>
                                        <View style={styles.dynamicRow}>
                                            <TextInput
                                                style={[styles.input, { width: 110 }]}
                                                placeholder="Título"
                                                placeholderTextColor={colors.mutedForeground}
                                                value={v.titulo}
                                                onChangeText={(txt) => {
                                                    const copy = [...videos];
                                                    copy[i] = { ...copy[i], titulo: txt };
                                                    setVideos(copy);
                                                }}
                                            />
                                            <TextInput
                                                style={[styles.input, { flex: 1 }]}
                                                placeholder="https://youtube.com/..."
                                                placeholderTextColor={colors.mutedForeground}
                                                value={v.url}
                                                onChangeText={(txt) => {
                                                    const copy = [...videos];
                                                    copy[i] = { ...copy[i], url: txt };
                                                    setVideos(copy);
                                                }}
                                                autoCapitalize="none"
                                            />
                                            {videos.length > 1 && (
                                                <TouchableOpacity
                                                    style={styles.removeBtn}
                                                    onPress={() => setVideos(videos.filter((_, idx) => idx !== i))}
                                                >
                                                    <Trash2 size={14} color={colors.mutedForeground} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                                <TouchableOpacity
                                    style={styles.addBtn}
                                    onPress={() => setVideos([...videos, { titulo: "", url: "" }])}
                                >
                                    <Plus size={14} color={colors.accent} />
                                    <Text style={styles.addBtnText}>Agregar otro video</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Imágenes */}
                            <View style={styles.fieldWrap}>
                                <View style={styles.evidLabelRow}>
                                    <ImageIcon size={14} color={colors.mutedForeground} />
                                    <Text style={styles.evidFieldLabel}>Imágenes del proyecto</Text>
                                </View>
                                {imagenes.length > 0 && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={{ marginBottom: 8 }}
                                        contentContainerStyle={{ gap: 8 }}
                                    >
                                        {imagenes.map((uri, i) => (
                                            <View key={i} style={styles.imageThumbWrap}>
                                                <Image source={{ uri }} style={styles.imageThumb} resizeMode="cover" />
                                                <TouchableOpacity
                                                    style={styles.imageRemoveBtn}
                                                    onPress={() => setImagenes(imagenes.filter((_, idx) => idx !== i))}
                                                >
                                                    <X size={12} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                                <TouchableOpacity
                                    style={[styles.uploadBtn, uploading === "imagenes" && { opacity: 0.7 }]}
                                    onPress={pickImage}
                                    disabled={isUploading}
                                    activeOpacity={0.8}
                                >
                                    {uploading === "imagenes" ? (
                                        <ActivityIndicator size="small" color={colors.accent} />
                                    ) : (
                                        <Upload size={16} color={colors.accent} />
                                    )}
                                    <Text style={styles.uploadBtnText}>
                                        {uploading === "imagenes" ? "Subiendo..." : "Seleccionar imágenes"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* PDFs */}
                            <View style={styles.fieldWrap}>
                                <View style={styles.evidLabelRow}>
                                    <FileText size={14} color={colors.mutedForeground} />
                                    <Text style={styles.evidFieldLabel}>Documentos PDF</Text>
                                </View>
                                {pdfs.map((url, i) => (
                                    <View key={i} style={[styles.docChip, { marginBottom: 6 }]}>
                                        <FileText size={14} color={colors.accent} />
                                        <Text style={styles.docText} numberOfLines={1}>
                                            Documento {i + 1}
                                        </Text>
                                        <TouchableOpacity onPress={() => setPdfs(pdfs.filter((_, idx) => idx !== i))}>
                                            <X size={14} color={colors.mutedForeground} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity
                                    style={[styles.uploadBtn, uploading === "pdf" && { opacity: 0.7 }]}
                                    onPress={pickPdf}
                                    disabled={isUploading}
                                    activeOpacity={0.8}
                                >
                                    {uploading === "pdf" ? (
                                        <ActivityIndicator size="small" color={colors.accent} />
                                    ) : (
                                        <Upload size={16} color={colors.accent} />
                                    )}
                                    <Text style={styles.uploadBtnText}>
                                        {uploading === "pdf" ? "Subiendo..." : "Seleccionar PDFs"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Slides */}
                            <View style={styles.fieldWrap}>
                                <View style={styles.evidLabelRow}>
                                    <Presentation size={14} color={colors.mutedForeground} />
                                    <Text style={styles.evidFieldLabel}>Diapositivas (URL)</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="https://canva.com/ o Google Slides"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={slides}
                                    onChangeText={setSlides}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, (loading || isUploading) && { opacity: 0.65 }]}
                            onPress={handlePublicar}
                            disabled={loading || isUploading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Publicar en el Podium</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    backText: { fontSize: 14, color: "rgba(250,250,250,0.9)" },
    headerTitle: { fontSize: 24, fontWeight: "700", color: "#FAFAFA", marginBottom: 4 },
    headerSub: { fontSize: 13, color: "rgba(250,250,250,0.8)" },
    body: { padding: 20, gap: 16 },
    visWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignSelf: "flex-start",
    },
    visText: { fontSize: 13, fontWeight: "500", color: "#FAFAFA" },
    fieldWrap: { gap: 6 },
    label: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    input: {
        borderWidth: 1,
        borderColor: colors.input,
        borderRadius: 12,
        backgroundColor: colors.card,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.foreground,
    },
    textarea: { minHeight: 100, textAlignVertical: "top" },
    dynamicRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    removeBtn: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.card,
    },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
    addBtnText: { fontSize: 13, fontWeight: "600", color: colors.accent },
    evidCard: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        backgroundColor: colors.card,
        padding: 18,
        gap: 14,
    },
    evidCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    evidCardTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },
    evidLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    evidFieldLabel: { fontSize: 13, fontWeight: "500", color: colors.foreground },
    uploadBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1.5,
        borderColor: colors.accent,
        borderStyle: "dashed",
        borderRadius: 12,
        paddingVertical: 12,
        backgroundColor: `${colors.accent}08`,
    },
    uploadBtnText: { fontSize: 13, fontWeight: "600", color: colors.accent },
    imageThumbWrap: { position: "relative" },
    imageThumb: { width: 80, height: 80, borderRadius: 10 },
    imageRemoveBtn: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
    },
    docChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.muted,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    docText: { flex: 1, fontSize: 13, color: colors.foreground },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
    },
    submitBtnText: { color: "#FAFAFA", fontWeight: "700", fontSize: 16 },
});
