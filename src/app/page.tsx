import Link from "next/link";
import { ModuleCard, MetricCard, RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { OnboardingProgressCard } from "@/components/dashboard/OnboardingProgressCard";
import { getDashboardData } from "@/lib/dashboard-data";
import { createExcerpt } from "@/lib/analysis-format";

const isComplete = (val: unknown) => {
    if (val === null || val === undefined || val === "") return false;
    if (typeof val === "string" && val.toLowerCase() === "unknown") return false;
    return true;
};

const riskLabels: Record<string, string> = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
};

const confidenceLabels: Record<string, string> = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
};

export default async function Home() {
    const data = await getDashboardData();
    const isAuthenticated = data.isAuthenticated === true;
    const isGuest = data.isAuthenticated === false;
    const dashboardReady = data.dashboardStatus === "ready";
    const dashboardDegraded = data.dashboardStatus === "degraded";

    // Prepare modules with dynamic statuses if authenticated
    const dynamicModules = [
        { title: "Tipologi", description: "Eksplorasi MBTI, Enneagram, Big Five, RIASEC, dan kerangka lain sebagai lensa, bukan batasan.", status: "Eksplorasi" },
        {
            title: "Bangun Profil",
            description: "Alur modular untuk menyusun identitas, narasi, tipologi, sifat, dan minat karier.",
            status: dashboardReady ? `${data.profileCompleteness}%` : isAuthenticated ? "Belum tersedia" : "—"
        },
        { 
            title: "Analisis", 
            description: "Sintesis AI untuk membaca pola utama, kekuatan, blind spot, dan arah pertumbuhan.", 
            status: dashboardReady ? (data.analysisCount > 0 ? "Tersimpan" : "Siap") : isAuthenticated ? "Belum tersedia" : "Siap"
        },
        {
            title: "Konsistensi Profil",
            description: "Pemeriksaan indikatif untuk melihat keselarasan profil dengan data pendukung.",
            status: dashboardReady ? (data.latestProfileValidation ? "Tersimpan" : "Siap") : isAuthenticated ? "Belum tersedia" : "Siap",
        },
        { title: "Karier", description: "Pemetaan profil menjadi lingkungan kerja, peran, dan rekomendasi pengembangan.", status: "Baru" },
        { title: "Buku", description: "Rekomendasi bacaan berdasarkan kebutuhan belajar dan tema pertumbuhan profil.", status: "Baru" },
        { title: "Riwayat", description: "Jejak profil, analisis, dan wawasan agar perubahan personal dapat dibandingkan.", status: "Tersimpan" },
    ];

    // Build dynamic next steps
    const nextSteps: Array<{ label: string; value: string; variant?: "warning" | "success" | "muted" }> = [];
    if (isAuthenticated && dashboardReady) {
        if (!data.latestProfile) {
            nextSteps.push({ label: "Bangun Profil", value: "Perlu Diisi" });
        } else {
            if (!isComplete(data.latestProfile.mbti) || !isComplete(data.latestProfile.enneagramType)) {
                nextSteps.push({ label: "Tipologi Kepribadian", value: "Belum Lengkap" });
            }
            if (!isComplete(data.latestProfile.riasec)) {
                nextSteps.push({ label: "Minat RIASEC", value: "Perlu Diisi" });
            }
        }
        if (data.analysisCount === 0) {
            nextSteps.push({ label: "Analisis AI Pertama", value: "Siap Dibuat" });
        } else {
            nextSteps.push({ label: "Analisis AI Terbaru", value: "Selesai" });
            nextSteps.push({
                label: "Konsistensi Profil",
                value: data.latestProfileValidation ? "Selesai" : "Siap Dicek",
                variant: data.latestProfileValidation ? "success" : "warning",
            });
        }
    } else if (isGuest) {
        // Logged out static steps
        nextSteps.push(
            { label: "Narasi Diri", value: "Perlu Diisi" },
            { label: "Minat Karier", value: "Belum Lengkap" },
            { label: "Analisis Terbaru", value: "Siap Dibuat" }
        );
    } else {
        nextSteps.push({ label: "Data Dashboard", value: "Belum tersedia", variant: "warning" });
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-6">
                <section className="rounded-lg border border-cyan-300/20 bg-gradient-to-br from-cyan-300/[0.10] via-white/[0.045] to-violet-400/[0.10] p-6 md:p-8">
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">Platform Intelijensi Kepribadian</p>
                    <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Profil Gabungan sebagai pusat semua wawasan.</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                                Mulai dari profil dasar, lalu gunakan analisis dan konsistensi untuk mendapatkan rekomendasi yang lebih personal.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                {isAuthenticated ? (
                                    <>
                                        <Link href="/bangun-profil" className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                                            {data.latestProfile ? "Perbarui Profil" : "Bangun Profil"}
                                        </Link>
                                        <Link href="/analisis" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                                            Lihat Analisis
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                                            Masuk
                                        </Link>
                                        <Link href="/register" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                                            Daftar
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {isAuthenticated ? (
                                <>
                                    <MetricCard 
                                        label="Kelengkapan Profil" 
                                        value={dashboardReady ? `${data.profileCompleteness}%` : "..."}
                                        detail={dashboardReady ? (data.profileCompleteness === 0 ? "Profil belum dibuat." : "Identitas dan tipologi gabungan.") : "Data dashboard belum tersedia."}
                                    />
                                    <MetricCard 
                                        label="Wawasan Tersimpan" 
                                        value={dashboardReady ? String(data.analysisCount + data.narrativePredictionCount) : "..."}
                                        detail={dashboardReady ? "Analisis dan riwayat terintegrasi." : "Data dashboard belum tersedia."}
                                    />
                                    <MetricCard 
                                        label="Modul Tersedia" 
                                        value="7"
                                        detail="Modul platform siap digunakan." 
                                    />
                                </>
                            ) : (
                                <>
                                    <MetricCard 
                                        label="Status Pengguna" 
                                        value="Tamu" 
                                        detail="Masuk untuk merekam perkembangan diri." 
                                    />
                                    <MetricCard 
                                        label="Modul Tersedia" 
                                        value="7"
                                        detail="Sistem analisis kepribadian modular." 
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {dashboardDegraded && (
                    <SurfaceCard title="Dashboard Belum Tersedia">
                        <p className="text-sm leading-6 text-amber-200">
                            {data.dashboardError ?? "Data dashboard belum dapat dimuat. Coba lagi nanti."}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Kamu tetap masuk ke akun. Muat ulang halaman atau coba lagi nanti.
                        </p>
                    </SurfaceCard>
                )}

                {isAuthenticated && dashboardReady && <OnboardingProgressCard data={data} />}

                {isAuthenticated && dashboardReady ? (
                    <>
                        {data.latestAnalysis ? (
                            <SurfaceCard 
                                title="Insight Terbaru" 
                                eyebrow={`Terakhir diperbarui: ${new Date(data.latestAnalysis.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}
                            >
                                <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                                    {createExcerpt(data.latestAnalysis.markdown, 350)}
                                </p>
                                <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:gap-4">
                                    <span className="text-xs text-slate-500 font-mono">Model: {data.latestAnalysis.model}</span>
                                    <Link href="/analisis" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
                                        Lihat Analisis Lengkap &rarr;
                                    </Link>
                                </div>
                            </SurfaceCard>
                        ) : (
                            <SurfaceCard title="Analisis & Insight Kepribadian">
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-lg bg-black/20 border border-white/5">
                                    <p className="text-sm leading-6 text-slate-400">Insight akan muncul setelah kamu membuat analisis pertama.</p>
                                    <div className="mt-5">
                                        <Link href="/analisis" className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                                            Mulai Analisis Pertama
                                        </Link>
                                    </div>
                                </div>
                            </SurfaceCard>
                        )}
                    </>
                ) : isGuest ? (
                    <SurfaceCard title="Platform Intelijensi Kepribadian Modular">
                        <p className="text-sm leading-6 text-slate-400">
                            Selamat datang di OmniPsyche! Hubungkan berbagai dimensi diri Anda—dari tes tipologi formal seperti MBTI dan Enneagram, hingga minat karier, riwayat personal, dan preferensi bacaan Anda—ke dalam satu profil gabungan yang disintesis secara cerdas menggunakan AI.
                        </p>
                    </SurfaceCard>
                ) : null}

                <SurfaceCard title="Modul Platform" eyebrow="Ekosistem">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {dynamicModules.map((module) => (
                            <ModuleCard key={module.title} {...module} />
                        ))}
                    </div>
                </SurfaceCard>
            </div>

            <RightRail>
                {isAuthenticated && dashboardReady ? (
                    <>
                        <SurfaceCard title="Kelengkapan Profil">
                            <div className="h-2 rounded-full bg-white/10">
                                <div 
                                    className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all duration-500" 
                                    style={{ width: `${data.profileCompleteness}%` }} 
                                />
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                {data.profileCompleteness === 0
                                    ? "Mulai dengan mengisi info profil dasar Anda."
                                    : "Lengkapi narasi diri dan minat karier untuk meningkatkan kualitas sintesis."}
                            </p>
                        </SurfaceCard>
                        <SurfaceCard title="Konsistensi Profil">
                            {data.latestProfileValidation ? (
                                <>
                                    <StatusList
                                        items={[
                                            { label: "Skor", value: `${data.latestProfileValidation.score ?? 0}/100` },
                                            { label: "Risiko", value: riskLabels[data.latestProfileValidation.risk ?? ""] ?? "Belum Ada" },
                                            { label: "Keyakinan", value: confidenceLabels[data.latestProfileValidation.confidence ?? ""] ?? "Belum Ada" },
                                        ]}
                                    />
                                    <p className="mt-4 text-sm leading-6 text-slate-500">
                                        Pemeriksaan terakhir dibuat pada {new Date(data.latestProfileValidation.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.
                                    </p>
                                    <Link href="/validasi-profil" className="mt-4 inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                                        Lihat Konsistensi
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm leading-6 text-slate-500">Belum ada pemeriksaan konsistensi profil.</p>
                                    <Link href="/validasi-profil" className="mt-4 inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                                        Cek Konsistensi
                                    </Link>
                                </>
                            )}
                        </SurfaceCard>
                        <SurfaceCard title="Langkah Berikutnya">
                            <StatusList items={nextSteps} />
                        </SurfaceCard>
                        <SurfaceCard title="Riwayat Terakhir">
                            <p className="text-sm leading-6 text-slate-400">
                                {data.analysisCount > 0
                                    ? `Anda telah menyimpan ${data.analysisCount} analisis personal.`
                                    : "Belum ada analisis tersimpan."}
                            </p>
                        </SurfaceCard>
                    </>
                ) : isGuest ? (
                    <SurfaceCard title="Mulai Sekarang">
                        <p className="text-sm leading-6 text-slate-500 mb-4">
                            Mulai perjalanan eksplorasi kepribadian mendalam hari ini.
                        </p>
                        <Link href="/register" className="block text-center rounded-lg bg-cyan-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                            Daftar Gratis
                        </Link>
                    </SurfaceCard>
                ) : (
                    <SurfaceCard title="Status Akun">
                        <p className="text-sm leading-6 text-slate-500">
                            Akun aktif. Data ringkasan dashboard belum dapat dimuat.
                        </p>
                    </SurfaceCard>
                )}
            </RightRail>
        </div>
    );
}
