import Link from "next/link";
import { notFound } from "next/navigation";
import AnalysisResult from "@/components/AnalysisResult";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { getUserAnalysisById } from "@/lib/analysis-data";
import { formatDateTime } from "@/lib/analysis-format";
import { auth } from "@/lib/auth";
import { personalityAnalysisSchema, type PersonalityAnalysis } from "@/lib/personality-json-schema";

type PageProps = {
    params: Promise<{ id: string }>;
};

function getStructuredAnalysis(value: unknown): PersonalityAnalysis | null {
    const parsed = personalityAnalysisSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
}

function TextList({ items }: { items: string[] }) {
    if (items.length === 0) {
        return <p className="text-sm text-slate-500">Tidak ada data.</p>;
    }

    return (
        <ul className="space-y-2">
            {items.map((item) => (
                <li key={item} className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm leading-6 text-slate-300">
                    {item}
                </li>
            ))}
        </ul>
    );
}

export default async function AnalysisDetailPage({ params }: PageProps) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return (
            <SurfaceCard title="Detail Analisis">
                <div className="py-10 text-center">
                    <p className="text-sm text-slate-400">Masuk terlebih dahulu untuk melihat detail analisis.</p>
                    <Link href="/login" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                        Masuk
                    </Link>
                </div>
            </SurfaceCard>
        );
    }

    const { id } = await params;
    const analysis = await getUserAnalysisById(userId, id);

    if (!analysis) {
        notFound();
    }

    const structured = getStructuredAnalysis(analysis.parsedJson);

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <SurfaceCard title="Detail Analisis" eyebrow="Riwayat">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-400">{formatDateTime(analysis.createdAt)}</p>
                            <p className="mt-2 text-sm text-slate-500">Profil: {analysis.profile.name}</p>
                        </div>
                        <Link href="/riwayat" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                            Kembali
                        </Link>
                    </div>
                </SurfaceCard>

                {structured ? (
                    <>
                        <SurfaceCard title={structured.archetype.title} eyebrow="Arketipe">
                            <p className="text-sm leading-6 text-slate-400">{structured.archetype.summary}</p>
                        </SurfaceCard>

                        <SurfaceCard title="Data Profil">
                            <StatusList
                                items={[
                                    { label: "MBTI", value: structured.profile_data.mbti || "Belum Ada" },
                                    { label: "Enneagram", value: structured.profile_data.enneagram.type ? String(structured.profile_data.enneagram.type) : "Belum Ada" },
                                    { label: "Insting", value: structured.profile_data.enneagram.instinctual_variant || "Belum Ada" },
                                    { label: "Socionics", value: structured.profile_data.socionics.type || "Belum Ada" },
                                    { label: "Attitudinal Psyche", value: structured.profile_data.attitudinal_psyche || "Belum Ada" },
                                    { label: "RIASEC", value: structured.profile_data.riasec || "Belum Ada" },
                                ]}
                            />
                        </SurfaceCard>

                        <SurfaceCard title="Shadow Work">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <h2 className="mb-3 text-sm font-semibold text-slate-200">Blind Spot</h2>
                                    <TextList items={structured.shadow_work.blind_spots} />
                                </div>
                                <div>
                                    <h2 className="mb-3 text-sm font-semibold text-slate-200">Arah Pertumbuhan</h2>
                                    <TextList items={structured.shadow_work.growth_edges} />
                                </div>
                            </div>
                        </SurfaceCard>

                        <SurfaceCard title="Karier">
                            <div className="space-y-5">
                                <div>
                                    <h2 className="mb-3 text-sm font-semibold text-slate-200">Jurusan Direkomendasikan</h2>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {structured.career.recommended_majors.map((major) => (
                                            <div key={major.name} className="rounded-lg border border-white/10 bg-black/25 p-4">
                                                <p className="font-medium text-slate-100">{major.name}</p>
                                                <p className="mt-2 text-sm leading-6 text-slate-500">{major.rationale}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="mb-3 text-sm font-semibold text-slate-200">Jalur Karier</h2>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {structured.career.career_paths.map((path) => (
                                            <div key={path.title} className="rounded-lg border border-white/10 bg-black/25 p-4">
                                                <p className="font-medium text-slate-100">{path.title}</p>
                                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-300">{path.fit_score}</p>
                                                <p className="mt-2 text-sm leading-6 text-slate-500">{path.rationale}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="mb-3 text-sm font-semibold text-slate-200">Lingkungan Ideal</h2>
                                    <TextList items={structured.career.ideal_environment} />
                                </div>
                            </div>
                        </SurfaceCard>

                        <SurfaceCard title="Rekomendasi Pertumbuhan">
                            <div className="grid gap-3 md:grid-cols-2">
                                {structured.growth_recommendations.map((item) => (
                                    <div key={item.area} className="rounded-lg border border-white/10 bg-black/25 p-4">
                                        <p className="font-medium text-slate-100">{item.area}</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.practice}</p>
                                    </div>
                                ))}
                            </div>
                        </SurfaceCard>

                        <SurfaceCard title="Audit Konsistensi">
                            <StatusList
                                items={[
                                    { label: "Framework", value: structured.consistency_audit.frameworks_used.join(", ") || "Belum Ada" },
                                    { label: "Inferensi", value: structured.consistency_audit.inferred_fields.join(", ") || "Tidak Ada" },
                                    { label: "Peringatan", value: structured.consistency_audit.warnings.length ? `${structured.consistency_audit.warnings.length} Catatan` : "Tidak Ada" },
                                ]}
                            />
                        </SurfaceCard>
                    </>
                ) : (
                    <AnalysisResult markdown={analysis.markdown} isLoading={false} />
                )}
            </div>

            <RightRail>
                <SurfaceCard title="Metadata">
                    <StatusList
                        items={[
                            { label: "Model", value: analysis.model },
                            { label: "Profil", value: analysis.profile.name },
                            { label: "Tanggal", value: formatDateTime(analysis.createdAt) },
                        ]}
                    />
                </SurfaceCard>
            </RightRail>
        </div>
    );
}

