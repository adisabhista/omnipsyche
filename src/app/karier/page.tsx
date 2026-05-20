import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getLatestUserAnalysis, getLatestUserProfile } from "@/lib/analysis-data";
import { auth } from "@/lib/auth";
import { QualityWarningList } from "@/components/QualityWarnings";
import { personalityAnalysisSchema } from "@/lib/personality-json-schema";
import { getProfileWarnings } from "@/lib/profile-consistency";
import { prisma } from "@/lib/prisma";
import { defaultSettings, type SettingsPayload } from "@/lib/settings-schema";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";

function readJsonArray(value: Prisma.JsonValue | null) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function serializeSettings(settings: {
    themeMode: string;
    displayName: string | null;
    birthYear: number | null;
    ageRange: string | null;
    gender: string | null;
    location: string | null;
    shortBio: string | null;
    educationLevel: string | null;
    fieldOfStudy: string | null;
    institution: string | null;
    graduationStatus: string | null;
    learningGoals: Prisma.JsonValue | null;
    currentStatus: string | null;
    currentRole: string | null;
    targetCareer: string | null;
    careerInterests: Prisma.JsonValue | null;
    preferredWorkStyle: string | null;
    hobbies: Prisma.JsonValue | null;
    interests: Prisma.JsonValue | null;
    favoriteTopics: Prisma.JsonValue | null;
    favoriteBookGenres: Prisma.JsonValue | null;
    skillsToImprove: Prisma.JsonValue | null;
    dislikedTopics: Prisma.JsonValue | null;
}): SettingsPayload {
    return {
        ...defaultSettings,
        ...settings,
        themeMode: settings.themeMode === "light" || settings.themeMode === "dark" || settings.themeMode === "system" ? settings.themeMode : "system",
        learningGoals: readJsonArray(settings.learningGoals),
        careerInterests: readJsonArray(settings.careerInterests),
        hobbies: readJsonArray(settings.hobbies),
        interests: readJsonArray(settings.interests),
        favoriteTopics: readJsonArray(settings.favoriteTopics),
        favoriteBookGenres: readJsonArray(settings.favoriteBookGenres),
        skillsToImprove: readJsonArray(settings.skillsToImprove),
        dislikedTopics: readJsonArray(settings.dislikedTopics),
    };
}

export default async function KarierPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return (
            <SurfaceCard title="Karier">
                <div className="py-10 text-center">
                    <p className="text-sm text-slate-400">Masuk terlebih dahulu untuk melihat rekomendasi karier.</p>
                    <Link href="/login" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                        Masuk
                    </Link>
                </div>
            </SurfaceCard>
        );
    }

    const [analysis, profile, settings] = await Promise.all([
        getLatestUserAnalysis(userId),
        getLatestUserProfile(userId),
        prisma.userSettings.findUnique({ where: { userId } }),
    ]);
    const careerWarnings = getProfileWarnings(profile, settings ? serializeSettings(settings) : defaultSettings)
        .filter((warning) => ["profile-riasec-missing", "settings-education-missing", "settings-career-goal-missing"].includes(warning.id));
    const parsed = personalityAnalysisSchema.safeParse(analysis?.parsedJson);

    if (!analysis) {
        return (
            <SurfaceCard title="Karier">
                <div className="py-10 text-center">
                    <p className="text-sm text-slate-400">Buat analisis terlebih dahulu untuk melihat rekomendasi karier.</p>
                    <Link href="/analisis" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                        Buat Analisis
                    </Link>
                </div>
            </SurfaceCard>
        );
    }

    if (!parsed.success) {
        return (
            <SurfaceCard title="Karier">
                <div className="py-10 text-center">
                    <p className="text-sm text-slate-400">Data karier belum tersedia pada analisis ini.</p>
                    <Link href="/analisis" className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                        Buat Analisis
                    </Link>
                </div>
            </SurfaceCard>
        );
    }

    const career = parsed.data.career;

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <SurfaceCard title="Rekomendasi Jurusan" eyebrow="Karier">
                    <div className="grid gap-4 md:grid-cols-2">
                        {career.recommended_majors.map((major) => (
                            <article key={major.name} className="rounded-lg border border-white/10 bg-black/25 p-4">
                                <h2 className="font-semibold text-slate-100">{major.name}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">{major.rationale}</p>
                            </article>
                        ))}
                    </div>
                </SurfaceCard>

                <SurfaceCard title="Jalur Karier">
                    <div className="grid gap-4 md:grid-cols-2">
                        {career.career_paths.map((path) => (
                            <article key={path.title} className="rounded-lg border border-white/10 bg-black/25 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="font-semibold text-slate-100">{path.title}</h2>
                                    <span className="rounded-full border border-cyan-300/25 px-2 py-1 text-[11px] uppercase text-cyan-300">
                                        {path.fit_score}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-500">{path.rationale}</p>
                            </article>
                        ))}
                    </div>
                </SurfaceCard>

                <SurfaceCard title="Lingkungan Kerja Ideal">
                    <div className="grid gap-3 md:grid-cols-2">
                        {career.ideal_environment.map((environment) => (
                            <div key={environment} className="rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-6 text-slate-300">
                                {environment}
                            </div>
                        ))}
                    </div>
                </SurfaceCard>
            </div>

            <RightRail>
                <SurfaceCard title="Sumber Data">
                    <StatusList
                        items={[
                            { label: "Analisis", value: "Terhubung" },
                            { label: "Profil", value: analysis.profile.name },
                            { label: "Model", value: analysis.model },
                        ]}
                    />
                </SurfaceCard>
                <SurfaceCard title="Catatan Data Karier">
                    <QualityWarningList warnings={careerWarnings} emptyMessage="Data karier terlihat cukup siap untuk rekomendasi." />
                </SurfaceCard>
                <SurfaceCard title="Catatan">
                    <p className="text-sm leading-6 text-slate-500">
                        Modul Karier membaca bagian karier dari analisis terbaru yang tersimpan.
                    </p>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}
