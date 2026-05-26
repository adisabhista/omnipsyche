"use client";

import Link from "next/link";
import clsx from "clsx";
import { CheckCircle2, Loader2, MinusCircle, RefreshCw } from "lucide-react";

const dimensions = ["I/E", "N/S", "T/F", "J/P"] as const;

function normalizeMbti(value: string | null | undefined) {
    if (!value) return null;
    const normalized = value.trim().toUpperCase();
    if (normalized === "UNKNOWN" || normalized.length !== 4) return null;
    return /^[IE][NS][TF][JP]$/.test(normalized) ? normalized : null;
}

function getComparisonStatus(currentMbti: string | null, devilMbti: string | null) {
    const current = normalizeMbti(currentMbti);
    const devil = normalizeMbti(devilMbti);

    if (!devil || !current) return "unknown";
    return current === devil ? "same" : "different";
}

export function MbtiProfileComparisonCard({
    currentMbti,
    devilMbti,
    alreadyApplied,
    applying,
    dismissed,
    onApply,
    onKeepCurrent,
}: {
    currentMbti: string | null;
    devilMbti: string;
    alreadyApplied: boolean;
    applying: boolean;
    dismissed: boolean;
    onApply: () => void;
    onKeepCurrent: () => void;
}) {
    const current = normalizeMbti(currentMbti);
    const devil = normalizeMbti(devilMbti);
    const status = getComparisonStatus(currentMbti, devilMbti);

    if (!devil) return null;

    const explanation =
        status === "same"
            ? "Hasil Devil.ai selaras dengan MBTI yang tersimpan di profil. Tetap gunakan ini sebagai data pendukung, bukan kepastian mutlak."
            : status === "different"
                ? "Hasil Devil.ai berbeda dari MBTI yang tersimpan. Gunakan perbedaan ini sebagai bahan refleksi sebelum memperbarui profil."
                : "Profil belum memiliki MBTI yang jelas. Kamu bisa memakai hasil Devil.ai sebagai data awal, lalu meninjaunya lagi lewat Bangun Profil.";

    return (
        <section className="rounded-lg border border-cyan-300/25 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-cyan-300/15 dark:bg-white/[0.055] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">Sebelum Menerapkan</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Bandingkan dengan Profil Saat Ini</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">{explanation}</p>
                    {alreadyApplied && (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
                            <CheckCircle2 className="h-4 w-4" />
                            Hasil Devil.ai sudah diterapkan ke profil.
                        </p>
                    )}
                    {dismissed && !alreadyApplied && (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-slate-400">
                            <MinusCircle className="h-4 w-4" />
                            Profil saat ini tetap dipertahankan.
                        </p>
                    )}
                </div>
                <span
                    className={clsx(
                        "inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                        status === "same" && "border-emerald-300/30 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200",
                        status === "different" && "border-amber-300/30 bg-amber-300/10 text-amber-700 dark:text-amber-200",
                        status === "unknown" && "border-slate-300/40 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    )}
                >
                    {status === "same" ? "Selaras" : status === "different" ? "Berbeda" : "Belum bisa dibandingkan"}
                </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Profil saat ini</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{current ?? "Belum diisi"}</p>
                </div>
                <div className="rounded-lg border border-cyan-300/25 bg-cyan-50 p-4 dark:bg-cyan-300/[0.06]">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Hasil Devil.ai</p>
                    <p className="mt-2 text-2xl font-semibold text-cyan-900 dark:text-cyan-100">{devil}</p>
                </div>
            </div>

            {current && status === "different" && (
                <div className="mt-5 grid gap-2 sm:grid-cols-4">
                    {dimensions.map((label, index) => {
                        const same = current[index] === devil[index];
                        return (
                            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-black/25">
                                <p className="text-xs font-semibold text-slate-500">{label}</p>
                                <p className={clsx("mt-2 text-sm font-medium", same ? "text-emerald-600 dark:text-emerald-300" : "text-amber-700 dark:text-amber-200")}>
                                    {same ? "Sama" : "Berbeda"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-white/10">
                <button
                    id="btn-apply-mbti"
                    onClick={onApply}
                    disabled={applying || alreadyApplied}
                    className={clsx(
                        "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed",
                        alreadyApplied
                            ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200"
                            : "bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60"
                    )}
                >
                    {applying ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : alreadyApplied ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Sudah Tersimpan
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Terapkan Hasil Devil.ai
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onKeepCurrent}
                    disabled={alreadyApplied}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:border-cyan-300/45 dark:hover:text-cyan-200"
                >
                    Pertahankan Profil Saat Ini
                </button>
                <Link
                    href="/bangun-profil"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:text-slate-200 dark:hover:border-cyan-300/45 dark:hover:text-cyan-200"
                >
                    Buka Bangun Profil
                </Link>
            </div>
        </section>
    );
}
