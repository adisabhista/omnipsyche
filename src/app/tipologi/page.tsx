import Link from "next/link";
import { ArrowRight, ClipboardCheck, Layers3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getLatestUserProfile } from "@/lib/analysis-data";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { typologyFrameworks } from "@/data/typology-frameworks";

function getProfileValue(profile: Awaited<ReturnType<typeof getLatestUserProfile>>, frameworkKey: string) {
    if (!profile) return "Belum diisi";

    const values: Record<string, string | null | undefined> = {
        mbti: profile.mbti,
        enneagram: profile.enneagramType !== "unknown"
            ? `${profile.enneagramType}${profile.enneagramWing !== "unknown" ? `w${profile.enneagramWing}` : ""}`
            : "unknown",
        "instinctual-variant": profile.instinctualVariant,
        tritype: profile.enneagramTritype,
        socionics: profile.socionics,
        "attitudinal-psyche": profile.attitudinalPsyche,
        riasec: profile.riasec,
        "big-five": profile.bigFive ? "Tersimpan" : "Belum diisi",
        temperament: profile.temperament,
    };
    const value = values[frameworkKey];

    return value && value !== "unknown" ? value : "Belum diisi";
}

export default async function TipologiPage() {
    const session = await auth();
    const profile = session?.user?.id ? await getLatestUserProfile(session.user.id) : null;

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <SurfaceCard title="Peta Tipologi" eyebrow="Eksplorasi">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {typologyFrameworks.map((framework) => (
                            <div
                                key={framework.key}
                                className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-400/45 hover:bg-cyan-50 dark:border-white/10 dark:bg-black/20 dark:hover:border-cyan-300/35 dark:hover:bg-cyan-300/[0.04]"
                            >
                                <Link href={`/tipologi/${framework.key}`}>
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-300/25 bg-cyan-300/10">
                                                <Layers3 className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                                            </span>
                                            <div>
                                                <h2 className="font-semibold text-slate-950 dark:text-slate-100">{framework.title}</h2>
                                                <p className="text-xs text-slate-500">{framework.types.length} tipe</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="mt-2 h-4 w-4 text-slate-400 transition group-hover:text-cyan-500" />
                                    </div>
                                    <p className="text-sm leading-6 text-slate-500">{framework.description}</p>
                                    <p className="mt-3 text-xs text-cyan-700 dark:text-cyan-300">
                                        Tipe kamu: {getProfileValue(profile, framework.key)}
                                    </p>
                                </Link>
                                {framework.key === "mbti" && (
                                    <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                                        <Link
                                            href="/tipologi/mbti"
                                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-cyan-300/45 dark:hover:text-cyan-200"
                                        >
                                            <Layers3 className="h-3 w-3" />
                                            Lihat Tipe
                                        </Link>
                                        <Link
                                            href="/tipologi/mbti/tes"
                                            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-300/40 bg-cyan-300/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-300/20 dark:border-cyan-300/25 dark:text-cyan-200 dark:hover:bg-cyan-300/15"
                                        >
                                            <ClipboardCheck className="h-3 w-3" />
                                            Tes MBTI
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </SurfaceCard>

                {/* Devil.ai MBTI Test CTA */}
                <SurfaceCard title="Tes MBTI" eyebrow="Devil.ai">
                    <p className="max-w-2xl text-sm leading-6 text-slate-500">
                        Buat tes MBTI eksternal lewat Devil.ai dan impor hasilnya ke OmniPsyche.
                        Hasil digunakan sebagai data pendukung, bukan penentu absolut.
                    </p>
                    <Link
                        href="/tipologi/mbti/tes"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                        <ClipboardCheck className="h-4 w-4" />
                        Mulai Tes MBTI
                    </Link>
                </SurfaceCard>
            </div>

            <RightRail>
                <SurfaceCard title="Mode Eksplorasi">
                    <StatusList
                        items={[
                            { label: "Profil", value: profile?.name || "Belum terhubung" },
                            { label: "Framework", value: String(typologyFrameworks.length) },
                            { label: "AI", value: "Eksplorasi reflektif" },
                        ]}
                    />
                </SurfaceCard>
                <SurfaceCard title="Catatan">
                    <p className="text-sm leading-6 text-slate-500">
                        Tipologi dipakai sebagai lensa eksplorasi. Gunakan pertanyaan pembeda untuk mengecek pengalaman nyata, bukan untuk mengunci identitas.
                    </p>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}
