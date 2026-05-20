import Link from "next/link";
import { ModuleCard, MetricCard, RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { getDashboardData } from "@/lib/dashboard-data";
import ReactMarkdown from "react-markdown";

const isComplete = (val: unknown) => {
    if (val === null || val === undefined || val === "") return false;
    if (typeof val === "string" && val.toLowerCase() === "unknown") return false;
    return true;
};

const consistencyStatusLabels = {
    low_data: "Data belum lengkap",
    needs_review: "Perlu ditinjau",
    good: "Baik",
};

export default async function Home() {
    const data = await getDashboardData();

    // Prepare modules with dynamic statuses if authenticated
    const dynamicModules = [
        { title: "Tipologi", description: "Eksplorasi MBTI, Enneagram, Big Five, RIASEC, dan kerangka lain sebagai lensa, bukan batasan.", status: "Eksplorasi" },
        { 
            title: "Bangun Profil", 
            description: "Alur modular untuk menyusun identitas, narasi, tipologi, sifat, dan minat karier.", 
            status: data.isAuthenticated ? `${data.profileCompleteness}%` : "68%" 
        },
        { 
            title: "Analisis", 
            description: "Sintesis AI untuk membaca pola utama, kekuatan, blind spot, dan arah pertumbuhan.", 
            status: data.isAuthenticated ? (data.analysisCount > 0 ? "Tersimpan" : "Siap") : "Siap" 
        },
        { title: "Karier", description: "Pemetaan profil menjadi lingkungan kerja, peran, dan rekomendasi pengembangan.", status: "Baru" },
        { title: "Buku", description: "Rekomendasi bacaan berdasarkan kebutuhan belajar dan tema pertumbuhan profil.", status: "Baru" },
        { title: "Riwayat", description: "Jejak profil, analisis, dan wawasan agar perubahan personal dapat dibandingkan.", status: "Tersimpan" },
    ];

    // Build dynamic next steps
    const nextSteps = [];
    if (data.isAuthenticated) {
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
            nextSteps.push({ label: "Sintesis AI Pertama", value: "Siap Dibuat" });
        } else {
            nextSteps.push({ label: "Analisis AI Terbaru", value: "Selesai" });
        }
    } else {
        // Logged out static steps
        nextSteps.push(
            { label: "Narasi Diri", value: "Perlu Diisi" },
            { label: "Minat Karier", value: "Belum Lengkap" },
            { label: "Analisis Terbaru", value: "Siap Dibuat" }
        );
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
                                OmniPsyche menghubungkan tipologi, narasi diri, analisis AI, karier, buku, dan riwayat menjadi satu platform yang bisa terus diperluas.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                {data.isAuthenticated ? (
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
                            {data.isAuthenticated ? (
                                <>
                                    <MetricCard 
                                        label="Kelengkapan Profil" 
                                        value={`${data.profileCompleteness}%`} 
                                        detail={data.profileCompleteness === 0 ? "Profil belum dibuat." : "Identitas dan tipologi gabungan."} 
                                    />
                                    <MetricCard 
                                        label="Wawasan Tersimpan" 
                                        value={String(data.analysisCount + data.narrativePredictionCount)} 
                                        detail="Analisis dan riwayat terintegrasi." 
                                    />
                                    <MetricCard 
                                        label="Modul Tersedia" 
                                        value="6" 
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
                                        value="6" 
                                        detail="Sistem analisis kepribadian modular." 
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {data.isAuthenticated ? (
                    <>
                        {data.latestAnalysis ? (
                            <SurfaceCard 
                                title="Insight Terbaru" 
                                eyebrow={`Terakhir diperbarui: ${new Date(data.latestAnalysis.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}
                            >
                                <div className="prose prose-invert prose-cyan max-w-none text-slate-300 text-sm leading-7">
                                    <ReactMarkdown
                                        components={{
                                            h1: (props) => (
                                                <h3 className="text-xl font-bold text-cyan-300 mt-4 mb-2" {...props} />
                                            ),
                                            h2: (props) => (
                                                <h4 className="text-lg font-semibold text-cyan-300 mt-4 mb-2" {...props} />
                                            ),
                                            strong: (props) => (
                                                <strong className="text-purple-300 font-bold" {...props} />
                                            ),
                                            li: (props) => (
                                                <li className="text-slate-300 my-1 list-disc list-inside" {...props} />
                                            ),
                                            p: (props) => (
                                                <p className="text-slate-300 leading-relaxed mb-3" {...props} />
                                            ),
                                            hr: (props) => (
                                                <hr className="hidden border-none" {...props} />
                                            ),
                                        }}
                                    >
                                        {data.latestAnalysis.markdown.length > 350
                                            ? data.latestAnalysis.markdown.substring(0, 350) + "..."
                                            : data.latestAnalysis.markdown}
                                    </ReactMarkdown>
                                </div>
                                <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/5 pt-4">
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
                ) : (
                    <SurfaceCard title="Platform Intelijensi Kepribadian Modular">
                        <p className="text-sm leading-6 text-slate-400">
                            Selamat datang di OmniPsyche! Hubungkan berbagai dimensi diri Anda—dari tes tipologi formal seperti MBTI dan Enneagram, hingga minat karier, riwayat personal, dan preferensi bacaan Anda—ke dalam satu profil gabungan yang disintesis secara cerdas menggunakan AI.
                        </p>
                    </SurfaceCard>
                )}

                <SurfaceCard title="Modul Platform" eyebrow="Ekosistem">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {dynamicModules.map((module) => (
                            <ModuleCard key={module.title} {...module} />
                        ))}
                    </div>
                </SurfaceCard>
            </div>

            <RightRail>
                {data.isAuthenticated ? (
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
                            <StatusList
                                items={[
                                    { label: "Status", value: consistencyStatusLabels[data.consistencySummary.status] },
                                    { label: "Skor", value: `${data.consistencySummary.score}/100` },
                                    { label: "Catatan", value: `${data.consistencySummary.warningCount}` },
                                ]}
                            />
                            <p className="mt-4 text-sm leading-6 text-slate-500">{data.consistencySummary.topWarning}</p>
                            <Link href={data.consistencySummary.actionHref} className="mt-4 inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                                Lihat Detail
                            </Link>
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
                ) : (
                    <SurfaceCard title="Mulai Sekarang">
                        <p className="text-sm leading-6 text-slate-500 mb-4">
                            Mulai perjalanan eksplorasi kepribadian mendalam hari ini.
                        </p>
                        <Link href="/register" className="block text-center rounded-lg bg-cyan-300 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                            Daftar Gratis
                        </Link>
                    </SurfaceCard>
                )}
            </RightRail>
        </div>
    );
}
