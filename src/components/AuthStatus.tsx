"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function AuthStatus() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="hidden rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-500 md:block">
                Memuat...
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex items-center gap-2">
                <Link
                    href="/login"
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                    Masuk
                </Link>
                <Link
                    href="/register"
                    className="rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                    Daftar
                </Link>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="hidden rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-500 md:block">
                Memuat...
            </div>
        );
    }

    const displayName = session.user?.name || session.user?.email;

    return (
        <div className="flex items-center gap-2">
            {displayName && (
                <span className="hidden max-w-40 truncate rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 md:block">
                    {displayName}
                </span>
            )}
            <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
                Keluar
            </button>
        </div>
    );
}
