"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Loader2, CheckCircle2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Enneagram, MBTI, UserProfile } from "@/types/personality";
import { ActionButton, DarkTextarea, InfoPill, ProfileFormSection } from "@/components/ProfileFormPrimitives";

interface NarrativeInputProps {
    onApplyProfile: (profileUpdates: Partial<UserProfile>) => void;
}

interface TypePrediction {
    type?: string;
    reasoning?: string;
}

interface NarrativePrediction {
    analysis_summary?: string;
    predictions: {
        mbti?: TypePrediction;
        enneagram?: TypePrediction;
        instinctual_variant?: TypePrediction;
        tritype?: TypePrediction;
        socionics?: TypePrediction;
        attitudinal_psyche?: TypePrediction;
        temperament?: TypePrediction;
        riasec?: TypePrediction;
    };
}

const MBTI_PATTERN = /^(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP)$/;

export default function NarrativeInput({ onApplyProfile }: NarrativeInputProps) {
    const { status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [prediction, setPrediction] = useState<NarrativePrediction | null>(null);
    const [error, setError] = useState("");

    const handleAnalyze = async () => {
        if (!text.trim()) return;

        if (status !== "authenticated") {
            setError("Masuk terlebih dahulu untuk menyimpan hasil analisis.");
            return;
        }

        setIsLoading(true);
        setPrediction(null);
        setError("");

        try {
            const res = await fetch("/api/predict-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            const data = await res.json();
            if (res.ok) {
                setPrediction(data);
            } else {
                setError(data.error || "Analisis teks gagal.");
                console.error("Prediction failed:", data.error);
            }
        } catch (error) {
            setError("Analisis teks gagal.");
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (!prediction) return;

        const updates: Partial<UserProfile> = {};
        const p = prediction.predictions;

        const mbtiType = p.mbti?.type?.split(" ")[0];
        if (mbtiType && MBTI_PATTERN.test(mbtiType)) updates.mbti = mbtiType as MBTI; // Handle potential extra text
        if (p.enneagram?.type && p.enneagram.type !== "unknown") {
            // Simple parsing logic, might need refinement based on exact API output
            const typeStr = p.enneagram.type.toString();
            const type = parseInt(typeStr.charAt(0));
            const wing = typeStr.includes("w") ? parseInt(typeStr.split("w")[1]) : "unknown";
            const parsedEnneagram: Enneagram = {
                type: Number.isNaN(type) ? "unknown" : type,
                wing: typeof wing === "number" && !Number.isNaN(wing) ? wing : "unknown",
                tritype: p.tritype?.type || ""
            };
            updates.enneagram = {
                ...parsedEnneagram,
            };
        }
        if (p.socionics?.type) updates.socionics = p.socionics.type;
        if (p.attitudinal_psyche?.type) updates.attitudinalPsyche = p.attitudinal_psyche.type;
        if (p.instinctual_variant?.type) updates.instinctualVariant = p.instinctual_variant.type;
        if (p.temperament?.type) updates.temperament = p.temperament.type;
        if (p.riasec?.type) updates.riasec = p.riasec.type;

        onApplyProfile(updates);
        setIsOpen(false);
        setPrediction(null);
        setText("");
    };

    return (
        <div className="w-full">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white/80 p-5 text-left transition hover:border-cyan-400/45 hover:bg-cyan-50 dark:border-white/10 dark:bg-black/25 dark:hover:bg-cyan-300/[0.04]"
                >
                    <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-300/10 text-cyan-600 dark:text-cyan-300">
                            <BookOpen className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">Narasi Pribadi</span>
                            <span className="mt-1 block font-semibold text-slate-950 dark:text-slate-100">Buka Cermin Narasi</span>
                            <span className="mt-1 block text-sm leading-6 text-slate-500">Tempel tulisan reflektif untuk membantu memperkirakan elemen profil.</span>
                        </span>
                    </span>
                    <InfoPill>AI</InfoPill>
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <ProfileFormSection
                        eyebrow="Narasi Pribadi"
                        title="Cermin Narasi"
                        description="Tempel jurnal, bio, atau tulisan reflektif. AI akan membaca pola bahasa untuk memperkirakan elemen profil."
                        icon={<Sparkles className="h-4 w-4" />}
                        action={
                            <button onClick={() => setIsOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100" aria-label="Tutup cermin narasi">
                                <X className="h-4 w-4" />
                            </button>
                        }
                    >
                        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Ruang Refleksi</p>
                            <DarkTextarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Saya sering memperhatikan bahwa..."
                            />
                            <p className="mt-2 text-xs leading-5 text-slate-500">Gunakan contoh konkret tentang keputusan, konflik, rutinitas, atau cara bekerja.</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            {prediction ? (
                                <ActionButton onClick={handleApply} variant="success">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Terapkan ke Profil
                                </ActionButton>
                            ) : (
                                <ActionButton onClick={handleAnalyze} disabled={isLoading || !text.trim()} variant="primary">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {isLoading ? "Menganalisis..." : "Analisis Teks"}
                                </ActionButton>
                            )}
                        </div>

                        {error && (
                            <p className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-700 dark:text-red-200">
                                {error}
                            </p>
                        )}

                        <AnimatePresence>
                            {prediction && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-lg border border-cyan-400/20 bg-cyan-300/[0.04] p-4"
                                >
                                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">Ringkasan Analisis</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{prediction.analysis_summary}</p>

                                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                        {Object.entries(prediction.predictions).map(([key, val]) => (
                                            <div key={key} className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-black/25">
                                                <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">{key.replace("_", " ")}</span>
                                                <span className="mt-1 block text-sm font-semibold text-cyan-700 dark:text-cyan-200">{val?.type || "Belum ada"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </ProfileFormSection>
                </motion.div>
            )}
        </div>
    );
}
