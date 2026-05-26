import clsx from "clsx";
import type { ProfileValidationResult } from "@/lib/profile-validation-schema";

type Strength = "strong" | "medium" | "weak" | "insufficient";

type SourceItem = {
    label: string;
    available: boolean;
    status: "Tersedia" | "Belum tersedia" | "Terbatas";
    strength: Strength;
    explanation: string;
};

const strengthLabels: Record<Strength, string> = {
    strong: "Kuat",
    medium: "Sedang",
    weak: "Lemah",
    insufficient: "Belum cukup",
};

function hasBookInsight(result: ProfileValidationResult) {
    return result.evidence.some((item) => item.source === "book_recommendation");
}

function buildSourceItems(result: ProfileValidationResult): SourceItem[] {
    const quality = result.data_quality;
    const bookCount = quality.book_collection_count;
    const finishedCount = quality.finished_books_count;

    const bookStrength: Strength = bookCount >= 5 ? "strong" : bookCount > 0 ? "weak" : "insufficient";
    const finishedStrength: Strength = finishedCount >= 3 ? "strong" : finishedCount > 0 ? "medium" : "insufficient";
    const bookInsightAvailable = hasBookInsight(result);

    return [
        {
            label: "Profil",
            available: quality.profile_available,
            status: quality.profile_available ? "Tersedia" : "Belum tersedia",
            strength: quality.profile_available ? "strong" : "insufficient",
            explanation: quality.profile_available ? "Profil dasar menjadi konteks utama pemeriksaan." : "Profil dasar belum tersedia.",
        },
        {
            label: "Analisis AI",
            available: quality.analysis_available,
            status: quality.analysis_available ? "Tersedia" : "Belum tersedia",
            strength: quality.analysis_available ? "strong" : "insufficient",
            explanation: quality.analysis_available ? "Analisis tersimpan memberi konteks sintesis yang lebih luas." : "Belum ada analisis AI tersimpan.",
        },
        {
            label: "Pengaturan",
            available: quality.settings_available,
            status: quality.settings_available ? "Tersedia" : "Belum tersedia",
            strength: quality.settings_available ? "medium" : "insufficient",
            explanation: quality.settings_available ? "Preferensi dan latar personal ikut memperjelas konteks." : "Pengaturan personal belum banyak terisi.",
        },
        {
            label: "Koleksi Buku",
            available: bookCount > 0,
            status: bookCount >= 5 ? "Tersedia" : bookCount > 0 ? "Terbatas" : "Belum tersedia",
            strength: bookStrength,
            explanation: bookCount > 0 ? `${bookCount} buku memberi sinyal minat bacaan.` : "Belum ada koleksi buku yang bisa dibaca sebagai sinyal.",
        },
        {
            label: "Buku Selesai",
            available: finishedCount > 0,
            status: finishedCount >= 3 ? "Tersedia" : finishedCount > 0 ? "Terbatas" : "Belum tersedia",
            strength: finishedStrength,
            explanation: finishedCount > 0 ? `${finishedCount} buku selesai memberi sinyal preferensi yang lebih kuat.` : "Belum ada buku selesai.",
        },
        {
            label: "Minat Karier",
            available: quality.career_data_available,
            status: quality.career_data_available ? "Tersedia" : "Belum tersedia",
            strength: quality.career_data_available ? "medium" : "insufficient",
            explanation: quality.career_data_available ? "Data karier membantu membaca arah lingkungan dan peran." : "Data minat karier belum tersedia.",
        },
        {
            label: "Narasi Diri",
            available: quality.narrative_data_available,
            status: quality.narrative_data_available ? "Tersedia" : "Belum tersedia",
            strength: quality.narrative_data_available ? "strong" : "insufficient",
            explanation: quality.narrative_data_available ? "Narasi diri memberi konteks pengalaman dan pola bahasa." : "Narasi diri belum tersedia.",
        },
        {
            label: "Rekomendasi Buku",
            available: bookInsightAvailable,
            status: bookInsightAvailable ? "Tersedia" : "Belum tersedia",
            strength: bookInsightAvailable ? "medium" : "insufficient",
            explanation: bookInsightAvailable ? "Insight buku ikut menjadi konteks tambahan." : "Belum ada insight rekomendasi buku.",
        },
    ];
}

function StrengthBars({ strength }: { strength: Strength }) {
    const activeBars = strength === "strong" ? 3 : strength === "medium" ? 2 : strength === "weak" ? 1 : 0;

    return (
        <div className="flex gap-1" aria-label={`Kekuatan ${strengthLabels[strength]}`}>
            {[0, 1, 2].map((bar) => (
                <span
                    key={bar}
                    className={clsx(
                        "h-2 w-6 rounded-full",
                        bar < activeBars
                            ? strength === "strong"
                                ? "bg-emerald-400"
                                : strength === "medium"
                                    ? "bg-cyan-300"
                                    : "bg-amber-300"
                            : "bg-slate-200 dark:bg-white/10"
                    )}
                />
            ))}
        </div>
    );
}

export function EvidenceSourceCard({ result }: { result: ProfileValidationResult }) {
    const items = buildSourceItems(result);

    return (
        <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">Konteks Pemeriksaan</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Sumber Data yang Dipakai</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Semakin lengkap sumber data, semakin kuat konteks pemeriksaan konsistensi.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                    <article key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</h3>
                                <p className="mt-1 text-xs text-slate-500">{item.status}</p>
                            </div>
                            <span
                                className={clsx(
                                    "rounded-full border px-2 py-1 text-[11px] font-medium",
                                    item.strength === "strong" && "border-emerald-300/30 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200",
                                    item.strength === "medium" && "border-cyan-300/30 bg-cyan-300/10 text-cyan-700 dark:text-cyan-200",
                                    item.strength === "weak" && "border-amber-300/30 bg-amber-300/10 text-amber-700 dark:text-amber-200",
                                    item.strength === "insufficient" && "border-slate-300/40 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                                )}
                            >
                                {strengthLabels[item.strength]}
                            </span>
                        </div>
                        <div className="mt-3">
                            <StrengthBars strength={item.strength} />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.explanation}</p>
                    </article>
                ))}
            </div>

            <p className="mt-4 rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Bobot ini hanya membantu membaca kelengkapan konteks, bukan bukti mutlak.
            </p>
        </section>
    );
}
