"use client";

import { Loader2 } from "lucide-react";
import { SurfaceCard } from "@/components/PlatformCards";
import { AnalysisResultPanel } from "@/components/analysis/analysis-result-panel";

interface AnalysisResultProps {
    markdown: string;
    isLoading: boolean;
}

export default function AnalysisResult({ markdown, isLoading }: AnalysisResultProps) {
    if (isLoading) {
        return (
            <SurfaceCard title="Menyusun Analisis" eyebrow="Sumber Wawasan">
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-700 dark:text-cyan-300" />
                    <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">Menyusun data psike...</p>
                    <p className="mt-2 text-xs text-slate-500">Menghubungkan profil dengan kerangka analisis.</p>
                </div>
            </SurfaceCard>
        );
    }

    if (!markdown) return null;

    return <AnalysisResultPanel analysis={{ markdown }} />;
}
