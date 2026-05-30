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
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    ShieldCheck,
    Sparkles,
    UserRoundCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AuthStatus from "@/components/AuthStatus";

type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    children?: { href: string; label: string }[];
};

const navItems: NavItem[] = [
    { href: "/", label: "Beranda", icon: Home },
    {
        label: "Tipologi",
        href: "/tipologi",
        icon: Layers3,
        children: [
            { href: "/tipologi", label: "Ringkasan" },
            { href: "/tipologi/mbti/tes", label: "Tes MBTI" },
        ],
    },
    { href: "/bangun-profil", label: "Bangun Profil", icon: UserRoundCog },
    { href: "/analisis", label: "Analisis", icon: BarChart3 },
    { href: "/validasi-profil", label: "Konsistensi Profil", icon: ShieldCheck },
    { href: "/karier", label: "Karier", icon: BriefcaseBusiness },
    { href: "/buku", label: "Buku", icon: BookOpen },
    { href: "/riwayat", label: "Riwayat", icon: Archive },
    { href: "/settings", label: "Pengaturan", icon: Settings },
];

function getActiveNavHref(pathname: string, items: { href: string }[]) {
    const normalizedPath = pathname.replace(/\/$/, "") || "/";

    // Filter out items with invalid href to prevent runtime errors
    const validItems = items.filter((item) => typeof item.href === "string" && item.href.length > 0);

    const matches = validItems
        .map((item) => ({
            href: item.href,
            normalizedHref: item.href.replace(/\/$/, "") || "/",
        }))
        .filter((item) => {
            if (item.normalizedHref === "/") {
                return normalizedPath === "/";
            }

            return normalizedPath === item.normalizedHref || normalizedPath.startsWith(`${item.normalizedHref}/`);
        })
        .sort((a, b) => b.normalizedHref.length - a.normalizedHref.length);

    return matches[0]?.href ?? null;
}

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
    "/validasi-profil": {
        title: "Konsistensi Profil",
        subtitle: "Periksa keselarasan profil terhadap data pendukung secara indikatif.",
        action: "Cek Konsistensi",
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
    "/tipologi/mbti/tes": {
        title: "Tes MBTI",
        subtitle: "Buat tes MBTI Devil.ai dan impor hasilnya sebagai data pendukung.",
        action: "Buat Tes",
    },
};

