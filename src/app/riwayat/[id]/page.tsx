import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalysisResultPanel } from "@/components/analysis/analysis-result-panel";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { getUserAnalysisById } from "@/lib/analysis-data";
import { formatDateTime } from "@/lib/analysis-format";
import { auth } from "@/lib/auth";

type PageProps = {
    params: Promise<{ id: string }>;
};

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

                <AnalysisResultPanel analysis={analysis} />
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
