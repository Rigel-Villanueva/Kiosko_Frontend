import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Plus,
    Trash2,
    FileText,
    Image as ImageIcon,
    GitBranch,
    Video,
    ChevronDown,
    ChevronUp,
    Rocket,
    X,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Project } from "@/lib/types";

const BLUE = "#2563EB";
const TEXT = "#1E293B";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";
const BG = "#F8FAFC";

const CATEGORIAS = [
    "Design", "Engineering", "Business", "Biology",
    "Computing", "Arts", "Science", "Technology", "General",
];

export default function CrearProyectoScreen() {
    const router = useRouter();
    const { editId } = useLocalSearchParams<{ editId?: string }>();
    const { user } = useAuth();
    const { addProject, updateProyecto, uploadFile, getMisProyectos } = useApp();

    const isEdit = !!editId;

    // Form state
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [categoria, setCategoria] = useState("");
    const [autores, setAutores] = useState<string[]>([user?.email || ""]);
    const [repoUrl, setRepoUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [imgUrl, setImgUrl] = useState("");

    const [catOpen, setCatOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(false);

    // Load project data if editing
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            setLoadingEdit(true);
            const proyectos = await getMisProyectos();
            const p = proyectos.find((x) => x.id === editId);
            if (p) {
                setNombre(p.nombre);
                setDescripcion(p.descripcion);
                setCategoria(p.category || "");
                setAutores(p.autores_correos?.length ? p.autores_correos : [user?.email || ""]);
                setRepoUrl(p.evidencias?.repositorio_git || "");
                setVideoUrl(p.evidencias?.videos?.[0]?.url || "");
                setPdfUrl(p.evidencias?.documentos_pdf?.[0] || "");
                setImgUrl(p.evidencias?.imagenes?.[0] || "");
            }
            setLoadingEdit(false);
        })();
    }, [editId]);

    const addAuthor = () => setAutores((prev) => [...prev, ""]);
    const removeAuthor = (i: number) => setAutores((prev) => prev.filter((_, idx) => idx !== i));
    const setAuthor = (i: number, val: string) =>
        setAutores((prev) => prev.map((a, idx) => (idx === i ? val : a)));

    const pickPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf"],
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets?.[0]) return;
            const asset = result.assets[0];
            setUploadingPdf(true);
            const url = await uploadFile(asset.uri, asset.name, "application/pdf");
            setPdfUrl(url);
        } catch (e) {
            Alert.alert("Error", "No se pudo subir el PDF.");
        } finally {
            setUploadingPdf(false);
        }
    };

    const pickImage = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Permiso requerido", "Se necesita acceso a la galería.");
            return;
        }
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            });
            if (result.canceled || !result.assets?.[0]) return;
            const asset = result.assets[0];
            const fileName = asset.fileName || `img_${Date.now()}.jpg`;
            const mimeType = asset.type === "image" ? "image/jpeg" : "image/jpeg";
            setUploadingImg(true);
            const url = await uploadFile(asset.uri, fileName, mimeType);
            setImgUrl(url);
        } catch (e) {
            Alert.alert("Error", "No se pudo subir la imagen.");
        } finally {
            setUploadingImg(false);
        }
    };

    const validate = () => {
        if (!nombre.trim()) return "El nombre del proyecto es requerido.";
        if (!descripcion.trim()) return "La descripción es requerida.";
        if (!categoria) return "Selecciona una categoría.";
        if (autores.some((a) => !a.trim())) return "Completa todos los correos de los autores.";
        return null;
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) { Alert.alert("Falta información", err); return; }

        setSubmitting(true);
        const data: Partial<Project> = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            category: categoria,
            autores_correos: autores.map((a) => a.trim().toLowerCase()),
            evidencias: {
                repositorio_git: repoUrl.trim(),
                videos: videoUrl.trim()
                    ? [{ titulo: "Video del proyecto", url: videoUrl.trim() }]
                    : [],
                imagenes: imgUrl ? [imgUrl] : [],
                documentos_pdf: pdfUrl ? [pdfUrl] : [],
                diapositivas: "",
            },
        };

        const result = isEdit
            ? await updateProyecto(editId!, data)
            : await addProject(data);

        setSubmitting(false);

        if (result.ok) {
            Alert.alert(
                isEdit ? "Proyecto actualizado" : "Proyecto enviado",
                isEdit
                    ? "Tu proyecto fue actualizado y volvió a estado pendiente."
                    : "Tu proyecto fue enviado y está en revisión.",
                [{ text: "OK", onPress: () => router.replace("/(fendestudiante)/mis-proyectos" as any) }]
            );
        } else {
            Alert.alert("Error", result.error || "Ocurrió un error al publicar.");
        }
    };

    if (loadingEdit) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.center}><ActivityIndicator size="large" color={BLUE} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={TEXT} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? "Editar Proyecto" : "Create Project"}</Text>
                {/* Progress dots */}
                <View style={styles.dotsRow}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {isEdit && (
                    <View style={styles.editNotice}>
                        <Text style={styles.editNoticeText}>
                            ⚠️ Editar el proyecto lo regresará a estado "Pendiente" para revisión.
                        </Text>
                    </View>
                )}

                {/* PROJECT DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>PROJECT DETAILS</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Project Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Eco-Friendly Water Filter"
                            placeholderTextColor={MUTED}
                            value={nombre}
                            onChangeText={setNombre}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Describe the problem you are solving and your solution..."
                            placeholderTextColor={MUTED}
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Category</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setCatOpen(!catOpen)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.dropdownText, !categoria && { color: MUTED }]}>
                                {categoria || "Select a category"}
                            </Text>
                            {catOpen ? <ChevronUp size={18} color={MUTED} /> : <ChevronDown size={18} color={MUTED} />}
                        </TouchableOpacity>
                        {catOpen && (
                            <View style={styles.dropdownList}>
                                {CATEGORIAS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.dropdownItem, categoria === c && styles.dropdownItemActive]}
                                        onPress={() => { setCategoria(c); setCatOpen(false); }}
                                    >
                                        <Text style={[styles.dropdownItemText, categoria === c && { color: WHITE, fontWeight: "700" }]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* TEAM MEMBERS */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionLabel}>TEAM MEMBERS</Text>
                        <TouchableOpacity onPress={addAuthor}>
                            <Text style={styles.addAuthorLink}>Add Author</Text>
                        </TouchableOpacity>
                    </View>
                    {autores.map((email, i) => (
                        <View key={i} style={styles.authorRow}>
                            <Text style={styles.atSign}>@</Text>
                            <TextInput
                                style={[styles.input, styles.authorInput]}
                                placeholder={i === 0 ? "student@university.edu" : "collaborator@university.edu"}
                                placeholderTextColor={MUTED}
                                value={email}
                                onChangeText={(v) => setAuthor(i, v)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {i > 0 && (
                                <TouchableOpacity onPress={() => removeAuthor(i)} style={styles.removeBtn}>
                                    <Trash2 size={16} color="#DC2626" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

                {/* Publish button */}
                <TouchableOpacity
                    style={[styles.publishBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.88}
                >
                    {submitting ? (
                        <ActivityIndicator color={WHITE} />
                    ) : (
                        <>
                            <Text style={styles.publishText}>
                                {isEdit ? "Actualizar Proyecto " : "Publish Project "}
                            </Text>
                            <Rocket size={18} color={WHITE} />
                        </>
                    )}
                </TouchableOpacity>

                {/* EVIDENCES */}
                <View style={styles.section}>
                    {/* Upload PDF */}
                    <View style={styles.uploadRow}>
                        <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={pickPdf}
                            disabled={uploadingPdf}
                        >
                            {uploadingPdf ? (
                                <ActivityIndicator size="small" color={BLUE} />
                            ) : (
                                <>
                                    <FileText size={24} color={BLUE} />
                                    <Text style={styles.uploadText}>
                                        {pdfUrl ? "PDF subido ✓" : "Upload PDF"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={pickImage}
                            disabled={uploadingImg}
                        >
                            {uploadingImg ? (
                                <ActivityIndicator size="small" color={BLUE} />
                            ) : (
                                <>
                                    <ImageIcon size={24} color={BLUE} />
                                    <Text style={styles.uploadText}>
                                        {imgUrl ? "Imagen subida ✓" : "Upload Image"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Git URL */}
                    <View style={styles.urlField}>
                        <GitBranch size={16} color={MUTED} />
                        <TextInput
                            style={styles.urlInput}
                            placeholder="Git Repository URL"
                            placeholderTextColor={MUTED}
                            value={repoUrl}
                            onChangeText={setRepoUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        {repoUrl ? <TouchableOpacity onPress={() => setRepoUrl("")}><X size={14} color={MUTED} /></TouchableOpacity> : null}
                    </View>

                    {/* Video URL */}
                    <View style={styles.urlField}>
                        <Video size={16} color={MUTED} />
                        <TextInput
                            style={styles.urlInput}
                            placeholder="Video Demonstration URL"
                            placeholderTextColor={MUTED}
                            value={videoUrl}
                            onChangeText={setVideoUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        {videoUrl ? <TouchableOpacity onPress={() => setVideoUrl("")}><X size={14} color={MUTED} /></TouchableOpacity> : null}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: WHITE,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        gap: 12,
    },
    backBtn: { padding: 2 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: TEXT },
    dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
    dotActive: { backgroundColor: BLUE, width: 24, borderRadius: 4 },
    scrollContent: { padding: 20, paddingBottom: 100, gap: 24 },
    editNotice: {
        backgroundColor: "#FFFBEB",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FEF08A",
        padding: 12,
    },
    editNoticeText: { fontSize: 13, color: "#92400E" },
    section: { gap: 14 },
    sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionLabel: { fontSize: 11, fontWeight: "800", color: MUTED, letterSpacing: 1.2 },
    addAuthorLink: { fontSize: 13, fontWeight: "700", color: BLUE },
    field: { gap: 6 },
    label: { fontSize: 14, fontWeight: "600", color: TEXT },
    input: {
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 13,
        fontSize: 14,
        color: TEXT,
    },
    textarea: { height: 110, paddingTop: 13 },
    dropdown: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 13,
    },
    dropdownText: { flex: 1, fontSize: 14, color: TEXT },
    dropdownList: {
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        overflow: "hidden",
        marginTop: -8,
    },
    dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
    dropdownItemActive: { backgroundColor: BLUE },
    dropdownItemText: { fontSize: 14, color: TEXT },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    atSign: { fontSize: 16, color: MUTED, fontWeight: "600", paddingLeft: 4 },
    authorInput: { flex: 1 },
    removeBtn: {
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
    },
    publishBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: BLUE,
        borderRadius: 14,
        paddingVertical: 16,
    },
    publishText: { fontSize: 16, fontWeight: "700", color: WHITE },
    uploadRow: { flexDirection: "row", gap: 12 },
    uploadBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1.5,
        borderColor: BORDER,
        borderStyle: "dashed",
        borderRadius: 12,
        paddingVertical: 18,
        backgroundColor: WHITE,
    },
    uploadText: { fontSize: 12, fontWeight: "600", color: MUTED },
    urlField: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
    },
    urlInput: { flex: 1, fontSize: 14, color: TEXT },
});
