"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { SurfaceCard } from "@/components/PlatformCards";
import { QualityWarningList } from "@/components/QualityWarnings";
import { getProfileWarnings } from "@/lib/profile-consistency";
import { parseCommaSeparated, toCommaSeparated, type SettingsPayload } from "@/lib/settings-schema";

type ThemeMode = SettingsPayload["themeMode"];

type SettingsForm = {
    themeMode: ThemeMode;
    displayName: string;
    birthYear: string;
    ageRange: string;
    gender: string;
    location: string;
    shortBio: string;
    educationLevel: string;
    fieldOfStudy: string;
    institution: string;
    graduationStatus: string;
    learningGoals: string;
    currentStatus: string;
    currentRole: string;
    targetCareer: string;
    careerInterests: string;
    preferredWorkStyle: string;
    hobbies: string;
    interests: string;
    favoriteTopics: string;
    favoriteBookGenres: string;
    skillsToImprove: string;
    dislikedTopics: string;
};

const emptyForm: SettingsForm = {
    themeMode: "system",
    displayName: "",
    birthYear: "",
    ageRange: "",
    gender: "",
    location: "",
    shortBio: "",
    educationLevel: "",
    fieldOfStudy: "",
    institution: "",
    graduationStatus: "",
    learningGoals: "",
    currentStatus: "",
    currentRole: "",
    targetCareer: "",
    careerInterests: "",
    preferredWorkStyle: "",
    hobbies: "",
    interests: "",
    favoriteTopics: "",
    favoriteBookGenres: "",
    skillsToImprove: "",
    dislikedTopics: "",
};

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: "light", label: "Terang" },
    { value: "dark", label: "Gelap" },
    { value: "system", label: "Ikuti Sistem" },
];

const educationLevels = [
    "SMA/SMK",
    "Diploma",
    "S1",
    "S2",
    "S3",
    "Bootcamp/Kursus",
    "Belajar Mandiri",
    "Lainnya",
];

const graduationStatuses = [
    "Masih belajar",
    "Lulus",
    "Berhenti",
    "Tidak ingin menyebutkan",
];

const currentStatuses = [
    "Pelajar",
    "Mahasiswa",
    "Fresh Graduate",
    "Bekerja",
    "Freelancer",
    "Mencari Kerja",
    "Wirausaha",
    "Lainnya",
];

function formFromSettings(settings: SettingsPayload): SettingsForm {
    return {
        themeMode: settings.themeMode,
        displayName: settings.displayName ?? "",
        birthYear: settings.birthYear ? String(settings.birthYear) : "",
        ageRange: settings.ageRange ?? "",
        gender: settings.gender ?? "",
        location: settings.location ?? "",
        shortBio: settings.shortBio ?? "",
        educationLevel: settings.educationLevel ?? "",
        fieldOfStudy: settings.fieldOfStudy ?? "",
        institution: settings.institution ?? "",
        graduationStatus: settings.graduationStatus ?? "",
        learningGoals: toCommaSeparated(settings.learningGoals),
        currentStatus: settings.currentStatus ?? "",
        currentRole: settings.currentRole ?? "",
        targetCareer: settings.targetCareer ?? "",
        careerInterests: toCommaSeparated(settings.careerInterests),
        preferredWorkStyle: settings.preferredWorkStyle ?? "",
        hobbies: toCommaSeparated(settings.hobbies),
        interests: toCommaSeparated(settings.interests),
        favoriteTopics: toCommaSeparated(settings.favoriteTopics),
        favoriteBookGenres: toCommaSeparated(settings.favoriteBookGenres),
        skillsToImprove: toCommaSeparated(settings.skillsToImprove),
        dislikedTopics: toCommaSeparated(settings.dislikedTopics),
    };
}

