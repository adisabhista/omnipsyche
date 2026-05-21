import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import TypeExplorationPanel from "@/components/tipologi/type-exploration-panel";
import { getTypologyType, typologyFrameworks, typologyTypeSlug } from "@/data/typology-frameworks";

type PageProps = {
    params: Promise<{ system: string; type: string }>;
};

export function generateStaticParams() {
    return typologyFrameworks.flatMap((framework) =>
        framework.types.map((item) => ({
            system: framework.key,
            type: typologyTypeSlug(item.code),
        }))
    );
}

export default async function TypologyTypePage({ params }: PageProps) {
    const { system, type } = await params;
    const result = getTypologyType(system, type);

    if (!result) {
        notFound();
    }

    const { framework, type: typologyType } = result;

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <Link href={`/tipologi/${framework.key}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-cyan-600 dark:hover:text-cyan-300">
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke {framework.title}
                </Link>

                <SurfaceCard title={`${typologyType.code} - ${typologyType.name}`} eyebrow={framework.system}>
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Overview</p>
                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{typologyType.description}</p>
                        </div>
                        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Nama sistem</p>
                            <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">{framework.system}</p>
                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Kode tipe</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-50">{typologyType.code}</p>
                        </div>
                    </div>
                </SurfaceCard>

                <div className="grid gap-4 lg:grid-cols-2">
                    <SurfaceCard title="Pola Utama" eyebrow="Core Pattern">
                        <p className="text-sm leading-6 text-slate-500">{typologyType.corePattern}</p>
                    </SurfaceCard>

                    <SurfaceCard title="Sering Mistype Dengan" eyebrow="Pembanding">
                        <div className="flex flex-wrap gap-2">
                            {typologyType.mistypeWith.map((mistype) => (
                                <span key={mistype} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-700 dark:text-cyan-200">
                                    {mistype}
                                </span>
                            ))}
                        </div>
                    </SurfaceCard>
                </div>

                <SurfaceCard title="Pertanyaan Pembeda" eyebrow="Refleksi Perilaku">
                    <div className="divide-y divide-slate-200 dark:divide-white/10">
                        {typologyType.distinguishingQuestions.map((question, index) => (
                            <div key={question} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[44px_1fr]">
                                <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                                    {index + 1}
                                </span>
                                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{question}</p>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>

                <TypeExplorationPanel type={typologyType} />
            </div>

            <RightRail>
                <SurfaceCard title="Detail Tipe">
                    <StatusList
                        items={[
                            { label: "Sistem", value: framework.system },
                            { label: "Kode", value: typologyType.code },
                            { label: "Mistype", value: typologyType.mistypeWith.slice(0, 3).join(", ") || "-" },
                        ]}
                    />
                </SurfaceCard>
                <SurfaceCard title="Prinsip Eksplorasi">
                    <p className="text-sm leading-6 text-slate-500">
                        Bandingkan tipe dari perilaku berulang, motivasi, dan konteks nyata. Kemiripan nama antar sistem tidak selalu berarti tipe yang sama.
                    </p>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}
