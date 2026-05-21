import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId, NOT_FOUND_MESSAGE, FORBIDDEN_MESSAGE } from "@/lib/current-user";
import { checkMbtiTest } from "@/lib/devil-ai";

const requestSchema = z.object({
    testId: z.string().min(1, "testId wajib diisi."),
});

export async function POST(req: NextRequest) {
    const { userId, response } = await requireCurrentUserId();
    if (response) return response;

    let testId: string;
    try {
        const body = await req.json();
        testId = requestSchema.parse(body).testId;
    } catch {
        return NextResponse.json(
            { error: "testId wajib diisi." },
            { status: 400 },
        );
    }

    // Find the test record
    const record = await prisma.externalMbtiTest.findUnique({
        where: { provider_testId: { provider: "devil.ai", testId } },
    });

    if (!record) {
        return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    if (record.userId !== userId) {
        return NextResponse.json({ error: FORBIDDEN_MESSAGE }, { status: 403 });
    }

    try {
        const result = await checkMbtiTest(testId);

        if (!result.completed) {
            return NextResponse.json({
                status: "pending",
                message: "Tes belum selesai dikerjakan.",
            });
        }

        // Update the record with results
        const updated = await prisma.externalMbtiTest.update({
            where: { id: record.id },
            data: {
                status: "completed",
                prediction: result.prediction ?? null,
                resultsPage: result.results_page ?? null,
                rawResult: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
                completedAt: new Date(),
            },
        });


        return NextResponse.json({
            status: "completed",
            prediction: updated.prediction,
            resultsPage: updated.resultsPage,
            traitOrderConscious: result.trait_order_conscious ?? [],
            traitOrderShadow: result.trait_order_shadow ?? [],
            matches: result.matches ?? [],
            completedAt: updated.completedAt,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Gagal mengecek hasil tes.";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
