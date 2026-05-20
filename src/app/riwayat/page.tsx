import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { getUserAnalyses } from "@/lib/analysis-data";
import { createExcerpt, formatDateTime } from "@/lib/analysis-format";
import { auth } from "@/lib/auth";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";

export default async function RiwayatPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return (
            <SurfaceCard title="Riwayat">
                <div className="py-10 text-center">
                    <p className="text-sm text-slate-400">Masuk terlebih dahulu untuk melihat riwayat analisis.</p>
                    <Link href="/login" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                        Masuk
                    </Link>
                </div>
            </SurfaceCard>
        );
    }

    const analyses = await getUserAnalyses(userId);

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <SurfaceCard title="Riwayat Analisis" eyebrow="Memori Platform">
                    {analyses.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm text-slate-400">Belum ada riwayat analisis.</p>
                            <Link href="/analisis" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                                Buat Analisis
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {analyses.map((analysis) => (
                                <article key={analysis.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex min-w-0 gap-4">
                                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300">
                                                <BarChart3 className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="font-medium text-slate-100">Analisis Profil Gabungan</h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {analysis.profile.name} · {analysis.profile.mbti || "MBTI belum diisi"} · Enneagram {analysis.profile.enneagramType || "belum diisi"}
                                                </p>
                                                <p className="mt-2 text-sm leading-6 text-slate-400">{createExcerpt(analysis.markdown)}</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-left md:text-right">
                                            <p className="text-sm text-slate-400">{formatDateTime(analysis.createdAt)}</p>
                                            <p className="mt-1 text-xs text-slate-500">Model: {analysis.model}</p>
                                            <Link href={`/riwayat/${analysis.id}`} className="mt-3 inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                                                Lihat Detail
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </SurfaceCard>
            </div>

            <RightRail>
                <SurfaceCard title="Ringkasan">
                    <StatusList
                        items={[
                            { label: "Analisis", value: String(analyses.length) },
                            { label: "Terbaru", value: analyses[0] ? formatDateTime(analyses[0].createdAt) : "Belum Ada" },
                        ]}
                    />
                </SurfaceCard>
                <SurfaceCard title="Perbandingan">
                    <p className="text-sm leading-6 text-slate-500">
                        Riwayat menyimpan hasil analisis agar perubahan profil dan wawasan dapat dibandingkan dari waktu ke waktu.
                    </p>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}

