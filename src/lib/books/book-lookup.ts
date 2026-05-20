import "server-only";

import { z } from "zod";
import { cleanAndParseJSON } from "@/lib/personality-parser";
import { generatePersonalitySynthesis } from "@/lib/vertex-ai";

export type BookLookupCandidate = {
    title: string;
    author?: string;
    description?: string;
    categories?: string[];
    thumbnail?: string;
    isbn10?: string;
    isbn13?: string;
    publishedAt?: string;
    source: "google_books" | "open_library" | "ai_fallback";
    sourceId?: string;
};

const aiFallbackSchema = z.object({
    candidates: z.array(z.object({
        title: z.string().min(1),
        author: z.string().optional(),
    })).min(1).max(3),
});

function compact<T>(items: Array<T | null | undefined>) {
    return items.filter((item): item is T => Boolean(item));
}

function uniqueStrings(values: unknown[]) {
    return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
}

function normalizeIsbn(identifiers: Array<{ type?: string; identifier?: string }> | undefined, type: "ISBN_10" | "ISBN_13") {
    return identifiers?.find((identifier) => identifier.type === type)?.identifier;
}

function dedupeCandidates(candidates: BookLookupCandidate[]) {
    const seen = new Set<string>();

    return candidates.filter((candidate) => {
        const key = `${candidate.title.toLowerCase().trim()}::${candidate.author?.toLowerCase().trim() ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function lookupGoogleBooks(title: string, author?: string): Promise<BookLookupCandidate[]> {
    const query = author ? `intitle:${title} inauthor:${author}` : `intitle:${title}`;
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", "5");
    url.searchParams.set("printType", "books");

    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) return [];

    const data = await response.json() as {
        items?: Array<{
            id?: string;
            volumeInfo?: {
                title?: string;
                authors?: string[];
                description?: string;
                categories?: string[];
                imageLinks?: { thumbnail?: string; smallThumbnail?: string };
                industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
                publishedDate?: string;
            };
        }>;
    };

    return compact((data.items ?? []).map((item) => {
        const info = item.volumeInfo;
        if (!info?.title) return null;

        return {
            title: info.title,
            author: info.authors?.join(", "),
            description: info.description,
            categories: info.categories,
            thumbnail: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail,
            isbn10: normalizeIsbn(info.industryIdentifiers, "ISBN_10"),
            isbn13: normalizeIsbn(info.industryIdentifiers, "ISBN_13"),
            publishedAt: info.publishedDate,
            source: "google_books" as const,
            sourceId: item.id,
        };
    }));
}

async function lookupOpenLibrary(title: string, author?: string): Promise<BookLookupCandidate[]> {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("title", title);
    if (author) url.searchParams.set("author", author);
    url.searchParams.set("limit", "5");

    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) return [];

    const data = await response.json() as {
        docs?: Array<{
            key?: string;
            title?: string;
            author_name?: string[];
            subject?: string[];
            isbn?: string[];
            first_publish_year?: number;
            cover_i?: number;
        }>;
    };

    return compact((data.docs ?? []).map((doc) => {
        if (!doc.title) return null;
        const isbn10 = doc.isbn?.find((isbn) => isbn.length === 10);
        const isbn13 = doc.isbn?.find((isbn) => isbn.length === 13);

        return {
            title: doc.title,
            author: doc.author_name?.join(", "),
            categories: uniqueStrings(doc.subject ?? []).slice(0, 6),
            thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
            isbn10,
            isbn13,
            publishedAt: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
            source: "open_library" as const,
            sourceId: doc.key,
        };
    }));
}

async function lookupAiFallback(title: string, author?: string): Promise<BookLookupCandidate[]> {
    const prompt = `Normalisasi kandidat buku dari input pengguna.
Kembalikan HANYA JSON valid tanpa markdown.
Jangan mengarang ISBN, tahun terbit, deskripsi, kategori, atau sampul.
Jika tidak yakin, berikan 2-3 kandidat judul/penulis yang mungkin.

Input:
Judul: ${title}
Penulis: ${author || "-"}

Schema:
{
  "candidates": [
    {
      "title": "string",
      "author": "string"
    }
  ]
}`;

    const text = await generatePersonalitySynthesis(prompt);
    const parsed = aiFallbackSchema.parse(cleanAndParseJSON(text));

    return parsed.candidates.map((candidate) => ({
        title: candidate.title,
        author: candidate.author,
        source: "ai_fallback" as const,
    }));
}

export async function lookupBookMetadata(input: { title: string; author?: string }) {
    let googleCandidates: BookLookupCandidate[] = [];
    let openLibraryCandidates: BookLookupCandidate[] = [];

    try {
        googleCandidates = await lookupGoogleBooks(input.title, input.author);
    } catch (error) {
        console.warn("Google Books lookup failed:", error);
    }

    if (googleCandidates.length > 0) {
        return dedupeCandidates(googleCandidates).slice(0, 5);
    }

    try {
        openLibraryCandidates = await lookupOpenLibrary(input.title, input.author);
    } catch (error) {
        console.warn("Open Library lookup failed:", error);
    }

    if (openLibraryCandidates.length > 0) {
        return dedupeCandidates(openLibraryCandidates).slice(0, 5);
    }

    return dedupeCandidates(await lookupAiFallback(input.title, input.author)).slice(0, 3);
}

export function normalizeBookKey(title: string, author?: string | null) {
    return `${title.trim().toLowerCase().replace(/\s+/g, " ")}::${(author ?? "").trim().toLowerCase().replace(/\s+/g, " ")}`;
}