function payloadFromForm(form: SettingsForm): SettingsPayload {
    return {
        themeMode: form.themeMode,
        displayName: form.displayName || null,
        birthYear: form.birthYear ? Number(form.birthYear) : null,
        ageRange: form.ageRange || null,
        gender: form.gender || null,
        location: form.location || null,
        shortBio: form.shortBio || null,
        educationLevel: form.educationLevel || null,
        fieldOfStudy: form.fieldOfStudy || null,
        institution: form.institution || null,
        graduationStatus: form.graduationStatus || null,
        learningGoals: parseCommaSeparated(form.learningGoals),
        currentStatus: form.currentStatus || null,
        currentRole: form.currentRole || null,
        targetCareer: form.targetCareer || null,
        careerInterests: parseCommaSeparated(form.careerInterests),
        preferredWorkStyle: form.preferredWorkStyle || null,
        hobbies: parseCommaSeparated(form.hobbies),
        interests: parseCommaSeparated(form.interests),
        favoriteTopics: parseCommaSeparated(form.favoriteTopics),
        favoriteBookGenres: parseCommaSeparated(form.favoriteBookGenres),
        skillsToImprove: parseCommaSeparated(form.skillsToImprove),
        dislikedTopics: parseCommaSeparated(form.dislikedTopics),
    };
}

function TextInput({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="field mt-2"
            />
        </label>
    );
}

function TextArea({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="field mt-2 min-h-24 resize-y"
            />
        </label>
    );
}

