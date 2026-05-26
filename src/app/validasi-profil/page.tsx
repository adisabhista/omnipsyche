"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertTriangle, CheckCircle2, HelpCircle, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MetricCard, RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { EvidenceSourceCard } from "@/components/profile/EvidenceSourceCard";
import type { ProfileValidationResult } from "@/lib/profile-validation-schema";

type StoredValidation = {
    id: string;
    profileId: string | null;
    analysisId: string | null;
    result: ProfileValidationResult;
    score: number | null;
    risk: string | null;
    confidence: string | null;
    createdAt: string;
};

const riskLabels: Record<string, string> = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
};

const confidenceLabels = riskLabels;

const supportLabels: Record<string, string> = {
    strong: "Kuat",
    moderate: "Cukup",
    weak: "Lemah",
    insufficient_data: "Data belum cukup",
};

const sourceLabels: Record<string, string> = {
    profile: "Profil",
    analysis: "Analisis",
    settings: "Pengaturan",
    book_collection: "Koleksi buku",
    book_status: "Status buku",
    career_interest: "Minat karier",
    narrative: "Narasi",
    book_recommendation: "Rekomendasi buku",
};

const weightLabels: Record<string, string> = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
};

function formatBoolean(value: boolean) {
    return value ? "Tersedia" : "Belum tersedia";
}

function safeList(values: string[]) {
    return values.length ? values.join(", ") : "Tidak ada";
}

function toneClass(value: string | null | undefined) {
    if (value === "high") return "border-amber-300/30 bg-amber-300/10 text-amber-200";
    if (value === "medium") return "border-cyan-300/30 bg-cyan-300/10 text-cyan-200";
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";
}

