import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import {
    bookCollectionCreateSchema,
    getValidationError,
    isValidationError,
} from "@/lib/api-validation";
import { normalizeBookKey } from "@/lib/books/book-lookup";
import { getCurrentUserId, requireCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const COLLECTION_AUTH_REQUIRED_MESSAGE = "Masuk terlebih dahulu untuk mengakses koleksi buku.";

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

export async function GET() {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return NextResponse.json(
                { error: COLLECTION_AUTH_REQUIRED_MESSAGE },
                { status: 401 }
            );
        }

        const books = await prisma.userBook.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ books: books.map(serializeBook) });
    } catch (error) {
        console.error("Book collection load failed:", error);
        return NextResponse.json(
            { error: "Terjadi masalah pada server koleksi buku." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const authResult = await requireCurrentUserId();
        if (authResult.response) return authResult.response;

        const body = bookCollectionCreateSchema.parse(await request.json());
        const newBookKey = normalizeBookKey(body.title, body.author);
        const existingBooks = await prisma.userBook.findMany({
            where: { userId: authResult.userId },
            select: {
                id: true,
                title: true,
                author: true,
                description: true,
                categories: true,
                thumbnail: true,
                isbn10: true,
                isbn13: true,
                publishedAt: true,
                source: true,
                sourceId: true,
                status: true,
                rating: true,
                notes: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        const duplicate = existingBooks.find((book) => normalizeBookKey(book.title, book.author) === newBookKey);

        if (duplicate) {
            return NextResponse.json({
                message: "Buku sudah ada di koleksi.",
                book: serializeBook(duplicate),
            });
        }

        const book = await prisma.userBook.create({
            data: {
                userId: authResult.userId,
                title: body.title,
                author: body.author,
                description: body.description,
                categories: body.categories as Prisma.InputJsonValue | undefined,
                thumbnail: body.thumbnail,
                isbn10: body.isbn10,
                isbn13: body.isbn13,
                publishedAt: body.publishedAt,
                source: body.source,
                sourceId: body.sourceId,
                status: body.status,
            },
        });

        return NextResponse.json({ book: serializeBook(book) }, { status: 201 });
    } catch (error) {
        console.error("Book collection create failed:", error);
        return NextResponse.json(
            { error: getValidationError(error, "Gagal menyimpan buku.") },
            { status: isValidationError(error) ? 400 : 500 }
        );
    }
}
