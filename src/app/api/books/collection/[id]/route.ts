import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import {
    bookCollectionUpdateSchema,
    getValidationError,
    idParamSchema,
    isValidationError,
} from "@/lib/api-validation";
import { NOT_FOUND_MESSAGE, requireCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function serializeBook(book: {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    categories: Prisma.JsonValue | null;
    thumbnail: string | null;
    isbn10: string | null;
    isbn13: string | null;
    publishedAt: string | null;
    source: string | null;
    sourceId: string | null;
    status: string;
    rating: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        ...book,
        categories: Array.isArray(book.categories) ? book.categories : [],
    };
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const params = idParamSchema.parse(await context.params);
        const body = bookCollectionUpdateSchema.parse(await request.json());

        const existingBook = await prisma.userBook.findFirst({
            where: {
                id: params.id,
                userId: authResult.userId,
            },
        });

        if (!existingBook) {
            return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
        }

        const book = await prisma.userBook.update({
            where: { id: params.id },
            data: body,
        });

        return NextResponse.json({ book: serializeBook(book) });
    } catch (error) {
        console.error("Book collection update failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Gagal memperbarui buku.") },
            { status: isValidationError(error) ? 400 : 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const params = idParamSchema.parse(await context.params);
        const existingBook = await prisma.userBook.findFirst({
            where: {
                id: params.id,
                userId: authResult.userId,
            },
        });

        if (!existingBook) {
            return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
        }

        await prisma.userBook.delete({ where: { id: params.id } });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Book collection delete failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Gagal menghapus buku.") },
            { status: isValidationError(error) ? 400 : 500 }
        );
    }
}
