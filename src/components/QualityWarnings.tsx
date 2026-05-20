import Link from "next/link";
import clsx from "clsx";
import type { ProfileQualityWarning } from "@/lib/profile-consistency";

const severityStyles: Record<ProfileQualityWarning["severity"], string> = {
    info: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    warning: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    critical: "border-red-300/25 bg-red-300/10 text-red-100",
};

export function QualityWarningList({
    warnings,
    emptyMessage,
    limit,
}: {
    warnings: ProfileQualityWarning[];
    emptyMessage?: string;
    limit?: number;
}) {
    const visibleWarnings = typeof limit === "number" ? warnings.slice(0, limit) : warnings;

    if (visibleWarnings.length === 0) {
        return emptyMessage ? <p className="text-sm leading-6 text-slate-500">{emptyMessage}</p> : null;
    }

    return (
        <div className="space-y-3">
            {visibleWarnings.map((warning) => (
                <div key={warning.id} className={clsx("rounded-lg border p-3 text-sm", severityStyles[warning.severity])}>
                    <p className="font-semibold">{warning.title}</p>
                    <p className="mt-1 leading-6 text-slate-300">{warning.message}</p>
                    {warning.actionHref && warning.actionLabel && (
                        <Link href={warning.actionHref} className="mt-2 inline-flex text-xs font-semibold text-cyan-200 hover:text-cyan-100">
                            {warning.actionLabel}
                        </Link>
                    )}
                </div>
            ))}
        </div>
    );
}
