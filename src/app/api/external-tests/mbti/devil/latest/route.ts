import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/current-user";

export async function GET() {
    const { userId, response } = await requireCurrentUserId();
    if (response) return response;

    const tests = await prisma.externalMbtiTest.findMany({
        where: { userId: userId!, provider: "devil.ai" },
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
    });

    return NextResponse.json({ tests });
}