export default function ValidasiProfilPage() {
    const { status } = useSession();
    const [validation, setValidation] = useState<StoredValidation | null>(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchData() {
        try {
            setLoading(true);
            setError(null);

            const [validationResponse, profileResponse] = await Promise.all([
                fetch("/api/profile-validation/latest"),
                fetch("/api/profiles/current"),
            ]);
            const validationData = await validationResponse.json();
            const profileData = await profileResponse.json();

            if (!validationResponse.ok) {
                throw new Error(validationData?.error || "Gagal memuat konsistensi profil.");
            }
            if (!profileResponse.ok) {
                throw new Error(profileData?.error || "Gagal memuat profil aktif.");
            }

            setValidation(validationData.validation ?? null);
            setHasProfile(!!profileData && !profileData.error);
        } catch (fetchError) {
            console.error("Profile validation page load failed:", fetchError);
            setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat konsistensi profil.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (status === "authenticated") {
            fetchData();
            return;
        }

        if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status]);

    async function handleGenerate() {
        try {
            setGenerating(true);
            setError(null);

            const response = await fetch("/api/profile-validation/generate", { method: "POST" });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Gagal memeriksa konsistensi profil.");
            }

            setValidation(data.validation);
            setHasProfile(true);
            toast.success("Konsistensi profil berhasil diperiksa!");
        } catch (generateError) {
            const message = generateError instanceof Error ? generateError.message : "Gagal memeriksa konsistensi profil.";
            setError(message);
            toast.error("Gagal memeriksa konsistensi.");
            if (message.includes("Bangun profil")) setHasProfile(false);
        } finally {
            setGenerating(false);
        }
    }

    if (loading || status === "loading") {
        return (
            <SurfaceCard title="Konsistensi Profil">
                <div className="flex min-h-72 flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                    <p className="mt-4 text-sm text-slate-400">Memuat data konsistensi profil...</p>
                </div>
            </SurfaceCard>
        );
    }

    if (status !== "authenticated") {
        return (
            <SurfaceCard title="Konsistensi Profil">
                <div className="py-10 text-center">
                    <p className="text-sm text-slate-400">Masuk terlebih dahulu untuk memeriksa konsistensi profil.</p>
                    <Link href="/login" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                        Masuk
                    </Link>
                </div>
            </SurfaceCard>
        );
    }

    const result = validation?.result ?? null;

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                {error && (
                    <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <SurfaceCard title="Konsistensi Profil" eyebrow="Pemeriksaan indikatif">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-cyan-300" />
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Pemeriksaan konsistensi profil</p>
                            </div>
                            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-500">
                                Periksa seberapa selaras data profil, hasil tes, analisis, minat, dan koleksi kamu. Hasil ini bersifat indikatif, bukan kepastian mutlak.
                            </p>
                            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-500">
                                Hasil ini bukan penentu tipe yang benar atau salah. Gunakan sebagai bahan refleksi.
                            </p>
                        </div>
                        <div title={!hasProfile ? "Lengkapi profil terlebih dahulu di halaman Bangun Profil" : undefined}>
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !hasProfile}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                {generating ? "Memeriksa konsistensi profil..." : "Cek Konsistensi Profil"}
                            </button>
                        </div>
                    </div>
                </SurfaceCard>

                {!hasProfile ? (
                    <SurfaceCard title="Profil Belum Tersedia">
                        <div className="py-10 text-center">
                            <p className="text-sm text-slate-400">Bangun profil terlebih dahulu sebelum memeriksa konsistensi.</p>
                            <Link href="/bangun-profil" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                                Bangun Profil
                            </Link>
                        </div>
                    </SurfaceCard>
                ) : !result ? (
                    <SurfaceCard title="Belum Ada Pemeriksaan">
                        <div className="py-10 text-center">
                            <HelpCircle className="mx-auto h-8 w-8 text-cyan-300" />
                            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400">
                                Belum ada pemeriksaan konsistensi profil. Klik Cek Konsistensi Profil untuk memulai.
                            </p>
                        </div>
                    </SurfaceCard>
                ) : (
                    <>
                        {result.confidence === "low" && (
                            <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                                Data pendukung masih terbatas. Hasil pemeriksaan mungkin belum kuat.
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-3">
                            <MetricCard label="Skor Konsistensi Profil" value={`${Math.round(result.profile_consistency_score)}/100`} detail={result.summary} />
                            <MetricCard label="Risiko Mistype" value={riskLabels[result.mistype_risk]} detail="Indikasi potensi yang perlu ditinjau." />
                            <MetricCard label="Tingkat Keyakinan" value={confidenceLabels[result.confidence]} detail="Kekuatan data pendukung saat ini." />
                        </div>

                        <EvidenceSourceCard result={result} />

                        <SurfaceCard title="Kualitas Data">
                            <StatusList
                                items={[
                                    { label: "Profil tersedia", value: formatBoolean(result.data_quality.profile_available) },
                                    { label: "Analisis tersedia", value: formatBoolean(result.data_quality.analysis_available) },
                                    { label: "Pengaturan tersedia", value: formatBoolean(result.data_quality.settings_available) },
                                    { label: "Jumlah buku koleksi", value: String(result.data_quality.book_collection_count) },
                                    { label: "Buku selesai", value: String(result.data_quality.finished_books_count) },
                                    { label: "Buku belum selesai", value: String(result.data_quality.unfinished_books_count) },
                                    { label: "Data karier tersedia", value: formatBoolean(result.data_quality.career_data_available) },
                                    { label: "Data naratif tersedia", value: formatBoolean(result.data_quality.narrative_data_available) },
                                ]}
                            />
                            {result.data_quality.limitations.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {result.data_quality.limitations.map((limitation) => (
                                        <p key={limitation} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-slate-400">
                                            {limitation}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </SurfaceCard>

                        {result.framework_assessment.length > 0 && (
                            <SurfaceCard title="Penilaian per Kerangka">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {result.framework_assessment.map((assessment) => (
                                        <article key={assessment.framework} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{assessment.framework}</h3>
                                                    <p className="mt-1 text-sm text-slate-500">{assessment.current_type ?? "Data belum cukup"}</p>
                                                </div>
                                                <span className="rounded-full border border-cyan-300/25 px-2 py-1 text-[11px] uppercase text-cyan-300">
                                                    {supportLabels[assessment.support_level]}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{assessment.consistency_notes}</p>
                                            {assessment.possible_alternatives.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    {assessment.possible_alternatives.map((alternative) => (
                                                        <p key={`${assessment.framework}-${alternative.type}`} className="text-sm leading-6 text-slate-500">
                                                            Kemungkinan {alternative.type}: {alternative.reason} ({confidenceLabels[alternative.confidence]})
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </SurfaceCard>
                        )}

                        <SurfaceCard title="Bukti Pendukung">
                            <div className="space-y-3">
                                {result.evidence.map((item, index) => (
                                    <article key={`${item.source}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{sourceLabels[item.source] ?? item.source}</span>
                                            <span className={`rounded-full border px-2 py-1 text-[11px] uppercase ${toneClass(item.weight)}`}>
                                                Bobot {weightLabels[item.weight]}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.observation}</p>
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <p className="text-sm leading-6 text-slate-500">Mendukung: {safeList(item.supports)}</p>
                                            <p className="text-sm leading-6 text-slate-500">Kurang selaras: {safeList(item.potential_conflicts)}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </SurfaceCard>

                        {result.mistype_indicators.length > 0 && (
                            <SurfaceCard title="Indikator yang Perlu Ditinjau">
                                <div className="space-y-3">
                                    {result.mistype_indicators.map((indicator) => (
                                        <article key={`${indicator.area}-${indicator.indicator}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{indicator.area}</h3>
                                                <span className={`rounded-full border px-2 py-1 text-[11px] uppercase ${toneClass(indicator.severity)}`}>
                                                    {riskLabels[indicator.severity]}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{indicator.indicator}</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">{indicator.why_it_matters}</p>
                                        </article>
                                    ))}
                                </div>
                            </SurfaceCard>
                        )}

                        <SurfaceCard title="Pertanyaan Refleksi">
                            <div className="grid gap-3 md:grid-cols-2">
                                {result.validation_questions.map((question) => (
                                    <article key={question.question} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                                        <p className="text-sm font-semibold leading-6 text-slate-800 dark:text-slate-200">{question.question}</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">{question.purpose}</p>
                                        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-cyan-300">{question.related_framework}</p>
                                    </article>
                                ))}
                            </div>
                        </SurfaceCard>

                        <SurfaceCard title="Rekomendasi Tindak Lanjut">
                            <div className="space-y-3">
                                {result.recommendations.map((recommendation) => (
                                    <div key={recommendation.action} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{recommendation.action}</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">{recommendation.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </SurfaceCard>

                        {result.warnings.length > 0 && (
                            <SurfaceCard title="Peringatan">
                                <div className="space-y-2">
                                    {result.warnings.map((warning) => (
                                        <p key={warning} className="flex gap-3 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                                            {warning}
                                        </p>
                                    ))}
                                </div>
                            </SurfaceCard>
                        )}
                    </>
                )}
            </div>

            <RightRail>
                <SurfaceCard title="Status Konsistensi">
                    {validation ? (
                        <StatusList
                            items={[
                                { label: "Skor", value: `${validation.score ?? result?.profile_consistency_score ?? 0}/100` },
                                { label: "Risiko", value: riskLabels[validation.risk ?? result?.mistype_risk ?? ""] ?? "Belum Ada" },
                                { label: "Keyakinan", value: confidenceLabels[validation.confidence ?? result?.confidence ?? ""] ?? "Belum Ada" },
                            ]}
                        />
                    ) : (
                        <p className="text-sm leading-6 text-slate-500">Belum ada pemeriksaan konsistensi profil.</p>
                    )}
                </SurfaceCard>
                <SurfaceCard title="Catatan">
                    <div className="flex gap-3 text-sm leading-6 text-slate-500">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-cyan-300" />
                        Pemeriksaan dibuat hanya saat tombol cek konsistensi ditekan.
                    </div>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}
