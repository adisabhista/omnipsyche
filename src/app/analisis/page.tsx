"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import AnalysisResult from "@/components/AnalysisResult";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { createExcerpt, formatDateTime } from "@/lib/analysis-format";
import { personalityAnalysisSchema } from "@/lib/personality-json-schema";

interface StoredProfile {
    id: string;
    name: string;
    mbti: string;
    enneagramType: string;
    riasec: string;
}

interface StoredAnalysis {
    id: string;
    createdAt: string;
    markdown: string;
    model: string;
    parsedJson?: unknown;
}

function ConsistencyAudit({ analysis }: { analysis: StoredAnalysis }) {
    const parsed = personalityAnalysisSchema.safeParse(analysis.parsedJson);

    if (!parsed.success) {
        return (
            <SurfaceCard title="Audit Konsistensi">
                <p className="text-sm leading-6 text-slate-500">Audit konsistensi belum tersedia untuk analisis ini.</p>
            </SurfaceCard>
        );
    }

    const audit = parsed.data.consistency_audit;

    return (
        <SurfaceCard title="Audit Konsistensi">
            <StatusList
                items={[
                    { label: "Framework", value: audit.frameworks_used.join(", ") || "Belum Ada" },
                    { label: "Inferensi", value: audit.inferred_fields.join(", ") || "Tidak Ada" },
                    { label: "Peringatan", value: audit.warnings.length ? `${audit.warnings.length} Catatan` : "Tidak Ada" },
                ]}
            />
            {audit.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                    {audit.warnings.map((warning) => (
                        <p key={warning} className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-slate-300">
                            {warning}
                        </p>
                    ))}
                </div>
            )}
        </SurfaceCard>
    );
}

export default function AnalisisPage() {
    const { status } = useSession();
    const [profile, setProfile] = useState<StoredProfile | null>(null);
    const [latestAnalysis, setLatestAnalysis] = useState<StoredAnalysis | null>(null);
    const [completeness, setCompleteness] = useState(0);
    const [analysisCount, setAnalysisCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchData() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/dashboard");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Gagal memuat data analisis.");
            }

            setProfile(data.latestProfile);
            setLatestAnalysis(data.latestAnalysis);
            setCompleteness(data.profileCompleteness || 0);
            setAnalysisCount(data.analysisCount || 0);
        } catch (fetchError) {
            console.error("Failed to fetch analysis page data:", fetchError);
            setError("Gagal memuat data analisis.");
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

    async function handleStartAnalysis() {
        if (!profile?.id) return;

        try {
            setAnalyzing(true);
            setError(null);

            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileId: profile.id }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Analisis gagal dibuat.");
            }

            setLatestAnalysis({
                id: data.analysisId,
                markdown: data.markdown,
                model: data.model,
                createdAt: data.createdAt,
                parsedJson: data.profileJson,
            });
            setAnalysisCount((count) => count + 1);
            await fetchData();
        } catch (analysisError) {
            console.error("Analysis generation failed:", analysisError);
            setError(analysisError instanceof Error ? analysisError.message : "Analisis gagal dibuat.");
        } finally {
            setAnalyzing(false);
        }
    }

    if (loading || status === "loading") {
        return (
            <SurfaceCard title="Analisis">
                <div className="flex min-h-72 flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                    <p className="mt-4 text-sm text-slate-400">Memuat data analisis...</p>
                </div>
            </SurfaceCard>
        );
    }

    if (status !== "authenticated") {
        return (
            <SurfaceCard title="Analisis">
                <div className="py-10 text-center">
                    <p className="text-sm text-slate-400">Masuk terlebih dahulu untuk membuat dan menyimpan analisis.</p>
                    <div className="mt-5 flex justify-center gap-3">
                        <Link href="/login" className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                            Masuk
                        </Link>
                        <Link href="/register" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                            Daftar
                        </Link>
                    </div>
                </div>
            </SurfaceCard>
        );
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                {error && (
                    <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
                        {error}
                    </div>
                )}

                {!profile ? (
                    <SurfaceCard title="Profil Belum Tersedia">
                        <div className="py-10 text-center">
                            <p className="text-sm text-slate-400">Bangun profil terlebih dahulu sebelum membuat analisis.</p>
                            <Link href="/bangun-profil" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                                Bangun Profil
                            </Link>
                        </div>
                    </SurfaceCard>
                ) : analyzing ? (
                    <AnalysisResult markdown="" isLoading={true} />
                ) : latestAnalysis ? (
                    <div className="space-y-4">
                        <SurfaceCard title="Analisis Terbaru" eyebrow="Sumber Wawasan">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm text-slate-400">{formatDateTime(latestAnalysis.createdAt)}</p>
                                    <p className="mt-2 text-sm text-slate-500">Model: {latestAnalysis.model}</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Link href={`/riwayat/${latestAnalysis.id}`} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                                        Lihat Detail
                                    </Link>
                                    <button
                                        onClick={handleStartAnalysis}
                                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Buat Analisis
                                    </button>
                                </div>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-400">{createExcerpt(latestAnalysis.markdown, 260)}</p>
                        </SurfaceCard>
                        <ConsistencyAudit analysis={latestAnalysis} />
                        <AnalysisResult markdown={latestAnalysis.markdown} isLoading={false} />
                    </div>
                ) : (
                    <SurfaceCard title="Belum Ada Analisis">
                        <div className="py-12 text-center">
                            <Sparkles className="mx-auto h-8 w-8 text-cyan-300" />
                            <h2 className="mt-4 text-lg font-semibold text-slate-100">Belum ada analisis tersimpan.</h2>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                                Buat analisis pertama dari profil aktif agar modul Karier, Buku, dan Riwayat memiliki sumber wawasan.
                            </p>
                            <button
                                onClick={handleStartAnalysis}
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
                            >
                                <Brain className="h-4 w-4" />
                                Buat Analisis
                            </button>
                        </div>
                    </SurfaceCard>
                )}
            </div>

            <RightRail>
                <SurfaceCard title="Kesiapan Analisis">
                    <StatusList
                        items={[
                            { label: "Profil Gabungan", value: `${completeness}%` },
                            { label: "Analisis Tersimpan", value: String(analysisCount) },
                            { label: "Profil Aktif", value: profile?.name || "Belum Dibuat" },
                        ]}
                    />
                </SurfaceCard>
                <SurfaceCard title="Koneksi Modul">
                    <p className="text-sm leading-6 text-slate-500">
                        Hasil analisis tersimpan menjadi sumber utama untuk Riwayat, Karier, dan Buku.
                    </p>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}
