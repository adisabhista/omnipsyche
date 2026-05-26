import { NextResponse } from "next/server";
import { bookLookupRequestSchema, getValidationError, isValidationError } from "@/lib/api-validation";
import { lookupBookMetadata } from "@/lib/books/book-lookup";
import { requireCurrentUserId } from "@/lib/current-user";

export async function POST(request: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const body = bookLookupRequestSchema.parse(await request.json());
        const candidates = await lookupBookMetadata(body);

        return NextResponse.json({ candidates });
    } catch (error) {
        console.error("Book lookup failed:", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return NextResponse.json(
            { error: getValidationError(error, "Gagal mencari metadata buku.") },
            { status: isValidationError(error) ? 400 : 500 }
        );
    }
}
