import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

export function ProfileFormSection({
    eyebrow,
    title,
    description,
    icon,
    action,
    children,
    className,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={clsx("min-w-0 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-[0_18px_58px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-black/25 dark:shadow-none sm:p-5", className)}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        {icon && <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-300/10 text-cyan-600 dark:text-cyan-300">{icon}</div>}
                        <div className="min-w-0">
                            {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300/80">{eyebrow}</p>}
                            <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
                        </div>
                    </div>
                    {description && <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-500">{description}</p>}
                </div>
                {action}
            </div>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

export function FieldGroup({ children, columns = 1 }: { children: ReactNode; columns?: 1 | 2 | 3 }) {
    return (
        <div
            className={clsx(
                "grid gap-4",
                columns === 2 && "md:grid-cols-2",
                columns === 3 && "md:grid-cols-3"
            )}
        >
            {children}
        </div>
    );
}

export function FormField({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block rounded-lg border border-slate-200 bg-slate-50/80 p-4 transition focus-within:border-cyan-400/50 dark:border-white/10 dark:bg-white/[0.035]">
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{label}</span>
            <span className="mt-3 block">{children}</span>
            {hint && <span className="mt-2 block text-xs leading-5 text-slate-500">{hint}</span>}
            {error && <span className="mt-2 block text-xs font-medium text-red-600 dark:text-red-300">{error}</span>}
        </label>
    );
}

const fieldClassName = "w-full rounded-lg border border-slate-200 bg-white/85 px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-black/35 dark:text-slate-100 dark:placeholder:text-slate-600";

export function DarkInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={clsx(fieldClassName, className)} {...props} />;
}

export function DarkTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={clsx(fieldClassName, "min-h-36 resize-y leading-6", className)} {...props} />;
}

export function DarkSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={clsx(fieldClassName, "appearance-none", className)} {...props}>
            {children}
        </select>
    );
}

export function ActionButton({
    variant = "secondary",
    className,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "success";
}) {
    return (
        <button
            className={clsx(
                "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                variant === "primary" && "bg-cyan-300 text-slate-950 hover:bg-cyan-200 disabled:hover:bg-cyan-300",
                variant === "secondary" && "border border-slate-200 bg-white/70 text-slate-700 hover:border-cyan-400/35 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-300 dark:hover:bg-white/[0.07]",
                variant === "success" && "bg-emerald-400 text-slate-950 hover:bg-emerald-300 disabled:hover:bg-emerald-400",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function InfoPill({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "slate" | "emerald" | "amber" }) {
    return (
        <span
            className={clsx(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                tone === "cyan" && "border-cyan-400/25 bg-cyan-300/10 text-cyan-700 dark:text-cyan-200",
                tone === "slate" && "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400",
                tone === "emerald" && "border-emerald-400/25 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200",
                tone === "amber" && "border-amber-400/25 bg-amber-300/10 text-amber-700 dark:text-amber-200"
            )}
        >
            {children}
        </span>
    );
}
