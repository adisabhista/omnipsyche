import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MbtiTestClient from "@/components/tipologi/MbtiTestClient";

export default async function MbtiTesPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;

    // Fetch test history and current profile MBTI in parallel
    const [tests, latestProfile] = await Promise.all([
        prisma.externalMbtiTest.findMany({
            where: { userId, provider: "devil.ai" },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true,
                testId: true,
                testUrl: true,
                status: true,
                prediction: true,
                resultsPage: true,
                createdAt: true,
                completedAt: true,
            },
        }),
        prisma.userProfile.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { mbti: true },
        }),
    ]);

    const serializedTests = tests.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString() ?? null,
    }));

    return (
        <div className="space-y-6">
            <Link
                href="/tipologi"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-cyan-600 dark:hover:text-cyan-300"
            >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke tipologi
            </Link>

            <MbtiTestClient
                initialTests={serializedTests}
                currentMbti={latestProfile?.mbti ?? null}
            />
        </div>
    );
}
