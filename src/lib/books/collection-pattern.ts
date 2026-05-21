export type CollectionBookLike = {
    id: string;
    title: string;
    author?: string | null;
    description?: string | null;
    categories?: unknown;
    status?: string | null;
    rating?: number | null;
    notes?: string | null;
};

export type CollectionCategoryEvidence = {
    finished: number;
    reading: number;
    owned: number;
    wishlist: number;
};

export type CollectionPatternCategory = {
    name: string;
    score: number;
    evidence: CollectionCategoryEvidence;
};

export type CollectionPatternBook = {
    id: string;
    title: string;
    author: string | null;
    categories: string[];
    status: "owned" | "reading" | "wishlist";
};

export type CollectionPattern = {
    total_books: number;
    finished_count: number;
    reading_count: number;
    owned_count: number;
    wishlist_count: number;
    dominant_categories: CollectionPatternCategory[];
    dominant_authors: string[];
    dominant_keywords: string[];
    unfinished_books_in_dominant_categories: CollectionPatternBook[];
    underrepresented_categories: string[];
};

const STATUS_WEIGHT: Record<keyof CollectionCategoryEvidence, number> = {
    finished: 4,
    reading: 3,
    owned: 2,
    wishlist: 1,
};

const FALLBACK_CATEGORY = "Tidak terkategori";

const CATEGORY_HINTS: Array<{ category: string; keywords: string[] }> = [
    { category: "Strategi & Sistem Berpikir", keywords: ["strategy", "strategi", "system", "sistem", "thinking", "decision", "mental model", "model mental"] },
    { category: "Karier & Produktivitas", keywords: ["career", "karier", "productivity", "produktivitas", "work", "kerja", "habit", "kebiasaan", "business", "bisnis"] },
    { category: "Komunikasi & Relasi", keywords: ["communication", "komunikasi", "relationship", "relasi", "people", "social", "conversation", "negotiation", "influence"] },
    { category: "Memahami Diri", keywords: ["self", "diri", "identity", "identitas", "psychology", "psikologi", "personality", "kepribadian"] },
    { category: "Tipologi Kepribadian", keywords: ["mbti", "enneagram", "socionics", "typology", "tipologi", "personality type"] },
    { category: "Emosi & Regulasi Diri", keywords: ["emotion", "emosi", "stress", "anxiety", "cemas", "trauma", "regulation", "regulasi"] },
    { category: "Filosofi & Makna Hidup", keywords: ["philosophy", "filosofi", "meaning", "makna", "stoic", "stoicism", "existential"] },
    { category: "Skill Praktis", keywords: ["skill", "practical", "praktis", "guide", "how to", "manual", "handbook"] },
    { category: "Kreativitas & Ekspresi", keywords: ["creative", "kreatif", "creativity", "writing", "design", "art", "seni", "expression"] },
    { category: "Kepemimpinan & Pengaruh", keywords: ["leadership", "kepemimpinan", "leader", "pengaruh", "power", "management", "manajemen"] },
    { category: "Advanced Reading", keywords: ["advanced", "lanjutan", "academic", "akademik", "research", "riset", "theory", "teori"] },
    { category: "Growth & Blind Spot", keywords: ["growth", "development", "pengembangan", "shadow", "blind spot", "change", "perubahan"] },
];

const STOPWORDS = new Set([
    "the", "and", "for", "with", "from", "into", "your", "you", "yang", "dan", "untuk", "dari", "dengan", "dalam", "buku", "book",
    "cara", "sebuah", "tentang", "this", "that", "akan", "atau", "pada", "para", "lebih", "hidup", "life",
]);

function normalizeStatus(status?: string | null): keyof CollectionCategoryEvidence | null {
    if (status === "finished" || status === "reading" || status === "owned" || status === "wishlist") return status;
    return null;
}

function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
}

function inferCategoryHints(book: CollectionBookLike) {
    const text = `${book.title} ${book.description ?? ""} ${book.notes ?? ""}`.toLowerCase();
    return CATEGORY_HINTS
        .filter((hint) => hint.keywords.some((keyword) => text.includes(keyword)))
        .map((hint) => hint.category);
}

function getBookCategories(book: CollectionBookLike) {
    const directCategories = toStringArray(book.categories);
    if (directCategories.length > 0) return directCategories;

    const inferredCategories = inferCategoryHints(book);
    if (inferredCategories.length > 0) return inferredCategories;

    return [FALLBACK_CATEGORY];
}

function getKeywords(book: CollectionBookLike) {
    return `${book.title} ${book.description ?? ""} ${book.notes ?? ""}`
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
}

export function analyzeCollectionPattern(books: CollectionBookLike[]): CollectionPattern {
    const categoryScores = new Map<string, CollectionPatternCategory>();
    const authorScores = new Map<string, number>();
    const keywordScores = new Map<string, number>();
    const bookCategories = new Map<string, string[]>();

    let finished_count = 0;
    let reading_count = 0;
    let owned_count = 0;
    let wishlist_count = 0;

    for (const book of books) {
        const status = normalizeStatus(book.status);
        const categories = getBookCategories(book);
        bookCategories.set(book.id, categories);

        if (status === "finished") finished_count += 1;
        if (status === "reading") reading_count += 1;
        if (status === "owned") owned_count += 1;
        if (status === "wishlist") wishlist_count += 1;

        if (book.author) {
            authorScores.set(book.author, (authorScores.get(book.author) ?? 0) + (status ? STATUS_WEIGHT[status] : 1));
        }

        for (const keyword of getKeywords(book)) {
            keywordScores.set(keyword, (keywordScores.get(keyword) ?? 0) + (status ? STATUS_WEIGHT[status] : 1));
        }

        for (const category of categories) {
            const current = categoryScores.get(category) ?? {
                name: category,
                score: 0,
                evidence: { finished: 0, reading: 0, owned: 0, wishlist: 0 },
            };

            if (status) {
                current.evidence[status] += 1;
                current.score += STATUS_WEIGHT[status];
            } else {
                current.score += 1;
            }

            categoryScores.set(category, current);
        }
    }

    const dominant_categories = Array.from(categoryScores.values())
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, 8);
    const dominantCategoryNames = new Set(dominant_categories.slice(0, 5).map((category) => category.name));

    const unfinished_books_in_dominant_categories = books
        .filter((book) => ["owned", "reading", "wishlist"].includes(book.status ?? ""))
        .map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author ?? null,
            categories: bookCategories.get(book.id) ?? getBookCategories(book),
            status: book.status as "owned" | "reading" | "wishlist",
        }))
        .filter((book) => book.categories.some((category) => dominantCategoryNames.has(category)))
        .sort((a, b) => {
            const statusOrder = { reading: 0, owned: 1, wishlist: 2 };
            return statusOrder[a.status] - statusOrder[b.status] || a.title.localeCompare(b.title);
        })
        .slice(0, 12);

    const representedCategories = new Set(dominant_categories.map((category) => category.name));
    const underrepresented_categories = CATEGORY_HINTS
        .map((hint) => hint.category)
        .filter((category) => !representedCategories.has(category))
        .slice(0, 6);

    return {
        total_books: books.length,
        finished_count,
        reading_count,
        owned_count,
        wishlist_count,
        dominant_categories,
        dominant_authors: Array.from(authorScores.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 5)
            .map(([author]) => author),
        dominant_keywords: Array.from(keywordScores.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 10)
            .map(([keyword]) => keyword),
        unfinished_books_in_dominant_categories,
        underrepresented_categories,
    };
}
