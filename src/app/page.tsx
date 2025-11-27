"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types/personality";
import AnalysisResult from "@/components/AnalysisResult";
import { MBTI_TYPES, ENNEAGRAM_TYPES, INSTINCTUAL_VARIANTS, TEMPERAMENTS, SOCIONICS_TYPES, ATTITUDINAL_PSYCHE_TYPES } from "@/data/frameworks";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Activity, Fingerprint, Layers, Zap, Hexagon, User, X } from "lucide-react";
import clsx from "clsx";

import NarrativeInput from "@/components/NarrativeInput";

export default function Home() {
    const [name, setName] = useState("");
    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        mbti: "unknown",
        enneagram: { type: "unknown" as any, wing: "unknown" as any, tritype: "" },
        attitudinalPsyche: "unknown",
        instinctualVariant: "unknown",
        socionics: "unknown",
        temperament: "unknown",
        riasec: "",
        bigFive: "unknown",
    });
    const [analysis, setAnalysis] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError("");
        try {
            console.log("Initiating analysis...");
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile: { ...profile, name } }),
            });

            console.log("Response status:", res.status);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to analyze profile");
            }

            if (data.markdown) {
                setAnalysis(data.markdown);
            } else {
                throw new Error("No analysis data received");
            }
        } catch (err: any) {
            console.error("Analysis error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = (key: keyof UserProfile, value: any) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    };

    const handleNarrativeUpdate = (updates: Partial<UserProfile>) => {
        setProfile((prev) => ({ ...prev, ...updates }));
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden pb-20">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
                <header className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">System Online</span>
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 mb-4">
                        OMNIPSYCHE
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Manual Input Interface. Configure your psychological profile for synthesis.
                    </p>
                </header>

                <NarrativeInput onApplyProfile={handleNarrativeUpdate} />

                <div className="space-y-8">
                    {/* Identity */}
                    <Section title="Identity" icon={<User className="text-cyan-400" />}>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Subject Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                placeholder="Enter your name..."
                            />
                        </div>
                    </Section>

                    {/* MBTI */}
                    <Section title="MBTI (Myers-Briggs)" icon={<Brain className="text-blue-400" />}>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Type</label>
                            <select
                                value={profile.mbti}
                                onChange={(e) => updateProfile("mbti", e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                            >
                                {MBTI_TYPES.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                {MBTI_TYPES.find(t => t.id === profile.mbti)?.description}
                            </p>
                        </div>
                    </Section>

                    {/* Enneagram */}
                    <Section title="Enneagram" icon={<Hexagon className="text-purple-400" />}>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Core Type</label>
                                <select
                                    value={profile.enneagram.type}
                                    onChange={(e) => updateProfile("enneagram", { ...profile.enneagram, type: e.target.value === "unknown" ? "unknown" : parseInt(e.target.value) })}
                                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                >
                                    {ENNEAGRAM_TYPES.map((t) => (
                                        <option key={t.id} value={t.id}>{t.id === "unknown" ? "Unknown" : t.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Wing</label>
                                <select
                                    value={profile.enneagram.wing}
                                    onChange={(e) => updateProfile("enneagram", { ...profile.enneagram, wing: e.target.value === "unknown" ? "unknown" : parseInt(e.target.value) })}
                                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                >
                                    <option value="unknown">Unknown</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Tritype</label>
                                <input
                                    type="text"
                                    value={profile.enneagram.tritype}
                                    onChange={(e) => updateProfile("enneagram", { ...profile.enneagram, tritype: e.target.value })}
                                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                    placeholder="e.g. 5-4-8"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                            {ENNEAGRAM_TYPES.find(t => t.id === profile.enneagram.type)?.description}
                        </p>
                    </Section>

                    {/* Socionics */}
                    <Section title="Socionics" icon={<Layers className="text-green-400" />}>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Type</label>
                            <select
                                value={profile.socionics}
                                onChange={(e) => updateProfile("socionics", e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                            >
                                {SOCIONICS_TYPES.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                {SOCIONICS_TYPES.find(t => t.id === profile.socionics)?.description}
                            </p>
                        </div>
                    </Section>

                    {/* Instinctual Variant */}
                    <Section title="Instinctual Variant" icon={<Fingerprint className="text-orange-400" />}>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Stacking</label>
                            <select
                                value={profile.instinctualVariant}
                                onChange={(e) => updateProfile("instinctualVariant", e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                            >
                                {INSTINCTUAL_VARIANTS.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                {INSTINCTUAL_VARIANTS.find(t => t.id === profile.instinctualVariant)?.description}
                            </p>
                        </div>
                    </Section>

                    {/* Temperament */}
                    <Section title="Temperament" icon={<Sparkles className="text-pink-400" />}>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Primary</label>
                            <select
                                value={profile.temperament}
                                onChange={(e) => updateProfile("temperament", e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                            >
                                {TEMPERAMENTS.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                {TEMPERAMENTS.find(t => t.id === profile.temperament)?.description}
                            </p>
                        </div>
                    </Section>

                    {/* Big Five (OCEAN) */}
                    <Section
                        title="Big Five (OCEAN)"
                        icon={<Activity className="text-yellow-400" />}
                        action={
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 uppercase font-mono">{profile.bigFive === "unknown" ? "OFF" : "ON"}</span>
                                <button
                                    onClick={() => {
                                        if (profile.bigFive === "unknown") {
                                            updateProfile("bigFive", { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 });
                                        } else {
                                            updateProfile("bigFive", "unknown");
                                        }
                                    }}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${profile.bigFive === "unknown" ? "bg-gray-700" : "bg-cyan-500"}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${profile.bigFive === "unknown" ? "left-1" : "left-6"}`} />
                                </button>
                            </div>
                        }
                    >
                        {profile.bigFive === "unknown" ? (
                            <div className="text-center py-8 text-gray-500 italic">
                                Big Five data excluded from synthesis.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(profile.bigFive).map(([key, value]) => (
                                    <div key={key}>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-xs uppercase font-mono text-gray-400">{key}</label>
                                            <span className="text-xs font-mono text-cyan-400">{value}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={value}
                                            onChange={(e) => updateProfile("bigFive", { ...(profile.bigFive as any), [key]: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Other Inputs (Simplified) */}
                    <Section title="Additional Metrics" icon={<Zap className="text-red-400" />}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Attitudinal Psyche</label>
                                <select
                                    value={profile.attitudinalPsyche}
                                    onChange={(e) => updateProfile("attitudinalPsyche", e.target.value)}
                                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                >
                                    {ATTITUDINAL_PSYCHE_TYPES.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                    {ATTITUDINAL_PSYCHE_TYPES.find(t => t.id === profile.attitudinalPsyche)?.description}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">RIASEC</label>
                                <input
                                    type="text"
                                    value={profile.riasec}
                                    onChange={(e) => updateProfile("riasec", e.target.value)}
                                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                    placeholder="e.g. R-I-A"
                                />
                            </div>
                        </div>
                    </Section>

                    {error && (
                        <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !name}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.3)]",
                            isLoading || !name
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                        )}
                    >
                        <Brain className="w-5 h-5" />
                        {isLoading ? "SYNTHESIZING..." : !name ? "ENTER NAME TO INITIATE" : "INITIATE GRAND SYNTHESIS"}
                    </button>

                </div>

                {/* Analysis Modal */}
                <AnimatePresence>
                    {analysis && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                            >
                                <div className="p-6 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-cyan-400" />
                                        <h2 className="text-xl font-bold text-white tracking-wide">GRAND SYNTHESIS COMPLETE</h2>
                                    </div>
                                    <button
                                        onClick={() => setAnalysis("")}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-8 overflow-y-auto custom-scrollbar">
                                    <AnalysisResult markdown={analysis} isLoading={false} />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

function Section({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    {icon}
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}
