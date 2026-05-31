"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setIsLoading(false);

        if (result?.error) {
            setError("Email atau kata sandi salah.");
            return;
        }

        router.replace("/");
        router.refresh();
    }

    return (
        <main className="min-h-screen bg-[#050608] px-4 py-10 text-slate-100">
            <div className="mx-auto max-w-md rounded-lg border border-white/10 bg-white/[0.045] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">OmniPsyche</p>
                <h1 className="mt-3 text-2xl font-semibold">Masuk ke OmniPsyche</h1>
                {error && <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                            className="field"
                            required
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                        {isLoading ? "Memproses..." : "Masuk"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-400">
                    Belum punya akun?{" "}
                    <Link href="/register" className="font-medium text-cyan-300 hover:text-cyan-200">
                        Daftar
                    </Link>
                </p>
            </div>
        </main>
    );
}
