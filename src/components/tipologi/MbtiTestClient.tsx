"use client";

import { useState } from "react";
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    RefreshCw,
    Sparkles,
    XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TestRecord {
    id: string;
    testId: string;
    testUrl: string;
    status: string;
    prediction: string | null;
    resultsPage: string | null;
    createdAt: string;
    completedAt: string | null;
}

interface CheckResult {
    status: string;
    message?: string;
    prediction?: string;
    resultsPage?: string;
    traitOrderConscious?: string[];
    traitOrderShadow?: string[];
    matches?: unknown[];
    completedAt?: string;
}

interface MbtiTestClientProps {
    initialTests: TestRecord[];
    currentMbti: string | null;
}

const CONSCIOUS_LABELS = ["Hero", "Parent", "Child", "Inferior"];
const SHADOW_LABELS = ["Nemesis", "Critic", "Trickster", "Demon"];

const cardIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export default function MbtiTestClient({ initialTests, currentMbti }: MbtiTestClientProps) {
    const [tests, setTests] = useState<TestRecord[]>(initialTests);
    const [latestCreated, setLatestCreated] = useState<{ testId: string; testUrl: string } | null>(null);
    const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
    const [appliedMbti, setAppliedMbti] = useState<string | null>(null);

    const [creatingTest, setCreatingTest] = useState(false);
    const [checkingTest, setCheckingTest] = useState(false);
    const [applyingMbti, setApplyingMbti] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const activeTestId = latestCreated?.testId ?? tests.find((t) => t.status === "pending")?.testId ?? null;
    const completedResult = checkResult?.status === "completed" ? checkResult : null;
    const displayMbti = appliedMbti ?? currentMbti;

    async function handleCreateTest() {
        setCreatingTest(true);
        setError(null);
        setCheckResult(null);
        setLatestCreated(null);

        try {
            const res = await fetch("/api/external-tests/mbti/devil/new", { method: "POST" });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Gagal membuat tes.");

            setLatestCreated({ testId: data.test.testId, testUrl: data.test.testUrl });
            refreshHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal membuat tes MBTI.");
        } finally {
            setCreatingTest(false);
        }
    }

    async function handleCheckTest(testId?: string) {
        const id = testId ?? activeTestId;
        if (!id) return;

        setCheckingTest(true);
        setError(null);

        try {
            const res = await fetch("/api/external-tests/mbti/devil/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testId: id }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Gagal mengecek hasil tes.");

            setCheckResult(data);
            if (data.status === "completed") refreshHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal mengecek hasil tes.");
        } finally {
            setCheckingTest(false);
        }
    }

    async function handleApplyToProfile() {
        if (!completedResult?.prediction || !activeTestId) return;

        setApplyingMbti(true);
        setError(null);

        try {
            const res = await fetch("/api/external-tests/mbti/devil/apply-to-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testId: activeTestId }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Gagal menerapkan MBTI.");

            setAppliedMbti(data.mbti);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menerapkan MBTI ke profil.");
        } finally {
            setApplyingMbti(false);
        }
    }

    async function refreshHistory() {
        try {
            const res = await fetch("/api/external-tests/mbti/devil/latest");
            const data = await res.json();
            if (data.tests) setTests(data.tests);
        } catch {
            // silent
        }
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                {/* Header card */}
                <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">
                        Tes Eksternal
                    </p>
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
                        Tes MBTI Devil.ai
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                        Gunakan tes MBTI dari Devil.ai sebagai data pendukung eksplorasi tipe. Hasil tes ini bersifat
                        estimasi dan bukan penentu absolut — gunakan bersama pertanyaan pembeda dan refleksi pengalaman nyata.
                    </p>
                </section>

                {/* Error banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            {...cardIn}
                            className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                        >
                            <XCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create section */}
                <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
                    <h3 className="font-semibold text-slate-950 dark:text-slate-100">Buat Tes Baru</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Buat tautan tes MBTI baru. Anda akan mengerjakan tes di situs Devil.ai, lalu kembali ke sini untuk mengecek hasilnya.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            id="btn-create-test"
                            onClick={handleCreateTest}
                            disabled={creatingTest}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creatingTest ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Membuat tautan tes...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Buat Tes MBTI
                                </>
                            )}
                        </button>
                    </div>

                    <AnimatePresence>
                        {latestCreated && (
                            <motion.div
                                {...cardIn}
                                className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-400/20 dark:bg-cyan-400/10"
                            >
                                <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                                    Tes berhasil dibuat!
                                </p>
                                <a
                                    href={latestCreated.testUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-white px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-400/30 dark:bg-white/5 dark:text-cyan-200 dark:hover:bg-white/10"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Buka Tes
                                </a>
                                <p className="mt-2 break-all text-xs text-cyan-700/70 dark:text-cyan-300/60">
                                    {latestCreated.testUrl}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Check section */}
                {activeTestId && (
                    <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
                        <h3 className="font-semibold text-slate-950 dark:text-slate-100">Cek Hasil</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Setelah menyelesaikan tes di Devil.ai, cek hasilnya di sini.
                        </p>
                        <div className="mt-4">
                            <button
                                id="btn-check-test"
                                onClick={() => handleCheckTest()}
                                disabled={checkingTest}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-cyan-300/45 dark:hover:text-cyan-200"
                            >
                                {checkingTest ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Mengecek hasil tes...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4" />
                                        Cek Hasil Tes
                                    </>
                                )}
                            </button>
                        </div>

                        <AnimatePresence>
                            {checkResult?.status === "pending" && (
                                <motion.div
                                    {...cardIn}
                                    className="mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
                                >
                                    <Clock className="h-4 w-4 shrink-0" />
                                    {checkResult.message || "Tes belum selesai dikerjakan."}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                )}

                {/* Completed result card */}
                <AnimatePresence>
                    {completedResult && (
                        <motion.section
                            {...cardIn}
                            className="rounded-lg border border-emerald-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-emerald-400/15 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <h3 className="font-semibold text-slate-950 dark:text-slate-100">Hasil Tes</h3>
                            </div>

                            {/* Prediction */}
                            {completedResult.prediction && (
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="grid h-16 w-16 place-items-center rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/20 to-violet-300/20 shadow-[0_0_32px_rgba(34,211,238,0.15)]">
                                        <span className="text-xl font-bold text-cyan-700 dark:text-cyan-200">
                                            {completedResult.prediction}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
                                            Prediksi MBTI
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                                            {completedResult.prediction}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Cognitive functions */}
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                {completedResult.traitOrderConscious && completedResult.traitOrderConscious.length > 0 && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                            Conscious Stack
                                        </p>
                                        <div className="space-y-2">
                                            {completedResult.traitOrderConscious.map((fn, i) => (
                                                <div key={fn} className="flex items-center justify-between gap-3">
                                                    <span className="text-xs text-slate-400">{CONSCIOUS_LABELS[i] ?? `#${i + 1}`}</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{fn}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {completedResult.traitOrderShadow && completedResult.traitOrderShadow.length > 0 && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                            Shadow Stack
                                        </p>
                                        <div className="space-y-2">
                                            {completedResult.traitOrderShadow.map((fn, i) => (
                                                <div key={fn} className="flex items-center justify-between gap-3">
                                                    <span className="text-xs text-slate-400">{SHADOW_LABELS[i] ?? `#${i + 1}`}</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{fn}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Matches */}
                            {completedResult.matches && completedResult.matches.length > 0 && (
                                <div className="mt-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Matches</p>
                                    <div className="flex flex-wrap gap-2">
                                        {completedResult.matches.map((match, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-700 dark:text-cyan-200"
                                            >
                                                {String(match)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Results page link */}
                            {completedResult.resultsPage && (
                                <a
                                    href={completedResult.resultsPage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-600 transition hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Lihat halaman hasil Devil.ai
                                </a>
                            )}

                            {/* Apply to profile */}
                            <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
                                <p className="mb-3 text-xs text-slate-500">
                                    Terapkan hasil prediksi sebagai MBTI di profil aktif. Hasil tetap bisa diedit di halaman profil.
                                </p>
                                <button
                                    id="btn-apply-mbti"
                                    onClick={handleApplyToProfile}
                                    disabled={applyingMbti || !!appliedMbti}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {applyingMbti ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Menerapkan...
                                        </>
                                    ) : appliedMbti ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            MBTI diterapkan
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="h-4 w-4" />
                                            Terapkan MBTI ke Profil
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* History section */}
                {tests.length > 0 && (
                    <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
                        <h3 className="font-semibold text-slate-950 dark:text-slate-100">Riwayat Tes</h3>
                        <div className="mt-4 space-y-3">
                            {tests.map((test) => (
                                <div
                                    key={test.id}
                                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-black/25"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={test.status} />
                                            {test.prediction && (
                                                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
                                                    {test.prediction}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {new Date(test.createdAt).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {test.status === "pending" && (
                                            <button
                                                onClick={() => handleCheckTest(test.testId)}
                                                disabled={checkingTest}
                                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:border-cyan-300/45 dark:hover:text-cyan-200"
                                            >
                                                Cek
                                            </button>
                                        )}
                                        {test.resultsPage && (
                                            <a
                                                href={test.resultsPage}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-cyan-300 hover:text-cyan-600 dark:border-white/10 dark:hover:border-cyan-300/45 dark:hover:text-cyan-300"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Right rail */}
            <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
                <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Status Profil</h2>
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                            <span className="text-sm text-slate-500">MBTI Saat Ini</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {displayMbti && displayMbti !== "unknown" ? displayMbti : "Belum diisi"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                            <span className="text-sm text-slate-500">Tes Terakhir</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {tests.length > 0
                                    ? tests[0].status === "completed"
                                        ? "Selesai"
                                        : "Menunggu"
                                    : "Belum ada"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-slate-500">Provider</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Devil.ai</span>
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Catatan</h2>
                    <div className="mt-4">
                        <p className="text-sm leading-6 text-slate-500">
                            Tes MBTI dari pihak ketiga bersifat estimasi. Gunakan hasilnya sebagai satu titik data di
                            antara refleksi diri, pertanyaan pembeda, dan diskusi — bukan sebagai penentu akhir.
                        </p>
                    </div>
                </section>
            </aside>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "completed") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Selesai
            </span>
        );
    }

    if (status === "failed") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-300">
                <XCircle className="h-3 w-3" />
                Gagal
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            Menunggu
        </span>
    );
}
