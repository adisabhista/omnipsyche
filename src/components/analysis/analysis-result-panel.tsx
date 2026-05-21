import ReactMarkdown from "react-markdown";
import { AlertTriangle, Brain, BriefcaseBusiness, CheckCircle2, Compass, Layers3, Sparkles, Target } from "lucide-react";
import { SurfaceCard, StatusList } from "@/components/PlatformCards";
import { normalizeAnalysisResult, type AnalysisResultLike } from "@/lib/analysis-result-normalizer";
import { personalityAnalysisSchema, type PersonalityAnalysis } from "@/lib/personality-json-schema";

type AnalysisResultPanelProps = {
    analysis: AnalysisResultLike;
};

type IconType = React.ComponentType<{ className?: string }>;

function SectionCard({
    title,
    eyebrow,
    icon: Icon,
    children,
    className,
}: {
    title: string;
    eyebrow?: string;
    icon?: IconType;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)] ${className ?? ""}`}>
            <div className="flex items-start gap-3">
                {Icon && (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-400/25 bg-cyan-300/10">
                        <Icon className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                    </span>
                )}
                <div className="min-w-0">
                    {eyebrow && <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">{eyebrow}</p>}
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
                </div>
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full border border-cyan-400/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-800 dark:text-cyan-200">
            {children}
        </span>
    );
}

function muted(value: string | null | undefined) {
    return value && value.trim() ? value : "Belum Ada";
}

function joinEnneagram(enneagram: PersonalityAnalysis["profile_data"]["enneagram"]) {
    if (!enneagram.type) return null;
    return enneagram.wing ? `${enneagram.type}w${enneagram.wing}` : String(enneagram.type);
}

function TextBlock({ children }: { children: React.ReactNode }) {
    return <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{children}</p>;
}

function TextList({ items }: { items: string[] }) {
    if (items.length === 0) {
        return <p className="text-sm text-slate-500">Tidak ada data.</p>;
    }

    return (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80 dark:divide-white/10 dark:border-white/10 dark:bg-black/20">
            {items.map((item) => (
                <li key={item} className="p-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item}
                </li>
            ))}
        </ul>
    );
}

function InsightGrid({
    items,
}: {
    items: Array<{ title: string; detail: string; meta?: string }>;
}) {
    if (items.length === 0) {
        return <p className="text-sm text-slate-500">Tidak ada data.</p>;
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
                <article key={`${item.title}-${item.meta ?? ""}`} className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-black/20">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.title}</h3>
                        {item.meta && <span className="shrink-0 rounded-full border border-cyan-400/25 px-2 py-1 text-[11px] font-medium uppercase text-cyan-700 dark:text-cyan-300">{item.meta}</span>}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.detail}</p>
                </article>
            ))}
        </div>
    );
}

function stripLegacyTitle(markdown: string) {
    return markdown
        .replace(/^#\s*(?:[^\nA-Za-z0-9]*)?\s*Analisis OmniPsyche:[^\n]*\n+/i, "")
        .trim();
}

function MarkdownFallback({ markdown }: { markdown: string }) {
    return (
        <SurfaceCard title="Hasil Analisis" eyebrow="Mode Kompatibilitas">
            <div className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm leading-6 text-amber-900 dark:text-amber-100">
                Format analisis lama terdeteksi. Menampilkan hasil dalam mode kompatibilitas.
            </div>
            <div className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                <ReactMarkdown
                    components={{
                        h1: (props) => <h2 className="mb-3 mt-6 text-xl font-semibold text-slate-950 first:mt-0 dark:text-slate-100" {...props} />,
                        h2: (props) => <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-950 dark:text-slate-100" {...props} />,
                        h3: (props) => <h4 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300" {...props} />,
                        p: (props) => <p className="mb-4 text-sm leading-7 text-slate-600 dark:text-slate-400" {...props} />,
                        ul: (props) => <ul className="mb-4 space-y-2 pl-5" {...props} />,
                        ol: (props) => <ol className="mb-4 space-y-2 pl-5" {...props} />,
                        li: (props) => <li className="pl-1 text-sm leading-7 text-slate-600 marker:text-cyan-600 dark:text-slate-400 dark:marker:text-cyan-300" {...props} />,
                        strong: (props) => <strong className="font-semibold text-slate-900 dark:text-slate-200" {...props} />,
                        hr: () => <div className="my-5 border-t border-slate-200 dark:border-white/10" />,
                    }}
                >
                    {stripLegacyTitle(markdown)}
                </ReactMarkdown>
            </div>
        </SurfaceCard>
    );
}

function StructuredAnalysis({ analysis }: { analysis: PersonalityAnalysis }) {
    const profile = analysis.profile_data;
    const badges = [
        ["MBTI", profile.mbti],
        ["Enneagram", joinEnneagram(profile.enneagram)],
        ["Tritype", profile.enneagram.tritype],
        ["Instinctual Variant", profile.enneagram.instinctual_variant],
        ["Socionics", profile.socionics.type],
        ["Attitudinal Psyche", profile.attitudinal_psyche],
        ["RIASEC", profile.riasec],
    ].filter((item): item is [string, string] => Boolean(item[1]));

    const apBreakdown = analysis.social_volitional.ap_breakdown;

    return (
        <div className="space-y-4">
            <SectionCard title="Ringkasan Profil" eyebrow="Sumber Wawasan" icon={Sparkles}>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{analysis.archetype.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{analysis.archetype.summary}</p>
                {badges.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {badges.map(([label, value]) => (
                            <Badge key={label}>{label}: {value}</Badge>
                        ))}
                    </div>
                )}
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Dinamika Kognitif" eyebrow="Pola Internal" icon={Brain}>
                    {analysis.cognitive_dynamics.mbti_stack.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {analysis.cognitive_dynamics.mbti_stack.map((item) => (
                                <Badge key={item}>{item}</Badge>
                            ))}
                        </div>
                    )}
                    <div className="space-y-4">
                        <TextBlock>{analysis.cognitive_dynamics.loop_description}</TextBlock>
                        <div className="border-t border-slate-200 pt-4 dark:border-white/10">
                            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">Sintesis Lintas Kerangka</p>
                            <TextBlock>{analysis.cognitive_dynamics.cross_framework_synthesis}</TextBlock>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Sosial & Volisional" eyebrow="Gaya Ekspresi" icon={Layers3}>
                    <TextBlock>{analysis.social_volitional.description}</TextBlock>
                    {apBreakdown && (
                        <div className="mt-4">
                            <StatusList
                                items={[
                                    { label: "Posisi 1", value: muted(apBreakdown.position_1) },
                                    { label: "Posisi 2", value: muted(apBreakdown.position_2) },
                                    { label: "Posisi 3", value: muted(apBreakdown.position_3) },
                                    { label: "Posisi 4", value: muted(apBreakdown.position_4) },
                                ]}
                            />
                        </div>
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Dorongan Instingtual" eyebrow="Motivasi Dasar" icon={Compass}>
                <TextBlock>{analysis.instinctual_drive}</TextBlock>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Blind Spot" eyebrow="Area Rentan" icon={AlertTriangle}>
                    <TextList items={analysis.shadow_work.blind_spots} />
                </SectionCard>
                <SectionCard title="Arah Pertumbuhan" eyebrow="Growth Edge" icon={Target}>
                    <TextList items={analysis.shadow_work.growth_edges} />
                </SectionCard>
            </div>

            <SectionCard title="Karier" eyebrow="Arah Praktis" icon={BriefcaseBusiness}>
                <div className="space-y-5">
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-950 dark:text-slate-100">Jurusan Direkomendasikan</h3>
                        <InsightGrid items={analysis.career.recommended_majors.map((item) => ({ title: item.name, detail: item.rationale }))} />
                    </div>
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-950 dark:text-slate-100">Jalur Karier</h3>
                        <InsightGrid items={analysis.career.career_paths.map((item) => ({ title: item.title, detail: item.rationale, meta: item.fit_score }))} />
                    </div>
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-950 dark:text-slate-100">Lingkungan Ideal</h3>
                        <TextList items={analysis.career.ideal_environment} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Rekomendasi Pertumbuhan" eyebrow="Latihan Fokus" icon={Target}>
                <InsightGrid items={analysis.growth_recommendations.map((item) => ({ title: item.area, detail: item.practice }))} />
            </SectionCard>

            <SectionCard title="Audit Konsistensi" eyebrow="Pemeriksaan Data" icon={CheckCircle2}>
                <StatusList
                    items={[
                        { label: "Framework", value: analysis.consistency_audit.frameworks_used.join(", ") || "Belum Ada" },
                        { label: "Inferensi", value: analysis.consistency_audit.inferred_fields.join(", ") || "Tidak Ada" },
                        { label: "Peringatan", value: analysis.consistency_audit.warnings.length ? `${analysis.consistency_audit.warnings.length} Catatan` : "Tidak Ada" },
                    ]}
                />
                {analysis.consistency_audit.warnings.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {analysis.consistency_audit.warnings.map((warning) => (
                            <p key={warning} className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                {warning}
                            </p>
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}

export function AnalysisResultPanel({ analysis }: AnalysisResultPanelProps) {
    const normalized = normalizeAnalysisResult(analysis);
    const parsed = personalityAnalysisSchema.safeParse(normalized.profileJson);

    if (parsed.success) {
        return <StructuredAnalysis analysis={parsed.data} />;
    }

    if (normalized.markdown) {
        return <MarkdownFallback markdown={normalized.markdown} />;
    }

    return null;
}