function SelectInput({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <label className="block">
            <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="field mt-2">
                <option value="">Pilih opsi</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function SettingsPage() {
    const { status } = useSession();
    const { setTheme } = useTheme();
    const [form, setForm] = useState<SettingsForm>(emptyForm);
    const [savedForm, setSavedForm] = useState<SettingsForm>(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function updateField<K extends keyof SettingsForm>(field: K, value: SettingsForm[K]) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    useEffect(() => {
        async function loadSettings() {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch("/api/settings");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error || "Gagal memuat pengaturan.");
                }

                const nextForm = formFromSettings(data.settings);
                setForm(nextForm);
                setSavedForm(nextForm);
                setTheme(nextForm.themeMode);
            } catch (loadError) {
                console.error("Settings load failed:", loadError);
                setError("Gagal memuat pengaturan.");
            } finally {
                setLoading(false);
            }
        }

        if (status === "authenticated") {
            loadSettings();
            return;
        }

        if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [setTheme, status]);

    async function saveSettings() {
        try {
            setSaving(true);
            setMessage(null);
            setError(null);
            const payload = payloadFromForm(form);
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Pengaturan gagal disimpan.");
            }

            const nextForm = formFromSettings(data.settings);
            setForm(nextForm);
            setSavedForm(nextForm);
            setTheme(nextForm.themeMode);
            setMessage("Pengaturan berhasil disimpan.");
        } catch (saveError) {
            console.error("Settings save failed:", saveError);
            setError(saveError instanceof Error ? saveError.message : "Pengaturan gagal disimpan.");
        } finally {
            setSaving(false);
        }
    }

    function resetChanges() {
        setForm(savedForm);
        setTheme(savedForm.themeMode);
        setMessage(null);
        setError(null);
    }

    const settingsWarnings = useMemo(
        () => getProfileWarnings(null, payloadFromForm(form)).filter((warning) => warning.area === "settings" || warning.id === "settings-book-genres-missing" || warning.id === "settings-career-goal-missing"),
        [form]
    );

    if (loading || status === "loading") {
        return (
            <SurfaceCard title="Pengaturan">
                <div className="flex min-h-72 flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500 dark:text-cyan-300" />
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Memuat pengaturan...</p>
                </div>
            </SurfaceCard>
        );
    }

    if (status !== "authenticated") {
        return (
            <SurfaceCard title="Pengaturan">
                <div className="py-10 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Masuk terlebih dahulu untuk mengelola pengaturan.</p>
                    <div className="mt-5 flex justify-center gap-3">
                        <Link href="/login" className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                            Masuk
                        </Link>
                        <Link href="/register" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
                            Daftar
                        </Link>
                    </div>
                </div>
            </SurfaceCard>
        );
    }

    return (
        <div className="space-y-6">
            {message && (
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
                    {message}
                </div>
            )}
            {error && (
                <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-700 dark:text-red-200">
                    {error}
                </div>
            )}

            <SurfaceCard title="Kelengkapan Data">
                <QualityWarningList warnings={settingsWarnings} emptyMessage="Data pengaturan terlihat cukup lengkap untuk personalisasi." />
            </SurfaceCard>

            <SurfaceCard title="Tampilan">
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Tema</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    updateField("themeMode", option.value);
                                    setTheme(option.value);
                                }}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    form.themeMode === option.value
                                        ? "bg-cyan-300 text-slate-950"
                                        : "border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </SurfaceCard>

            <SurfaceCard title="Data Diri">
                <div className="grid gap-4 md:grid-cols-2">
                    <TextInput label="Nama panggilan" value={form.displayName} onChange={(value) => updateField("displayName", value)} />
                    <TextInput label="Tahun lahir" type="number" value={form.birthYear} onChange={(value) => updateField("birthYear", value)} />
                    <TextInput label="Rentang usia" value={form.ageRange} onChange={(value) => updateField("ageRange", value)} />
                    <TextInput label="Gender" value={form.gender} onChange={(value) => updateField("gender", value)} />
                    <TextInput label="Lokasi" value={form.location} onChange={(value) => updateField("location", value)} />
                    <div className="md:col-span-2">
                        <TextArea label="Bio singkat" value={form.shortBio} onChange={(value) => updateField("shortBio", value)} />
                    </div>
                </div>
            </SurfaceCard>

            <SurfaceCard title="Pendidikan">
                <div className="grid gap-4 md:grid-cols-2">
                    <SelectInput label="Pendidikan terakhir" value={form.educationLevel} options={educationLevels} onChange={(value) => updateField("educationLevel", value)} />
                    <TextInput label="Bidang studi" value={form.fieldOfStudy} onChange={(value) => updateField("fieldOfStudy", value)} />
                    <TextInput label="Institusi" value={form.institution} onChange={(value) => updateField("institution", value)} />
                    <SelectInput label="Status kelulusan" value={form.graduationStatus} options={graduationStatuses} onChange={(value) => updateField("graduationStatus", value)} />
                    <div className="md:col-span-2">
                        <TextArea
                            label="Tujuan belajar"
                            value={form.learningGoals}
                            onChange={(value) => updateField("learningGoals", value)}
                            placeholder="Pisahkan dengan koma"
                        />
                    </div>
                </div>
            </SurfaceCard>

            <SurfaceCard title="Pekerjaan & Karier">
                <div className="grid gap-4 md:grid-cols-2">
                    <SelectInput label="Status saat ini" value={form.currentStatus} options={currentStatuses} onChange={(value) => updateField("currentStatus", value)} />
                    <TextInput label="Peran saat ini" value={form.currentRole} onChange={(value) => updateField("currentRole", value)} />
                    <TextInput label="Target karier" value={form.targetCareer} onChange={(value) => updateField("targetCareer", value)} />
                    <TextInput label="Gaya kerja yang disukai" value={form.preferredWorkStyle} onChange={(value) => updateField("preferredWorkStyle", value)} />
                    <div className="md:col-span-2">
                        <TextArea
                            label="Minat karier"
                            value={form.careerInterests}
                            onChange={(value) => updateField("careerInterests", value)}
                            placeholder="Pisahkan dengan koma"
                        />
                    </div>
                </div>
            </SurfaceCard>

            <SurfaceCard title="Minat & Hobi">
                <div className="grid gap-4 md:grid-cols-2">
                    <TextArea label="Hobi" value={form.hobbies} onChange={(value) => updateField("hobbies", value)} placeholder="Pisahkan dengan koma" />
                    <TextArea label="Minat" value={form.interests} onChange={(value) => updateField("interests", value)} placeholder="Pisahkan dengan koma" />
                    <TextArea label="Topik favorit" value={form.favoriteTopics} onChange={(value) => updateField("favoriteTopics", value)} placeholder="Pisahkan dengan koma" />
                    <TextArea label="Genre buku favorit" value={form.favoriteBookGenres} onChange={(value) => updateField("favoriteBookGenres", value)} placeholder="Pisahkan dengan koma" />
                    <TextArea label="Keterampilan yang ingin dikembangkan" value={form.skillsToImprove} onChange={(value) => updateField("skillsToImprove", value)} placeholder="Pisahkan dengan koma" />
                    <TextArea label="Topik yang tidak disukai" value={form.dislikedTopics} onChange={(value) => updateField("dislikedTopics", value)} placeholder="Opsional, pisahkan dengan koma" />
                </div>
            </SurfaceCard>

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={saveSettings}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Menyimpan pengaturan..." : "Simpan Pengaturan"}
                </button>
                <button
                    type="button"
                    onClick={resetChanges}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset Perubahan
                </button>
            </div>
        </div>
    );
}
