"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import {
    Archive,
    BarChart3,
    BookOpen,
    BriefcaseBusiness,
    Compass,
    Home,
    Layers3,
    Menu,
    Settings,
    Sparkles,
    UserRoundCog,
} from "lucide-react";
import AuthStatus from "@/components/AuthStatus";

const navItems = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/tipologi", label: "Tipologi", icon: Layers3 },
    { href: "/bangun-profil", label: "Bangun Profil", icon: UserRoundCog },
    { href: "/analisis", label: "Analisis", icon: BarChart3 },
    { href: "/karier", label: "Karier", icon: BriefcaseBusiness },
    { href: "/buku", label: "Buku", icon: BookOpen },
    { href: "/riwayat", label: "Riwayat", icon: Archive },
    { href: "/settings", label: "Pengaturan", icon: Settings },
];

const pageMeta: Record<string, { title: string; subtitle: string; action: string }> = {
    "/": {
        title: "Beranda",
        subtitle: "Pusat kendali profil, wawasan, dan modul OmniPsyche.",
        action: "Bangun Profil",
    },
    "/tipologi": {
        title: "Tipologi",
        subtitle: "Jelajahi kerangka kepribadian tanpa mengunci profil pada satu sistem.",
        action: "Hubungkan ke Profil",
    },
    "/bangun-profil": {
        title: "Bangun Profil",
        subtitle: "Susun profil gabungan melalui alur modular yang bisa diperluas.",
        action: "Simpan Draf",
    },
    "/analisis": {
        title: "Analisis",
        subtitle: "Sintesis AI untuk kekuatan, blind spot, dan arah pertumbuhan.",
        action: "Mulai Analisis",
    },
    "/karier": {
        title: "Karier",
        subtitle: "Terjemahkan profil menjadi arah karier dan kecocokan pekerjaan.",
        action: "Lihat Rekomendasi",
    },
    "/buku": {
        title: "Buku",
        subtitle: "Rekomendasi bacaan berdasarkan tema profil dan pertumbuhan.",
        action: "Simpan Bacaan",
    },
    "/riwayat": {
        title: "Riwayat",
        subtitle: "Lacak profil, analisis, dan wawasan yang tersimpan.",
        action: "Bandingkan",
    },
    "/settings": {
        title: "Pengaturan",
        subtitle: "Kelola preferensi aplikasi dan data personal.",
        action: "Simpan Pengaturan",
    },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const meta = pageMeta[pathname] ?? pageMeta["/"];
    const { status } = useSession();
    const [completeness, setCompleteness] = useState<number | null>(null);
    const [hasProfile, setHasProfile] = useState<boolean>(false);

    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/dashboard")
                .then((res) => res.json())
                .then((data) => {
                    if (data.isAuthenticated) {
                        setCompleteness(data.profileCompleteness);
                        setHasProfile(!!data.latestProfile);
                    }
                })
                .catch((err) => console.error("Failed to load dashboard data in sidebar:", err));
        } else {
            Promise.resolve().then(() => {
                setCompleteness(null);
                setHasProfile(false);
            });
        }
    }, [status, pathname]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950 selection:bg-cyan-400/30 selection:text-cyan-950 dark:bg-[#050608] dark:text-slate-100 dark:selection:text-cyan-100">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.10),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(124,58,237,0.08),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.02),transparent)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
            <div className="relative z-10 grid min-h-screen lg:grid-cols-[280px_1fr]">
                <aside className="hidden border-r border-slate-200 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-black/35 lg:flex lg:flex-col">
                    <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6 dark:border-white/10">
                        <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
                            <Sparkles className="h-5 w-5 text-cyan-300" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold tracking-wide">OmniPsyche</p>
                            <p className="text-xs text-slate-500">Intelijensi Kepribadian</p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 px-3 py-5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={clsx(
                                        "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition",
                                        active
                                            ? "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-300/20"
                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
                                    )}
                                >
                                    <Icon className={clsx("h-4 w-4", active ? "text-cyan-600 dark:text-cyan-300" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300")} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {status === "authenticated" && (
                        <div className="m-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Profil Aktif</span>
                                <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300">Aktif</span>
                            </div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                                {hasProfile ? "Profil Gabungan" : "Profil belum dibuat."}
                            </p>
                            <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                                <div 
                                    className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all duration-500" 
                                    style={{ width: `${completeness ?? 0}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Kelengkapan {completeness ?? 0}%</p>
                        </div>
                    )}
                </aside>

                <div className="min-w-0">
                    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#050608]/85">
                        <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 md:px-8">
                            <div className="flex min-w-0 items-center gap-3">
                                <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-300 lg:hidden">
                                    <Menu className="h-5 w-5" />
                                </button>
                                <div className="min-w-0">
                                    <h1 className="truncate text-xl font-semibold md:text-2xl">{meta.title}</h1>
                                    <p className="mt-1 hidden truncate text-sm text-slate-500 sm:block">{meta.subtitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 md:flex">
                                <Compass className="h-4 w-4 text-cyan-300" />
                                Profil Aktif
                            </div>
                            <AuthStatus />
                            <Link
                                    href={pathname === "/" ? "/bangun-profil" : pathname}
                                    className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                                >
                                    {meta.action}
                                </Link>
                            </div>
                        </div>
                    </header>
                    <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
                </div>
            </div>
        </div>
    );
}
