"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Activity, Brain, BriefcaseBusiness, CheckCircle2, Hexagon, Layers, Sparkles, User, Zap, Loader2 } from "lucide-react";
import { BigFive, UserProfile } from "@/types/personality";
import { ATTITUDINAL_PSYCHE_TYPES, ENNEAGRAM_TYPES, INSTINCTUAL_VARIANTS, MBTI_TYPES, SOCIONICS_TYPES, TEMPERAMENTS } from "@/data/frameworks";
import NarrativeInput from "@/components/NarrativeInput";
import { QualityWarningList } from "@/components/QualityWarnings";
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

            setMessage({ type: "success", text: "Profil berhasil disimpan." });
            
            // Re-fetch latest to sync with server
            fetchProfile();
            router.refresh();
        } catch (err: unknown) {
            console.error("Save profile failed:", err);
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-white/5 bg-black/40 min-h-[400px]">
                <Loader2 className="h-8 w-8 text-cyan-300 animate-spin" />
                <p className="mt-4 text-sm text-slate-400 font-mono">Memuat data profil...</p>
            </div>
        );
    }

    if (status !== "authenticated") {
        return (
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
                <div className="text-center py-12 px-4">
                    <p className="text-base text-slate-400">Silakan masuk log terlebih dahulu untuk membangun profil kepribadian.</p>
                    <div className="mt-6">
                        <Link href="/login" className="rounded-lg bg-cyan-300 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                            Masuk Sekarang
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[260px_1fr_320px]">
            <aside className="rounded-lg border border-white/10 bg-white/[0.045] p-3 xl:sticky xl:top-28 xl:self-start">
                {steps.map((step, index) => (
                    <button
                        key={step}
                        onClick={() => setActiveStep(step)}
                        className={clsx(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition",
                            activeStep === step ? "bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-xs">{index + 1}</span>
                        {step}
                    </button>
                ))}
            </aside>

            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 md:p-6">
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">Alur Modular</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{activeStep}</h2>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-400">Langkah {steps.indexOf(activeStep) + 1}/6</span>
                </div>

                <div className="space-y-6">
                    {activeStep === "Identitas" && (
                        <ProfileSection title="Identitas Dasar" icon={<User className="h-5 w-5 text-cyan-300" />}>
                            <Field label="Nama Subjek">
                                <input value={name} onChange={(event) => setName(event.target.value)} className="field" placeholder="Masukkan nama..." />
                            </Field>
                        </ProfileSection>
                    )}

                    {activeStep === "Narasi Diri" && <NarrativeInput onApplyProfile={(updates) => setProfile((prev) => ({ ...prev, ...updates }))} />}

                    {activeStep === "Tipologi" && (
                        <div className="space-y-5">
                            <QualityWarningList warnings={tipologiWarnings} />
                            <ProfileSection title="MBTI" icon={<Brain className="h-5 w-5 text-blue-300" />}>
                                <Field label="Tipe">
                                    <select value={profile.mbti} onChange={(event) => updateProfile("mbti", event.target.value)} className="field">
                                        {MBTI_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </select>
                                </Field>
                            </ProfileSection>
                            <ProfileSection title="Enneagram" icon={<Hexagon className="h-5 w-5 text-violet-300" />}>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Tipe Inti">
                                        <select
                                            value={profile.enneagram.type}
                                            onChange={(event) => updateProfile("enneagram", { ...profile.enneagram, type: event.target.value === "unknown" ? "unknown" : parseInt(event.target.value) })}
                                            className="field"
                                        >
                                            {ENNEAGRAM_TYPES.map((type) => <option key={type.id} value={type.id}>{type.id === "unknown" ? "Belum Tahu" : `Tipe ${type.id}`}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Wing">
                                        <select
                                            value={profile.enneagram.wing}
                                            onChange={(event) => updateProfile("enneagram", { ...profile.enneagram, wing: event.target.value === "unknown" ? "unknown" : parseInt(event.target.value) })}
                                            className="field"
                                        >
                                            <option value="unknown">Belum Tahu</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Tritype">
                                        <input value={profile.enneagram.tritype} onChange={(event) => updateProfile("enneagram", { ...profile.enneagram, tritype: event.target.value })} className="field" placeholder="contoh: 5-4-8" />
                                    </Field>
                                </div>
                            </ProfileSection>
                            <ProfileSection title="Socionics & Insting" icon={<Layers className="h-5 w-5 text-emerald-300" />}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Socionics">
                                        <select value={profile.socionics} onChange={(event) => updateProfile("socionics", event.target.value)} className="field">
                                            {SOCIONICS_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Insting">
                                        <select value={profile.instinctualVariant} onChange={(event) => updateProfile("instinctualVariant", event.target.value)} className="field">
                                            {INSTINCTUAL_VARIANTS.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                        </select>
                                    </Field>
                                </div>
                            </ProfileSection>
                        </div>
                    )}

                    {activeStep === "Sifat & Pola" && (
                        <div className="space-y-5">
                            <ProfileSection title="Temperamen" icon={<Sparkles className="h-5 w-5 text-pink-300" />}>
                                <Field label="Pola Utama">
                                    <select value={profile.temperament} onChange={(event) => updateProfile("temperament", event.target.value)} className="field">
                                        {TEMPERAMENTS.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </select>
                                </Field>
                            </ProfileSection>
                            <ProfileSection
                                title="Big Five"
                                icon={<Activity className="h-5 w-5 text-amber-300" />}
                                action={
                                    <button
                                        onClick={() => updateProfile("bigFive", profile.bigFive === "unknown" ? { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 } : "unknown")}
                                        className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                                    >
                                        {profile.bigFive === "unknown" ? "Aktifkan" : "Nonaktifkan"}
                                    </button>
                                }
                            >
                                {profile.bigFive === "unknown" ? (
                                    <p className="text-sm text-slate-500">Data Big Five belum disertakan dalam profil gabungan.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {Object.entries(profile.bigFive).map(([key, value]) => (
                                            <div key={key}>
                                                <div className="mb-2 flex justify-between text-sm">
                                                    <span className="capitalize text-slate-400">{translateBigFive(key)}</span>
                                                    <span className="text-cyan-300">{value}%</span>
                                                </div>
                                                <input type="range" min="0" max="100" value={value} onChange={(event) => updateBigFive(key as keyof BigFive, parseInt(event.target.value))} className="w-full accent-cyan-300" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ProfileSection>
                        </div>
                    )}

                    {activeStep === "Minat Karier" && (
                        <div className="space-y-5">
                            <QualityWarningList warnings={careerWarnings} />
                            <ProfileSection title="Minat Karier" icon={<BriefcaseBusiness className="h-5 w-5 text-cyan-300" />}>
                                <Field label="RIASEC">
                                    <input value={profile.riasec} onChange={(event) => updateProfile("riasec", event.target.value)} className="field" placeholder="contoh: R-I-A" />
                                </Field>
                            </ProfileSection>
                            <ProfileSection title="Attitudinal Psyche" icon={<Zap className="h-5 w-5 text-rose-300" />}>
                                <Field label="Tipe">
                                    <select value={profile.attitudinalPsyche} onChange={(event) => updateProfile("attitudinalPsyche", event.target.value)} className="field">
                                        {ATTITUDINAL_PSYCHE_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </select>
                                </Field>
                            </ProfileSection>
                        </div>
                    )}

                    {activeStep === "Tinjau Profil" && (
                        <ProfileSection title="Profil Gabungan" icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Summary label="Nama" value={name || "Belum Diisi"} />
                                <Summary label="MBTI" value={profile.mbti === "unknown" ? "Belum Tahu" : profile.mbti} />
                                <Summary label="Enneagram" value={profile.enneagram.type === "unknown" ? "Belum Tahu" : `Tipe ${profile.enneagram.type}`} />
                                <Summary label="Socionics" value={profile.socionics === "unknown" ? "Belum Tahu" : profile.socionics} />
                                <Summary label="Insting" value={profile.instinctualVariant === "unknown" ? "Belum Tahu" : profile.instinctualVariant} />
                                <Summary label="RIASEC" value={profile.riasec || "Belum Diisi"} />
                            </div>
                        </ProfileSection>
                    )}
                </div>

                {message && (
                    <div
                        className={clsx(
                            "mt-6 rounded-lg border p-4 text-sm transition-all",
                            message.type === "success"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-red-500/30 bg-red-500/10 text-red-300"
                        )}
                    >
                        {message.text}
                    </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                    <button
                        type="button"
                        onClick={() => {
                            const prevIndex = steps.indexOf(activeStep) - 1;
                            if (prevIndex >= 0) setActiveStep(steps[prevIndex]);
                        }}
                        disabled={steps.indexOf(activeStep) === 0}
                        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        Kembali
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200 transition disabled:opacity-50 disabled:hover:bg-cyan-300"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Profil"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const nextIndex = steps.indexOf(activeStep) + 1;
                                if (nextIndex < steps.length) setActiveStep(steps[nextIndex]);
                            }}
                            disabled={steps.indexOf(activeStep) === steps.length - 1}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            Lanjut
                        </button>
                    </div>
                </div>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
                <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
                    <p className="text-sm text-slate-400">Kelengkapan Profil</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{Math.round((completion / 6) * 100)}%</p>
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${(completion / 6) * 100}%` }} />
                    </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
                    <h3 className="font-semibold text-white">Wawasan Awal</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">Profil ini akan menjadi dasar untuk Analisis, Karier, Buku, dan Riwayat.</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
                    <h3 className="font-semibold text-white">Kualitas Data</h3>
                    <div className="mt-4">
                        <QualityWarningList warnings={profileWarnings} emptyMessage="Profil terlihat cukup konsisten." limit={4} />
                    </div>
                </div>
            </aside>
        </div>
    );
}

function ProfileSection({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-white/10 bg-black/25 p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {icon}
                    <h3 className="font-semibold text-white">{title}</h3>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</span>
            {children}
        </label>
    );
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 font-medium text-slate-100">{value}</p>
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
