export default function Loading() {
    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-6">
                <section className="min-h-64 animate-pulse rounded-lg border border-slate-200 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.045]" />
                <section className="min-h-52 animate-pulse rounded-lg border border-slate-200 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.045]" />
            </div>
            <aside className="min-h-72 animate-pulse rounded-lg border border-slate-200 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.045]" />
        </div>
    );
}