function resolvePageMeta(pathname: string) {
    if (pageMeta[pathname]) return pageMeta[pathname];
    // Match sub-routes like /tipologi/mbti/tes
    const segments = pathname.split("/").filter(Boolean);
    while (segments.length > 1) {
        segments.pop();
        const parent = "/" + segments.join("/");
        if (pageMeta[parent]) return pageMeta[parent];
    }
    return pageMeta["/"];
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const meta = resolvePageMeta(pathname);
    const activeHref = getActiveNavHref(
        pathname,
        navItems.flatMap((item) => [
            { href: item.href },
            ...(item.children?.filter((c) => c.href).map((c) => ({ href: c.href })) ?? []),
        ])
    );
    const { data: session, status } = useSession();
    const hasSessionUser = Boolean(session?.user);
    const [completeness, setCompleteness] = useState<number | null>(null);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarPreferenceLoaded, setSidebarPreferenceLoaded] = useState(false);

    useEffect(() => {
        Promise.resolve().then(() => {
            setSidebarCollapsed(window.localStorage.getItem("omnipsyche.sidebar.collapsed") === "true");
            setSidebarPreferenceLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (!sidebarPreferenceLoaded) return;
        window.localStorage.setItem("omnipsyche.sidebar.collapsed", String(sidebarCollapsed));
    }, [sidebarCollapsed, sidebarPreferenceLoaded]);

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            Promise.resolve().then(() => {
                setCompleteness(null);
                setHasProfile(null);
                setDashboardLoading(false);
                setDashboardError(null);
            });
            return;
        }

        const controller = new AbortController();

        Promise.resolve().then(() => {
            setDashboardLoading(true);
            setDashboardError(null);
        });

        fetch("/api/dashboard", { signal: controller.signal })
            .then(async (res) => {
                const data = await res.json();

                if (process.env.NODE_ENV === "development") {
                    console.log("Dashboard auth state:", {
                        sessionStatus: status,
                        dashboardLoading: false,
                        isAuthenticated: data?.isAuthenticated,
                        hasUser: hasSessionUser,
                    });
                }

                if (data?.isAuthenticated === true && data?.dashboardStatus === "ready") {
                    setCompleteness(data.profileCompleteness);
                    setHasProfile(!!data.latestProfile);
                    return;
                }

                setDashboardError(data?.dashboardError || data?.error || "Data dashboard belum dapat dimuat.");
            })
            .catch((err) => {
                if (err instanceof Error && err.name === "AbortError") return;
                console.error("Failed to load dashboard data in sidebar:", err);
                setDashboardError("Data dashboard belum dapat dimuat.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setDashboardLoading(false);
            });

        return () => controller.abort();
    }, [hasSessionUser, session?.user?.id, status, pathname]);

    return (
        <div className="h-screen overflow-hidden bg-slate-50 text-slate-950 selection:bg-cyan-400/30 selection:text-cyan-950 dark:bg-[#050608] dark:text-slate-100 dark:selection:text-cyan-100">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.10),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(124,58,237,0.08),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.02),transparent)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
            <div
                className={clsx(
                    "relative z-10 grid h-screen min-h-0 transition-[grid-template-columns] duration-300 ease-out",
                    sidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[280px_1fr]"
                )}
            >
                <aside
                    className={clsx(
                        "hidden h-screen min-h-0 border-r border-slate-200 bg-white/70 backdrop-blur-xl transition-[width] duration-300 ease-out dark:border-white/10 dark:bg-black/35 lg:flex lg:flex-col",
                        sidebarCollapsed ? "w-20" : "w-[280px]"
                    )}
                >
                    <div
                        className={clsx(
                            "flex shrink-0 items-center border-b border-slate-200 dark:border-white/10",
                            sidebarCollapsed ? "h-24 flex-col justify-center gap-3 px-3" : "h-20 gap-3 px-6"
                        )}
                    >
                        {sidebarCollapsed ? (
                            <div
                                className="grid h-11 w-11 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                                title="OmniPsyche"
                                role="img"
                                aria-label="OmniPsyche"
                            >
                                <Sparkles className="h-5 w-5 text-cyan-300" />
                            </div>
                        ) : (
                            <>
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
                                    <Sparkles className="h-5 w-5 text-cyan-300" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-lg font-semibold tracking-wide">OmniPsyche</p>
                                    <p className="truncate text-xs text-slate-500">Intelijensi Kepribadian</p>
                                </div>
                            </>
                        )}
                        <button
                            type="button"
                            aria-label={sidebarCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
                            onClick={() => setSidebarCollapsed((current) => !current)}
                            className={clsx(
                                "grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-300/45 hover:bg-cyan-50 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300/45 dark:border-white/10 dark:text-slate-400 dark:hover:border-cyan-300/30 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-100",
                                !sidebarCollapsed && "ml-auto"
                            )}
                        >
                            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                        </button>
                    </div>

                    <nav className={clsx("min-h-0 flex-1 space-y-1 overflow-y-auto py-5", sidebarCollapsed ? "px-3" : "px-3")}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = item.href === activeHref;
                            const hasChildren = !!item.children && item.children.length > 0;
                            return (
                                <div key={item.href}>
                                    <Link
                                        href={item.href}
                                        title={sidebarCollapsed ? item.label : undefined}
                                        aria-label={sidebarCollapsed ? item.label : undefined}
                                        className={clsx(
                                            "group flex items-center rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-300/45",
                                            sidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3",
                                            active
                                                ? "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-300/20"
                                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
                                        )}
                                    >
                                        <Icon className={clsx("h-4 w-4", active ? "text-cyan-600 dark:text-cyan-300" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300")} />
                                        {!sidebarCollapsed && (
                                            <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                                                {item.label}
                                            </span>
                                        )}
                                        {hasChildren && !sidebarCollapsed && (
                                            <span className="text-xs text-slate-500">▸</span>
                                        )}
                                    </Link>
                                    {!sidebarCollapsed && hasChildren && (
                                        <div className="ml-6 space-y-1 border-l border-white/10 pl-3">
                                            {item.children!.filter((c) => typeof c.href === "string" && c.href.length > 0).map((child) => {
                                                const childActive = child.href === activeHref;
                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        className={clsx(
                                                            "group flex items-center rounded-lg py-2 pl-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-300/45",
                                                            childActive
                                                                ? "bg-cyan-100 text-cyan-900 dark:bg-cyan-300/10 dark:text-cyan-100"
                                                                : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5"
                                                        )}
                                                    >
                                                        <span
                                                            className={clsx(
                                                                "text-xs",
                                                                childActive
                                                                    ? "text-cyan-600 dark:text-cyan-300"
                                                                    : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                                                            )}
                                                        >
                                                            {child.label}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {status === "authenticated" && (
                        <div className={clsx("shrink-0", sidebarCollapsed ? "m-3" : "m-4")}>
                            <div
                                className={clsx(
                                    "rounded-lg border border-slate-200 bg-slate-50 transition-all duration-200 dark:border-white/10 dark:bg-white/[0.04]",
                                    sidebarCollapsed ? "p-2" : "p-4"
                                )}
                            >
                                {sidebarCollapsed ? (
                                    <div
                                        className="grid h-10 w-full place-items-center rounded-md bg-cyan-300/10 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-300/25 dark:text-cyan-200"
                                        title={dashboardLoading ? "Memuat profil aktif" : dashboardError ? "Data profil belum tersedia" : `Profil aktif. Kelengkapan ${completeness ?? 0}%`}
                                        aria-label={dashboardLoading ? "Memuat profil aktif" : dashboardError ? "Data profil belum tersedia" : `Profil aktif. Kelengkapan ${completeness ?? 0}%`}
                                    >
                                        {dashboardLoading || dashboardError ? "..." : `${completeness ?? 0}%`}
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-xs text-slate-400">Profil Aktif</span>
                                            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-600 dark:text-emerald-300">Aktif</span>
                                        </div>
                                        <p className="font-medium text-slate-900 dark:text-slate-100">
                                            {dashboardLoading ? "Memuat profil..." : dashboardError ? "Data belum tersedia." : hasProfile ? "Profil Gabungan" : "Profil belum dibuat."}
                                        </p>
                                        <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all duration-500"
                                                style={{ width: `${dashboardLoading || dashboardError ? 0 : completeness ?? 0}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {dashboardLoading ? "Memuat kelengkapan..." : dashboardError ? dashboardError : `Kelengkapan ${completeness ?? 0}%`}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </aside>

                <div className="min-h-0 min-w-0 overflow-y-auto">
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
                                {status === "loading" ? "Memuat..." : status === "authenticated" ? "Profil Aktif" : "Mode Tamu"}
                            </div>
                            <AuthStatus />
                            <Link
                                    href={
                                        pathname === "/"
                                            ? "/bangun-profil"
                                            : meta.action === "Buat Tes"
                                                ? "/tipologi/mbti/tes"
                                                : pathname
                                    }
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
