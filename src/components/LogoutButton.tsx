"use client";

import { signOut, useSession } from "next-auth/react";

export default function LogoutButton() {
    const { status } = useSession();

    if (status !== "authenticated") {
        return null;
    }

    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
            Keluar
        </button>
    );
}
