"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json().catch(() => null);
        setIsLoading(false);

        if (!response.ok) {
            setError(data?.error || "Gagal membuat akun. Periksa konfigurasi server.");
            return;
        }

        router.push("/login?registered=1");
    }

    return (
        <main className="min-h-screen bg-[#050608] px-4 py-6 text-slate-100 sm:py-10">
            <div className="mx-auto max-w-md rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.32)] sm:p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">OmniPsyche</p>
                <h1 className="mt-3 text-2xl font-semibold">Buat akun OmniPsyche</h1>
                {error && <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-sm text-slate-400">Nama</span>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="field"
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-sm text-slate-400">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="field"
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-sm text-slate-400">Kata Sandi</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={8}
                            className="field"
                            required
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                        {isLoading ? "Memproses..." : "Daftar"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-400">
                    Sudah punya akun?{" "}
                    <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
                        Masuk
                    </Link>
                </p>
            </div>
        </main>
    );
}
