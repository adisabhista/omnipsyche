"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { toast } from "sonner";
import {
    Activity,
    Brain,
    BriefcaseBusiness,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Hexagon,
    Layers,
    Loader2,
    Save,
    Sparkles,
    User,
    Zap,
} from "lucide-react";
import { BigFive, UserProfile } from "@/types/personality";
import { ATTITUDINAL_PSYCHE_TYPES, ENNEAGRAM_TYPES, INSTINCTUAL_VARIANTS, MBTI_TYPES, SOCIONICS_TYPES, TEMPERAMENTS } from "@/data/frameworks";
import NarrativeInput from "@/components/NarrativeInput";
import { QualityWarningList } from "@/components/QualityWarnings";
import { ActionButton, DarkInput, DarkSelect, FieldGroup, FormField, InfoPill, ProfileFormSection } from "@/components/ProfileFormPrimitives";
import { SurfaceCard } from "@/components/PlatformCards";
import { getProfileWarnings } from "@/lib/profile-consistency";

const steps = ["Identitas", "Narasi Diri", "Tipologi", "Sifat & Pola", "Minat Karier", "Tinjau Profil"];

export default function ProfileBuilder() {
    const { status } = useSession();
    const router = useRouter();
    const [activeStep, setActiveStep] = useState("Identitas");
    const [name, setName] = useState("");
    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        mbti: "unknown",
        enneagram: { type: "unknown", wing: "unknown", tritype: "" },
        attitudinalPsyche: "unknown",
        instinctualVariant: "unknown",
        socionics: "unknown",
        temperament: "unknown",
        riasec: "",
        bigFive: "unknown",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/profiles/current");
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setName(data.profile.name || "");
                    setProfile({
                        name: data.profile.name || "",
                        mbti: data.profile.mbti || "unknown",
                        enneagram: {
                            type: data.profile.enneagram?.type ?? "unknown",
                            wing: data.profile.enneagram?.wing ?? "unknown",
                            tritype: data.profile.enneagram?.tritype ?? "",
                        },
                        attitudinalPsyche: data.profile.attitudinalPsyche || "unknown",
                        instinctualVariant: data.profile.instinctualVariant || "unknown",
                        socionics: data.profile.socionics || "unknown",
                        temperament: data.profile.temperament || "unknown",
                        riasec: data.profile.riasec || "",
                        bigFive: data.profile.bigFive || "unknown",
                    });
                }
            } else {
                console.error("Failed to fetch profile");
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchProfile();
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status]);

    const updateProfile = (key: keyof UserProfile, value: UserProfile[keyof UserProfile]) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    };

    const updateBigFive = (key: keyof BigFive, value: number) => {
        setProfile((prev) => {
            if (prev.bigFive === "unknown") return prev;
            return { ...prev, bigFive: { ...prev.bigFive, [key]: value } };
        });
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setMessage({ type: "error", text: "Nama wajib diisi." });
            return;
        }

        try {
            setSaving(true);
            setMessage(null);

            const payload = {
                ...profile,
                name: name.trim(),
            };

            const res = await fetch("/api/profiles/current", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Profil gagal disimpan.");
            }

            toast.success("Profil berhasil diperbarui!");
            setMessage({ type: "success", text: "Profil berhasil disimpan." });
            fetchProfile();
            router.refresh();
        } catch (err: unknown) {
            console.error("Save profile failed:", err);
            toast.error("Gagal memperbarui profil. Silakan coba lagi.");
            if (err instanceof Error) {
                setMessage({ type: "error", text: err.message });
            } else {
                setMessage({ type: "error", text: "Profil gagal disimpan." });
            }
        } finally {
            setSaving(false);
        }
    };

    const completion = [
        name,
        profile.mbti !== "unknown",
        profile.enneagram.type !== "unknown",
        profile.socionics !== "unknown",
        profile.bigFive !== "unknown",
        profile.riasec,
    ].filter(Boolean).length;
    const currentStepIndex = steps.indexOf(activeStep);
    const profileWarnings = useMemo(
        () => getProfileWarnings({ ...profile, name }).filter((warning) => warning.actionHref === "/bangun-profil" || warning.id === "profile-socionics-mbti-independent" || warning.id === "profile-ap-independent"),
        [name, profile]
    );
    const tipologiWarnings = profileWarnings.filter((warning) => [
        "profile-enneagram-wing-missing",
        "profile-tritype-without-enneagram",
        "profile-instinct-without-enneagram",
        "profile-socionics-mbti-independent",
    ].includes(warning.id));
    const careerWarnings = profileWarnings.filter((warning) => [
        "profile-riasec-missing",
        "profile-ap-independent",
    ].includes(warning.id));

    const stepCompletion: Record<string, boolean> = {
        Identitas: Boolean(name.trim()),
        "Narasi Diri": false,
        Tipologi: profile.mbti !== "unknown" || profile.enneagram.type !== "unknown" || profile.socionics !== "unknown" || profile.instinctualVariant !== "unknown",
        "Sifat & Pola": profile.temperament !== "unknown" || profile.bigFive !== "unknown",
        "Minat Karier": Boolean(profile.riasec.trim()) || profile.attitudinalPsyche !== "unknown",
        "Tinjau Profil": completion >= 4,
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white/80 p-12 dark:border-white/10 dark:bg-black/35">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500 dark:text-cyan-300" />
                <p className="mt-4 text-sm text-slate-500">Memuat data profil...</p>
            </div>
        );
    }

    if (status !== "authenticated") {
        return (
            <SurfaceCard title="Bangun Profil" eyebrow="Akses Profil">
                <div className="py-10 text-center">
                    <p className="text-base text-slate-500">Silakan masuk log terlebih dahulu untuk membangun profil kepribadian.</p>
                    <div className="mt-6">
                        <Link href="/login" className="inline-flex rounded-lg bg-cyan-300 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
                            Masuk Sekarang
                        </Link>
                    </div>
                </div>
            </SurfaceCard>
        );
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[260px_1fr_320px]">
            <aside className="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)] xl:sticky xl:top-28 xl:self-start">
                <p className="px-2 pb-3 pt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Tahapan Profil</p>
                <div className="space-y-1">
                    {steps.map((step, index) => {
                        const active = activeStep === step;
                        const complete = stepCompletion[step];
                        return (
                            <button
                                key={step}
                                onClick={() => setActiveStep(step)}
                                className={clsx(
                                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition",
                                    active
                                        ? "bg-cyan-100 text-cyan-950 ring-1 ring-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-300/20"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
                                )}
                            >
                                <span
                                    className={clsx(
                                        "grid h-7 w-7 shrink-0 place-items-center rounded-md border text-xs",
                                        active
                                            ? "border-cyan-400/35 bg-cyan-300/15 text-cyan-700 dark:text-cyan-200"
                                            : complete
                                                ? "border-emerald-400/25 bg-emerald-300/10 text-emerald-600 dark:text-emerald-300"
                                                : "border-slate-200 text-slate-500 dark:border-white/10"
                                    )}
                                >
                                    {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                                </span>
                                <span className="min-w-0 flex-1">{step}</span>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)] md:p-6">
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300/80">Alur Modular</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{activeStep}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{getStepDescription(activeStep)}</p>
                    </div>
                    <span className="w-fit rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">Langkah {currentStepIndex + 1}/6</span>
                </div>

                <div className="space-y-5">
                    {activeStep === "Identitas" && (
                        <ProfileFormSection
                            eyebrow="Identitas Dasar"
                            title="Nama Profil"
                            description="Gunakan nama yang mudah dikenali di seluruh modul Analisis, Karier, Buku, dan Riwayat."
                            icon={<User className="h-4 w-4" />}
                        >
                            <FieldGroup>
                                <FormField label="Nama Subjek" hint="Nama ini menjadi label profil aktif dan tidak mengubah data autentikasi.">
                                    <DarkInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Masukkan nama..." />
                                </FormField>
                            </FieldGroup>
                        </ProfileFormSection>
                    )}

                    {activeStep === "Narasi Diri" && <NarrativeInput onApplyProfile={(updates) => setProfile((prev) => ({ ...prev, ...updates }))} />}

                    {activeStep === "Tipologi" && (
                        <div className="space-y-5">
                            {tipologiWarnings.length > 0 && (
                                <ProfileFormSection eyebrow="Kualitas Data" title="Catatan Konsistensi" icon={<CheckCircle2 className="h-4 w-4" />}>
                                    <QualityWarningList warnings={tipologiWarnings} />
                                </ProfileFormSection>
                            )}

                            <ProfileFormSection
                                eyebrow="Tipologi Utama"
                                title="MBTI"
                                description="Pilih tipe MBTI sebagai salah satu lapisan kognitif profil. Socionics tetap dibaca sebagai kerangka terpisah."
                                icon={<Brain className="h-4 w-4" />}
                                action={<InfoPill>Fungsi Kognitif</InfoPill>}
                            >
                                <FormField label="Tipe MBTI" hint="Pilih Belum Tahu jika belum memiliki hasil yang cukup stabil.">
                                    <DarkSelect value={profile.mbti} onChange={(event) => updateProfile("mbti", event.target.value as UserProfile["mbti"])}>
                                        {MBTI_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </DarkSelect>
                                </FormField>
                            </ProfileFormSection>

                            <ProfileFormSection
                                eyebrow="Pola Motivasi"
                                title="Enneagram"
                                description="Tipe inti, wing, dan tritype membantu membaca dorongan, strategi pertahanan, dan pola reaksi."
                                icon={<Hexagon className="h-4 w-4" />}
                            >
                                <FieldGroup columns={3}>
                                    <FormField label="Tipe Inti">
                                        <DarkSelect
                                            value={profile.enneagram.type}
                                            onChange={(event) => updateProfile("enneagram", { ...profile.enneagram, type: event.target.value === "unknown" ? "unknown" : parseInt(event.target.value) })}
                                        >
                                            {ENNEAGRAM_TYPES.map((type) => <option key={type.id} value={type.id}>{type.id === "unknown" ? "Belum Tahu" : `Tipe ${type.id}`}</option>)}
                                        </DarkSelect>
                                    </FormField>
                                    <FormField label="Wing">
                                        <DarkSelect
                                            value={profile.enneagram.wing}
                                            onChange={(event) => updateProfile("enneagram", { ...profile.enneagram, wing: event.target.value === "unknown" ? "unknown" : parseInt(event.target.value) })}
                                        >
                                            <option value="unknown">Belum Tahu</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
                                        </DarkSelect>
                                    </FormField>
                                    <FormField label="Tritype" hint="Gunakan format ringkas jika ada, misalnya 5-4-8.">
                                        <DarkInput value={profile.enneagram.tritype} onChange={(event) => updateProfile("enneagram", { ...profile.enneagram, tritype: event.target.value })} placeholder="contoh: 5-4-8" />
                                    </FormField>
                                </FieldGroup>
                            </ProfileFormSection>

                            <ProfileFormSection
                                eyebrow="Kerangka Independen"
                                title="Socionics & Dorongan Instingtual"
                                description="Socionics dan MBTI dianalisis terpisah; kemiripan kode tidak dianggap setara otomatis."
                                icon={<Layers className="h-4 w-4" />}
                                action={<InfoPill tone="slate">Catatan Terintegrasi</InfoPill>}
                            >
                                <FieldGroup columns={2}>
                                    <FormField label="Socionics">
                                        <DarkSelect value={profile.socionics} onChange={(event) => updateProfile("socionics", event.target.value as UserProfile["socionics"])}>
                                            {SOCIONICS_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                        </DarkSelect>
                                    </FormField>
                                    <FormField label="Instinctual Variant">
                                        <DarkSelect value={profile.instinctualVariant} onChange={(event) => updateProfile("instinctualVariant", event.target.value as UserProfile["instinctualVariant"])}>
                                            {INSTINCTUAL_VARIANTS.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                        </DarkSelect>
                                    </FormField>
                                </FieldGroup>
                            </ProfileFormSection>
                        </div>
                    )}

                    {activeStep === "Sifat & Pola" && (
                        <div className="space-y-5">
                            <ProfileFormSection
                                eyebrow="Sifat dan Pola"
                                title="Temperamen"
                                description="Tambahkan lapisan temperamen untuk membaca ritme energi, reaksi, dan gaya adaptasi."
                                icon={<Sparkles className="h-4 w-4" />}
                            >
                                <FormField label="Pola Utama">
                                    <DarkSelect value={profile.temperament} onChange={(event) => updateProfile("temperament", event.target.value as UserProfile["temperament"])}>
                                        {TEMPERAMENTS.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </DarkSelect>
                                </FormField>
                            </ProfileFormSection>

                            <ProfileFormSection
                                eyebrow="Dimensi Perilaku"
                                title="Big Five"
                                description="Gunakan skala ini jika profil memiliki estimasi dimensi perilaku yang cukup jelas."
                                icon={<Activity className="h-4 w-4" />}
                                action={
                                    <ActionButton
                                        onClick={() => updateProfile("bigFive", profile.bigFive === "unknown" ? { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 } : "unknown")}
                                        variant="secondary"
                                    >
                                        {profile.bigFive === "unknown" ? "Aktifkan" : "Nonaktifkan"}
                                    </ActionButton>
                                }
                            >
                                {profile.bigFive === "unknown" ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-white/[0.035]">
                                        Data Big Five belum disertakan dalam profil gabungan.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {Object.entries(profile.bigFive).map(([key, value]) => (
                                            <div key={key} className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                                                <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{translateBigFive(key)}</span>
                                                    <span className="rounded-full border border-cyan-400/25 bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-200">{value}%</span>
                                                </div>
                                                <input type="range" min="0" max="100" value={value} onChange={(event) => updateBigFive(key as keyof BigFive, parseInt(event.target.value))} className="h-2 w-full cursor-pointer accent-cyan-300" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ProfileFormSection>
                        </div>
                    )}

                    {activeStep === "Minat Karier" && (
                        <div className="space-y-5">
                            {careerWarnings.length > 0 && (
                                <ProfileFormSection eyebrow="Kualitas Data" title="Catatan Karier" icon={<CheckCircle2 className="h-4 w-4" />}>
                                    <QualityWarningList warnings={careerWarnings} />
                                </ProfileFormSection>
                            )}

                            <ProfileFormSection
                                eyebrow="Minat Karier"
                                title="Bidang Minat"
                                description="RIASEC membantu modul Karier membaca arah bidang, lingkungan kerja, dan tema eksplorasi."
                                icon={<BriefcaseBusiness className="h-4 w-4" />}
                                action={<InfoPill>RIASEC</InfoPill>}
                            >
                                <FormField label="Kode RIASEC" hint="Isi kode ringkas sesuai hasil asesmen, misalnya R-I-A atau I-A-S.">
                                    <DarkInput value={profile.riasec} onChange={(event) => updateProfile("riasec", event.target.value)} placeholder="contoh: R-I-A" />
                                </FormField>
                            </ProfileFormSection>

                            <ProfileFormSection
                                eyebrow="Gaya Kerja"
                                title="Attitudinal Psyche"
                                description="AP membantu membaca gaya volisi, logika, emosi, dan fisik dalam konteks kerja."
                                icon={<Zap className="h-4 w-4" />}
                                action={<InfoPill tone="slate">AP</InfoPill>}
                            >
                                <FormField label="Tipe AP" hint="Jika belum yakin, gunakan Belum Tahu agar analisis tidak mengunci inferensi.">
                                    <DarkSelect value={profile.attitudinalPsyche} onChange={(event) => updateProfile("attitudinalPsyche", event.target.value as UserProfile["attitudinalPsyche"])}>
                                        {ATTITUDINAL_PSYCHE_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </DarkSelect>
                                </FormField>
                            </ProfileFormSection>
                        </div>
                    )}

                    {activeStep === "Tinjau Profil" && (
                        <ProfileFormSection eyebrow="Tinjau Profil" title="Profil Gabungan" icon={<CheckCircle2 className="h-4 w-4" />}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Summary label="Nama" value={name || "Belum Diisi"} />
                                <Summary label="MBTI" value={profile.mbti === "unknown" ? "Belum Tahu" : profile.mbti} />
                                <Summary label="Enneagram" value={profile.enneagram.type === "unknown" ? "Belum Tahu" : `Tipe ${profile.enneagram.type}`} />
                                <Summary label="Socionics" value={profile.socionics === "unknown" ? "Belum Tahu" : profile.socionics} />
                                <Summary label="Insting" value={profile.instinctualVariant === "unknown" ? "Belum Tahu" : profile.instinctualVariant} />
                                <Summary label="RIASEC" value={profile.riasec || "Belum Diisi"} />
                            </div>
                        </ProfileFormSection>
                    )}
                </div>

                {message && (
                    <div
                        className={clsx(
                            "mt-6 rounded-lg border p-4 text-sm transition-all",
                            message.type === "success"
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200"
                                : "border-red-400/30 bg-red-400/10 text-red-700 dark:text-red-200"
                        )}
                    >
                        {message.text}
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <ActionButton
                        type="button"
                        onClick={() => {
                            const prevIndex = currentStepIndex - 1;
                            if (prevIndex >= 0) setActiveStep(steps[prevIndex]);
                        }}
                        disabled={currentStepIndex === 0}
                        variant="secondary"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Kembali
                    </ActionButton>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <ActionButton type="button" onClick={handleSave} disabled={saving} variant="primary">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Menyimpan..." : "Simpan Profil"}
                        </ActionButton>

                        <ActionButton
                            type="button"
                            onClick={() => {
                                const nextIndex = currentStepIndex + 1;
                                if (nextIndex < steps.length) setActiveStep(steps[nextIndex]);
                            }}
                            disabled={currentStepIndex === steps.length - 1}
                            variant="secondary"
                        >
                            Lanjut
                            <ChevronRight className="h-4 w-4" />
                        </ActionButton>
                    </div>
                </div>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
                <SurfaceCard title="Kelengkapan Profil">
                    <p className="text-3xl font-semibold text-slate-950 dark:text-white">{Math.round((completion / 6) * 100)}%</p>
                    <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                        <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${(completion / 6) * 100}%` }} />
                    </div>
                </SurfaceCard>
                <SurfaceCard title="Wawasan Awal">
                    <p className="text-sm leading-6 text-slate-500">Profil ini akan menjadi dasar untuk Analisis, Karier, Buku, dan Riwayat.</p>
                </SurfaceCard>
                <SurfaceCard title="Kualitas Data">
                    <QualityWarningList warnings={profileWarnings} emptyMessage="Profil terlihat cukup konsisten." limit={4} />
                </SurfaceCard>
            </aside>
        </div>
    );
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">{value}</p>
        </div>
    );
}

function translateBigFive(key: string) {
    const labels: Record<string, string> = {
        openness: "Keterbukaan",
        conscientiousness: "Kedisiplinan",
        extraversion: "Ekstraversi",
        agreeableness: "Keramahan",
        neuroticism: "Neurotisisme",
    };
    return labels[key] ?? key;
}

function getStepDescription(step: string) {
    const descriptions: Record<string, string> = {
        Identitas: "Mulai dari label profil yang akan dipakai lintas modul.",
        "Narasi Diri": "Tambahkan konteks reflektif untuk membantu pembacaan pola bahasa dan preferensi.",
        Tipologi: "Susun kerangka tipologi utama tanpa mencampur sistem yang memang berbeda.",
        "Sifat & Pola": "Lengkapi pola temperamen dan dimensi perilaku yang bisa dipakai sebagai konteks tambahan.",
        "Minat Karier": "Hubungkan profil dengan sinyal minat, gaya kerja, dan arah eksplorasi karier.",
        "Tinjau Profil": "Periksa kembali profil gabungan sebelum disimpan atau dipakai untuk analisis.",
    };
    return descriptions[step] ?? "Lengkapi data profil secara bertahap.";
}
