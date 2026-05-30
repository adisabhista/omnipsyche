import "server-only";

import { z } from "zod";
import { generateTextWithFallback, safeErrorMessage } from "@/lib/ai-generate";
import { cleanAndParseJSON } from "@/lib/personality-parser";

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

const providerRequestHeaders = {
    "Accept": "application/json",
    "User-Agent": "OmniPsyche/0.1 (https://localhost; book metadata lookup)",
};

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
        const key = normalizeBookKey(candidate.title, candidate.author);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function debugBookLookup(message: string, value: unknown) {
    if (process.env.NODE_ENV === "development") {
        console.log(message, value);
    }
}

async function lookupGoogleBooks(title: string, author?: string): Promise<BookLookupCandidate[]> {
    const queries = [
        author ? `${title} ${author}` : title,
        author ? `"${title}" "${author}"` : `"${title}"`,
        author ? `intitle:"${title}" inauthor:"${author}"` : `intitle:"${title}"`,
    ];

    for (const query of queries) {
        const candidates = await fetchGoogleBooksCandidates(query);
        if (candidates.length > 0) return candidates;
    }

    return [];
}

async function fetchGoogleBooksCandidates(query: string): Promise<BookLookupCandidate[]> {
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", "5");
    url.searchParams.set("printType", "books");

    const response = await fetch(url, {
        headers: providerRequestHeaders,
        next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) {
        console.warn("Google Books lookup returned non-OK response:", {
            status: response.status,
            statusText: response.statusText,
        });
        return [];
    }

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
    const titleAuthorCandidates = await fetchOpenLibraryCandidates((url) => {
        url.searchParams.set("title", title);
        if (author) url.searchParams.set("author", author);
    });

    debugBookLookup("Open Library title/author candidates:", titleAuthorCandidates.length);
    if (titleAuthorCandidates.length > 0) return titleAuthorCandidates;

    const queryCandidates = await fetchOpenLibraryCandidates((url) => {
        url.searchParams.set("q", author ? `${title} ${author}` : title);
    });

    debugBookLookup("Open Library q fallback candidates:", queryCandidates.length);
    if (queryCandidates.length > 0) return queryCandidates;

    const titleQueryCandidates = await fetchOpenLibraryCandidates((url) => {
        url.searchParams.set("q", title);
    });

    debugBookLookup("Open Library q title-only candidates:", titleQueryCandidates.length);
    return titleQueryCandidates;
}

async function fetchOpenLibraryCandidates(setSearchParams: (url: URL) => void): Promise<BookLookupCandidate[]> {
    const url = new URL("https://openlibrary.org/search.json");
    setSearchParams(url);
    url.searchParams.set("limit", "5");

    const response = await fetch(url, {
        headers: providerRequestHeaders,
        next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) {
        console.warn("Open Library lookup returned non-OK response:", {
            status: response.status,
            statusText: response.statusText,
        });
        return [];
    }

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

    const generationResult = await generateTextWithFallback(prompt, { feature: "book-metadata-fallback" });
    const parsed = aiFallbackSchema.parse(cleanAndParseJSON(generationResult.text));

    return parsed.candidates.map((candidate) => ({
        title: candidate.title,
        author: candidate.author,
        source: "ai_fallback" as const,
    }));
}

export async function lookupBookMetadata(input: { title: string; author?: string }) {
    let googleCandidates: BookLookupCandidate[] = [];
    let openLibraryCandidates: BookLookupCandidate[] = [];
    let aiFallbackCandidates: BookLookupCandidate[] = [];

    try {
        googleCandidates = await lookupGoogleBooks(input.title, input.author);
    } catch (error) {
        console.warn("Google Books lookup failed:", error);
    }

    debugBookLookup("Google Books candidates:", googleCandidates.length);

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

    const shouldUseAiFallback = googleCandidates.length === 0 && openLibraryCandidates.length === 0;
    debugBookLookup("AI fallback used:", shouldUseAiFallback);

    try {
        aiFallbackCandidates = await lookupAiFallback(input.title, input.author);
    } catch (error) {
        console.warn("AI book lookup fallback failed:", safeErrorMessage(error));
    }

    return dedupeCandidates(aiFallbackCandidates).slice(0, 3);
}

export function normalizeBookKey(title: string, author?: string | null) {
    return `${title.trim().toLowerCase().replace(/\s+/g, " ")}::${(author ?? "").trim().toLowerCase().replace(/\s+/g, " ")}`;
}
