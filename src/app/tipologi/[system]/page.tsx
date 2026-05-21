import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { getTypologyFramework, typologyFrameworks, typologyTypeSlug } from "@/data/typology-frameworks";

type PageProps = {
    params: Promise<{ system: string }>;
};

export function generateStaticParams() {
    return typologyFrameworks.map((framework) => ({ system: framework.key }));
}

export default async function TypologyFrameworkPage({ params }: PageProps) {
    const { system } = await params;
    const framework = getTypologyFramework(system);

    if (!framework) {
        notFound();
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <Link href="/tipologi" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-cyan-600 dark:hover:text-cyan-300">
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke peta tipologi
                </Link>

                <SurfaceCard title={framework.title} eyebrow="Daftar Tipe">
                    <p className="max-w-3xl text-sm leading-6 text-slate-500">{framework.description}</p>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {framework.types.map((item) => (
                            <article
                                key={item.code}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">{framework.system}</p>
                                        <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{item.code}</h2>
                                    </div>
                                    <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 dark:border-white/10">
                                        {item.mistypeWith.length} mistype
                                    </span>
                                </div>
                                <h3 className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">{item.name}</h3>
                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {item.mistypeWith.slice(0, 3).map((mistype) => (
                                        <span key={mistype} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[11px] text-cyan-700 dark:text-cyan-200">
                                            {mistype}
                                        </span>
                                    ))}
                                </div>
                                <Link
                                    href={`/tipologi/${framework.key}/${typologyTypeSlug(item.code)}`}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:text-slate-200 dark:hover:border-cyan-300/45 dark:hover:text-cyan-200"
                                >
                                    Lihat Detail
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </article>
                        ))}
                    </div>
                </SurfaceCard>
            </div>

            <RightRail>
                <SurfaceCard title="Ringkasan Sistem">
                    <StatusList
                        items={[
                            { label: "Sistem", value: framework.system },
                            { label: "Jumlah tipe", value: String(framework.types.length) },
                            { label: "Mode", value: "Eksplorasi" },
                        ]}
                    />
                </SurfaceCard>
                <SurfaceCard title="Cara Pakai">
                    <p className="text-sm leading-6 text-slate-500">
                        Buka detail tipe untuk melihat pola utama, mistype umum, pertanyaan pembeda, dan eksplorasi AI singkat.
                    </p>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}
