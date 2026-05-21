import clsx from "clsx";

export function SurfaceCard({
    title,
    eyebrow,
    children,
    className,
}: {
    title: string;
    eyebrow?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={clsx("rounded-lg border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_20px_70px_rgba(0,0,0,0.22)]", className)}>
            {eyebrow && <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">{eyebrow}</p>}
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
            <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
        </div>
    );
}

export function ModuleCard({
    title,
    description,
    status,
}: {
    title: string;
    description: string;
    status: string;
}) {
    return (
        <div className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-400/45 hover:bg-cyan-50 dark:border-white/10 dark:bg-black/20 dark:hover:border-cyan-300/35 dark:hover:bg-cyan-300/[0.04]">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
                <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">{status}</span>
            </div>
            <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
    );
}

export function RightRail({ children }: { children: React.ReactNode }) {
    return <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">{children}</aside>;
}

type StatusVariant = "warning" | "success" | "muted";

export function StatusList({ items }: { items: Array<{ label: string; value: string; variant?: StatusVariant }> }) {
    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <StatusBadge value={item.value} variant={item.variant} />
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ value, variant }: { value: string; variant?: StatusVariant }) {
    if (variant === "warning" || value === "Perlu Diisi") {
        return (
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                {value}
            </span>
        );
    }
    if (variant === "success" || value === "Selesai" || value === "Siap Dibuat") {
        return (
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                {value}
            </span>
        );
    }
    if (variant === "muted") {
        return (
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400">
                {value}
            </span>
        );
    }
    return (
        <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-2.5 py-1 text-xs font-medium text-orange-200">
            {value}
        </span>
    );
}
