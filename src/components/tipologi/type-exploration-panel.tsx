"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { TypologyType } from "@/data/typology-frameworks";
import type { TipologiExploreResponse } from "@/lib/tipologi-explore-schema";

export default function TypeExplorationPanel({ type }: { type: TypologyType }) {
    const [userText, setUserText] = useState("");
    const [result, setResult] = useState<TipologiExploreResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function exploreType() {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/tipologi/explore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system: type.system,
                    typeCode: type.code,
                    typeName: type.name,
                    description: type.description,
                    mistypeWith: type.mistypeWith,
                    userText,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Eksplorasi tipe gagal dibuat.");
            }

            setResult(data);
        } catch (exploreError) {
            setError(exploreError instanceof Error ? exploreError.message : "Eksplorasi tipe gagal dibuat.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10">
                    <Sparkles className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">Eksplorasi AI</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">Eksplorasi Tipe Ini</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Gunakan ini untuk membedakan kecocokan nyata dari kemiripan permukaan. Hasilnya bukan konfirmasi tipe final.
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                <label htmlFor="type-exploration-context" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Konteks pribadi
                </label>
                <textarea
                    id="type-exploration-context"
                    className="min-h-32 w-full rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-300/15 dark:border-white/10 dark:bg-black/30 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-cyan-300/60"
                    placeholder="Ceritakan kenapa kamu merasa cocok dengan tipe ini..."
                    value={userText}
                    onChange={(event) => setUserText(event.target.value)}
                />
                <button
                    type="button"
                    onClick={exploreType}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {loading ? "Menganalisis pola pembeda..." : "Eksplorasi Tipe Ini"}
                </button>
            </div>

            {error && (
                <div className="mt-4 rounded-lg border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{result.response}</p>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pertanyaan pembeda</p>
                            <ul className="mt-2 divide-y divide-slate-200 text-sm text-slate-600 dark:divide-white/10 dark:text-slate-400">
                                {result.questions.map((question) => (
                                    <li key={question} className="py-2 first:pt-0 last:pb-0">{question}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Fokus pembeda</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {result.distinction_focus.length > 0 ? result.distinction_focus.map((focus) => (
                                    <span key={focus} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-700 dark:text-cyan-200">
                                        {focus}
                                    </span>
                                )) : (
                                    <span className="text-sm text-slate-500">Belum ada fokus tambahan.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {result.warnings.length > 0 && (
                        <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">Catatan</p>
                            <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-100">
                                {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
