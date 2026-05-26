import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CheckCircle2, CircleDot, CircleEllipsis, LockKeyhole } from "lucide-react";

type StepStatus = "completed" | "current" | "locked" | "optional";

type DashboardSnapshot = {
    isAuthenticated: boolean;
    profileCompleteness: number;
    analysisCount: number;
    latestProfile: unknown | null;
    latestAnalysis: unknown | null;
    latestProfileValidation: unknown | null;
};

type JourneyStep = {
    key: string;
    title: string;
    description: string;
    cta: string;
    href: string;
    status: StepStatus;
};

const statusLabels: Record<StepStatus, string> = {
    completed: "Selesai",
    current: "Langkah Berikutnya",
    locked: "Terkunci",
    optional: "Opsional",
};

function buildSteps(data: DashboardSnapshot): JourneyStep[] {
    const profileCompleted = data.isAuthenticated && !!data.latestProfile && data.profileCompleteness > 0;
    const analysisCompleted = data.isAuthenticated && (data.analysisCount > 0 || !!data.latestAnalysis);
    const consistencyCompleted = data.isAuthenticated && !!data.latestProfileValidation;

    return [
        {
            key: "profile",
            title: "Bangun Profil",
            description: "Isi identitas, tipologi, narasi diri, dan minat dasar.",
            cta: "Bangun Profil",
            href: "/bangun-profil",
            status: profileCompleted ? "completed" : "current",
        },
        {
            key: "mbti",
            title: "Tes MBTI",
            description: "Ambil tes Devil.ai sebagai data pendukung opsional.",
            cta: "Mulai Tes MBTI",
            href: "/tipologi/mbti/tes",
            status: "optional",
        },
        {
            key: "analysis",
            title: "Analisis AI",
            description: "Gabungkan data profil menjadi insight terstruktur.",
            cta: "Buat Analisis",
            href: "/analisis",
            status: analysisCompleted ? "completed" : profileCompleted ? "current" : "locked",
        },
        {
            key: "consistency",
            title: "Konsistensi Profil",
            description: "Cek apakah data profil, tes, dan analisis saling selaras.",
            cta: "Cek Konsistensi",
            href: "/validasi-profil",
            status: consistencyCompleted ? "completed" : analysisCompleted ? "current" : "locked",
        },
        {
            key: "recommendations",
            title: "Rekomendasi",
            description: "Lihat rekomendasi karier dan buku dari profilmu.",
            cta: "Lihat Rekomendasi",
            href: "/buku",
            status: analysisCompleted && consistencyCompleted ? "current" : analysisCompleted ? "optional" : "locked",
        },
    ];
}

function StepIcon({ status }: { status: StepStatus }) {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />;
    if (status === "current") return <CircleDot className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />;
    if (status === "locked") return <LockKeyhole className="h-4 w-4 text-slate-400" />;
    return <CircleEllipsis className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
}

export function OnboardingProgressCard({ data }: { data: DashboardSnapshot }) {
    const steps = buildSteps(data);
    const completedCount = steps.filter((step) => step.status === "completed").length;
    const currentStep = steps.find((step) => step.status === "current") ?? steps.find((step) => step.status === "optional");
    const progress = Math.round((completedCount / steps.length) * 100);

    return (
        <section className="rounded-lg border border-cyan-300/25 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-cyan-300/15 dark:bg-white/[0.055] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">Langkah Berikutnya</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
                        {currentStep ? currentStep.title : "Journey profil sudah rapi"}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {currentStep
                            ? currentStep.description
                            : "Profil, analisis, dan pemeriksaan konsistensi sudah tersedia. Lanjutkan dengan rekomendasi personal."}
                    </p>
                </div>
                {currentStep && currentStep.status !== "locked" && (
                    <Link
                        href={currentStep.href}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                        {currentStep.cta}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                )}
            </div>

            <div className="mt-5">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-500">Progress journey</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{completedCount}/{steps.length} selesai</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-5">
                {steps.map((step) => {
                    const interactive = step.status !== "locked";
                    return (
                        <Link
                            key={step.key}
                            href={interactive ? step.href : "#"}
                            aria-disabled={!interactive}
                            className={clsx(
                                "rounded-lg border p-4 transition",
                                step.status === "completed" && "border-emerald-300/25 bg-emerald-50 text-emerald-950 dark:bg-emerald-300/[0.06] dark:text-emerald-100",
                                step.status === "current" && "border-cyan-300/45 bg-cyan-50 text-cyan-950 ring-1 ring-cyan-300/20 dark:bg-cyan-300/[0.08] dark:text-cyan-100",
                                step.status === "optional" && "border-slate-200 bg-slate-50 text-slate-900 hover:border-cyan-300/40 dark:border-white/10 dark:bg-black/20 dark:text-slate-200",
                                step.status === "locked" && "pointer-events-none border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-black/15 dark:text-slate-500"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <StepIcon status={step.status} />
                                <span className="rounded-full border border-current/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] opacity-80">
                                    {statusLabels[step.status]}
                                </span>
                            </div>
                            <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                            <p className="mt-2 text-xs leading-5 opacity-75">{step.description}</p>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
