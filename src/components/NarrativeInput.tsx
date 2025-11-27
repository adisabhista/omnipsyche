"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { UserProfile } from "@/types/personality";

interface NarrativeInputProps {
    onApplyProfile: (profileUpdates: Partial<UserProfile>) => void;
}

export default function NarrativeInput({ onApplyProfile }: NarrativeInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [prediction, setPrediction] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setPrediction(null);

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
                console.error("Prediction failed:", data.error);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (!prediction) return;

        const updates: Partial<UserProfile> = {};
        const p = prediction.predictions;

        if (p.mbti?.type && p.mbti.type !== "unknown") updates.mbti = p.mbti.type.split(" ")[0] as any; // Handle potential extra text
        if (p.enneagram?.type && p.enneagram.type !== "unknown") {
            // Simple parsing logic, might need refinement based on exact API output
            const typeStr = p.enneagram.type.toString();
            const type = parseInt(typeStr.charAt(0));
            const wing = typeStr.includes("w") ? parseInt(typeStr.split("w")[1]) : "unknown";
            updates.enneagram = {
                type: isNaN(type) ? "unknown" : type as any,
                wing: isNaN(wing as number) ? "unknown" : wing as any,
                tritype: p.tritype?.type || ""
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
        <div className="w-full max-w-3xl mx-auto mb-8">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-3 group"
                >
                    <BookOpen className="w-5 h-5 text-purple-400 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-gray-300 font-mono group-hover:text-white">Open Narrative Mirror (Auto-Fill from Text)</span>
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#0a0a0a] border border-purple-500/30 rounded-2xl p-6 overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            Narrative Mirror
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white text-sm">Close</button>
                    </div>

                    <p className="text-sm text-gray-400 mb-4">
                        Paste a journal entry, bio, or creative writing. The AI will analyze your psycholinguistics to hypothesize your personality type.
                    </p>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none transition-colors mb-4 resize-none"
                        placeholder="I often find myself thinking about..."
                    />

                    <div className="flex justify-end gap-3">
                        {prediction ? (
                            <button
                                onClick={handleApply}
                                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Apply to Profile
                            </button>
                        ) : (
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading || !text.trim()}
                                className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors ${isLoading || !text.trim() ? "bg-gray-800 text-gray-500" : "bg-purple-600 hover:bg-purple-500 text-white"}`}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isLoading ? "Analyzing..." : "Analyze Text"}
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {prediction && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl"
                            >
                                <h4 className="text-sm font-bold text-purple-300 mb-2">Analysis Summary</h4>
                                <p className="text-xs text-gray-300 italic mb-4">{prediction.analysis_summary}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.entries(prediction.predictions).map(([key, val]: [string, any]) => (
                                        <div key={key} className="bg-black/40 p-2 rounded border border-white/5">
                                            <span className="block text-[10px] uppercase text-gray-500">{key.replace("_", " ")}</span>
                                            <span className="block text-sm font-mono text-cyan-400">{val.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
