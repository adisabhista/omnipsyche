import { z } from "zod";

export const BOOK_CATEGORY_CANDIDATES = [
    "Memahami Diri",
    "Tipologi Kepribadian",
    "Growth & Blind Spot",
    "Karier & Produktivitas",
    "Komunikasi & Relasi",
    "Emosi & Regulasi Diri",
    "Filosofi & Makna Hidup",
    "Skill Praktis",
    "Strategi & Sistem Berpikir",
    "Kreativitas & Ekspresi",
    "Kepemimpinan & Pengaruh",
    "Advanced Reading",
] as const;

const categoryNameSchema = z.enum(BOOK_CATEGORY_CANDIDATES);
const prioritySchema = z.enum(["must_read", "recommended", "optional"]);
const statusSchema = z.enum(["owned", "reading", "wishlist"]);

const collectionRecommendationSchema = z.object({
    bookId: z.string().nullable(),
    title: z.string().min(1),
    author: z.string().nullable(),
    status: statusSchema,
    priority: prioritySchema,
    why_read_this_first: z.string().min(1),
    best_for: z.string().min(1),
    reading_order: z.number().int().min(1),
});

const newRecommendationSchema = z.object({
    title: z.string().min(1),
    author: z.string().min(1),
    priority: prioritySchema,
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    why_recommended: z.string().min(1),
    best_for: z.string().min(1),
    reading_order: z.number().int().min(1),
});

const recommendedCategorySchema = z.object({
    rank: z.number().int().min(1),
    name: categoryNameSchema,
    fit_score: z.enum(["high", "medium"]),
    priority_reason: z.string().min(1),
    related_profile_factors: z.array(z.string().min(1)),
    collection_context: z.string().min(1),
    read_from_collection_first: z.array(collectionRecommendationSchema).max(3),
    new_recommendations: z.array(newRecommendationSchema).max(3),
});

export const bookRecommendationSchema = z.object({
    summary: z.string().min(1),
    collection_analysis: z.object({
        owned_count: z.number().int().min(0),
        unfinished_count: z.number().int().min(0),
        finished_count: z.number().int().min(0),
        dominant_categories: z.array(z.string().min(1)),
        unread_priority_note: z.string().min(1),
        gaps: z.array(z.object({
            category: z.string().min(1),
            reason: z.string().min(1),
        })),
    }),
    category_ranking_logic: z.string().min(1),
    recommended_categories: z.array(recommendedCategorySchema).min(3).max(5),
    reading_path: z.array(
        z.object({
            step: z.number().int().min(1),
            source: z.enum(["collection", "new"]),
            title: z.string().min(1),
            category: categoryNameSchema,
            focus: z.string().min(1),
            reason: z.string().min(1),
        })
    ).min(1),
    warnings: z.array(z.string()),
}).superRefine((value, context) => {
    const totalItems = value.recommended_categories.reduce(
        (total, category) => total + category.read_from_collection_first.length + category.new_recommendations.length,
        0
    );

    if (totalItems < 6 || totalItems > 12) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Total rekomendasi harus berada di antara 6 dan 12 item.",
            path: ["recommended_categories"],
        });
    }

    value.recommended_categories.forEach((category, index) => {
        const itemCount = category.read_from_collection_first.length + category.new_recommendations.length;
        if (itemCount === 0) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Setiap kategori harus memiliki minimal satu rekomendasi.",
                path: ["recommended_categories", index],
            });
        }
    });
});

export type BookRecommendation = z.infer<typeof bookRecommendationSchema>;
export type BookRecommendationInput = z.input<typeof bookRecommendationSchema>;

type ProfileContext = {
    mbti?: string | null;
    enneagramType?: string | null;
    enneagramWing?: string | null;
    enneagramTritype?: string | null;
    instinctualVariant?: string | null;
    socionics?: string | null;
    attitudinalPsyche?: string | null;
    riasec?: string | null;
    bigFive?: unknown;
};

export type UserBookContext = {
    id: string;
    title: string;
    author?: string | null;
    categories?: unknown;
    status?: string | null;
    rating?: number | null;
    notes?: string | null;
};

function isFilled(value: unknown) {
    return value !== null &&
        value !== undefined &&
        value !== "" &&
        !(typeof value === "string" && value.toLowerCase() === "unknown");
}

function countRecommendationItems(categories: BookRecommendation["recommended_categories"]) {
    return categories.reduce(
        (total, category) => total + category.read_from_collection_first.length + category.new_recommendations.length,
        0
    );
}

export function getAvailableProfileFactors(profile: ProfileContext, analysisJson: unknown) {
    const factors: string[] = [];

    if (isFilled(profile.mbti)) factors.push(`MBTI: ${profile.mbti}`);
    if (isFilled(profile.enneagramType)) {
        const wing = isFilled(profile.enneagramWing) ? `w${profile.enneagramWing}` : "";
        factors.push(`Enneagram: ${profile.enneagramType}${wing}`);
    }
    if (isFilled(profile.enneagramTritype)) factors.push(`Tritype: ${profile.enneagramTritype}`);
    if (isFilled(profile.instinctualVariant)) factors.push(`Instinctual Variant: ${profile.instinctualVariant}`);
    if (isFilled(profile.socionics)) factors.push(`Socionics: ${profile.socionics}`);
    if (isFilled(profile.attitudinalPsyche)) factors.push(`Attitudinal Psyche: ${profile.attitudinalPsyche}`);
    if (isFilled(profile.riasec)) factors.push(`RIASEC: ${profile.riasec}`);
    if (isFilled(profile.bigFive)) factors.push("Big Five: tersedia");

    if (typeof analysisJson === "object" && analysisJson !== null) {
        factors.push("Analisis AI tersimpan: tersedia");
    }

    return factors;
}

export function normalizeBookRecommendation(input: BookRecommendationInput): BookRecommendation {
    const seenCategories = new Set<string>();
    let nextReadingOrder = 1;

    const recommended_categories = [...input.recommended_categories]
        .sort((a, b) => a.rank - b.rank)
        .filter((category) => {
            const itemCount = category.read_from_collection_first.length + category.new_recommendations.length;
            if (seenCategories.has(category.name) || itemCount === 0) return false;
            seenCategories.add(category.name);
            return true;
        })
        .slice(0, 5)
        .map((category, index) => ({
            ...category,
            rank: index + 1,
            read_from_collection_first: category.read_from_collection_first
                .slice(0, 3)
                .map((book) => ({
                    ...book,
                    reading_order: nextReadingOrder++,
                })),
            new_recommendations: category.new_recommendations
                .slice(0, 3)
                .map((book) => ({
                    ...book,
                    reading_order: nextReadingOrder++,
                })),
        }));

    while (countRecommendationItems(recommended_categories) > 12) {
        const categoryWithNewBook = [...recommended_categories]
            .reverse()
            .find((category) => category.new_recommendations.length > 0 && category.read_from_collection_first.length + category.new_recommendations.length > 1);
        if (categoryWithNewBook) {
            categoryWithNewBook.new_recommendations.pop();
            continue;
        }

        const categoryWithCollectionBook = [...recommended_categories]
            .reverse()
            .find((category) => category.read_from_collection_first.length > 1 && category.read_from_collection_first.length + category.new_recommendations.length > 1);
        if (categoryWithCollectionBook) {
            categoryWithCollectionBook.read_from_collection_first.pop();
            continue;
        }

        if (recommended_categories.length <= 3) break;
        recommended_categories.pop();
    }

    const pathCategories = new Set(recommended_categories.map((category) => category.name));
    const reading_path = input.reading_path
        .filter((step) => pathCategories.has(step.category))
        .slice(0, countRecommendationItems(recommended_categories))
        .map((step, index) => ({ ...step, step: index + 1 }));

    const fallbackPath = recommended_categories.flatMap((category) => [
        ...category.read_from_collection_first.map((book) => ({
            source: "collection" as const,
            title: book.title,
            category: category.name,
            focus: book.best_for,
            reason: book.why_read_this_first,
        })),
        ...category.new_recommendations.map((book) => ({
            source: "new" as const,
            title: book.title,
            category: category.name,
            focus: book.best_for,
            reason: book.why_recommended,
        })),
    ]).map((step, index) => ({ ...step, step: index + 1 }));

    return bookRecommendationSchema.parse({
        ...input,
        recommended_categories,
        reading_path: reading_path.length ? reading_path : fallbackPath,
    });
}

export function buildBookRecommendationPrompt(context: {
    profile: ProfileContext;
    analysisJson: unknown;
    markdown: string;
    availableFactors: string[];
    unfinishedBooks: UserBookContext[];
    finishedBooks: UserBookContext[];
}) {
    const collectionBookSummary = (book: UserBookContext) => ({
        bookId: book.id,
        title: book.title,
        author: book.author,
        categories: book.categories,
        status: book.status,
        rating: book.rating,
        notes: book.notes,
    });
    const unfinishedBooks = context.unfinishedBooks.map(collectionBookSummary);
    const finishedBooks = context.finishedBooks.map(collectionBookSummary);
    const ownedCount = unfinishedBooks.length + finishedBooks.length;

    return `Kamu adalah kurator bacaan untuk OmniPsyche, platform intelijensi kepribadian.

Buat rekomendasi buku yang selektif, ranked, berbasis profil, dan sadar koleksi buku pengguna.
Gunakan bahasa Indonesia.
Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar, tanpa teks pembuka.

Prioritaskan buku dari koleksi pengguna yang belum selesai dibaca. Jangan langsung menyarankan buku baru jika koleksi pengguna sudah punya buku relevan untuk kategori prioritas.

Kategori kandidat:
${BOOK_CATEGORY_CANDIDATES.map((category, index) => `${index + 1}. ${category}`).join("\n")}

Skema JSON wajib:
{
  "summary": "string",
  "collection_analysis": {
    "owned_count": ${ownedCount},
    "unfinished_count": ${unfinishedBooks.length},
    "finished_count": ${finishedBooks.length},
    "dominant_categories": ["string"],
    "unread_priority_note": "string",
    "gaps": [
      {
        "category": "string",
        "reason": "string"
      }
    ]
  },
  "category_ranking_logic": "string",
  "recommended_categories": [
    {
      "rank": 1,
      "name": "string",
      "fit_score": "high | medium",
      "priority_reason": "string",
      "related_profile_factors": ["string"],
      "collection_context": "string",
      "read_from_collection_first": [
        {
          "bookId": "string | null",
          "title": "string",
          "author": "string | null",
          "status": "owned | reading | wishlist",
          "priority": "must_read | recommended | optional",
          "why_read_this_first": "string",
          "best_for": "string",
          "reading_order": 1
        }
      ],
      "new_recommendations": [
        {
          "title": "string",
          "author": "string",
          "priority": "must_read | recommended | optional",
          "difficulty": "beginner | intermediate | advanced",
          "why_recommended": "string",
          "best_for": "string",
          "reading_order": 1
        }
      ]
    }
  ],
  "reading_path": [
    {
      "step": 1,
      "source": "collection | new",
      "title": "string",
      "category": "string",
      "focus": "string",
      "reason": "string"
    }
  ],
  "warnings": ["string"]
}

Aturan ranking dan rekomendasi:
- Rank kategori berdasarkan kecocokan dengan profil dan analisis pengguna.
- Tampilkan hanya 3 sampai 5 recommended_categories.
- Total rekomendasi harus selektif, idealnya 6 sampai 12 item.
- Prioritas status koleksi: reading lebih dulu jika sangat cocok, lalu owned, lalu wishlist.
- Buku berstatus owned, reading, dan wishlist adalah buku belum selesai.
- Buku berstatus finished adalah buku selesai.
- Jika kategori prioritas punya buku belum selesai yang relevan, masukkan ke read_from_collection_first.
- Hanya isi new_recommendations jika koleksi belum mencakup kategori itu dengan baik.
- Jika ada cukup buku belum selesai yang relevan, minimal 50% rekomendasi harus berasal dari read_from_collection_first.
- Jangan merekomendasikan buku finished sebagai rekomendasi normal.
- Jika perlu menyarankan buku finished untuk dibaca ulang, jangan masukkan sebagai item normal; tulis alasannya dengan jelas di warnings.
- Jangan mengarang buku dalam koleksi pengguna.
- Untuk buku koleksi, bookId, title, author, dan status harus persis sama dengan data database.
- Buku baru harus buku nyata, bukan judul fiktif.
- Setiap kategori wajib menjelaskan alasan prioritasnya.
- collection_analysis.owned_count harus sama dengan ${ownedCount}.
- collection_analysis.unfinished_count harus sama dengan ${unfinishedBooks.length}.
- collection_analysis.finished_count harus sama dengan ${finishedBooks.length}.
- collection_analysis.gaps harus menjelaskan kategori yang belum kuat tetapi berguna untuk profil pengguna.
- collection_context wajib menjelaskan hubungan kategori dengan koleksi pengguna.
- Gunakan frasa hati-hati seperti "cocok untuk", "relevan karena", "dapat membantu", atau "disarankan sebagai prioritas awal".
- Jangan gunakan klaim absolut seperti "pasti cocok", "buku terbaik untuk Anda", atau "wajib karena tipe Anda".
- related_profile_factors hanya boleh memakai faktor yang ada di daftar faktor tersedia.
- Jangan menyebut RIASEC jika RIASEC tidak ada di daftar faktor tersedia.
- Jangan mengarang tipe, skor Big Five, atau data profil yang tidak ada.
- reading_order harus urut lintas semua item, mulai dari 1.
- reading_path harus mengikuti urutan baca utama dan memakai title yang sama dengan item rekomendasi.

Faktor profil yang tersedia:
${context.availableFactors.length ? context.availableFactors.map((factor) => `- ${factor}`).join("\n") : "- Tidak ada faktor eksplisit"}

Profil tersimpan:
${JSON.stringify(context.profile, null, 2)}

Analisis JSON tersimpan:
${JSON.stringify(context.analysisJson, null, 2)}

Buku koleksi belum selesai:
${JSON.stringify(unfinishedBooks, null, 2)}

Buku koleksi selesai:
${JSON.stringify(finishedBooks, null, 2)}

Markdown analisis:
${context.markdown}`;
}

export function buildBookRecommendationRepairPrompt(invalidText: string, validationMessage: string) {
    return `Perbaiki output rekomendasi buku berikut agar menjadi JSON valid sesuai schema OmniPsyche.
Kembalikan HANYA JSON valid tanpa markdown atau teks tambahan.

Kategori kandidat:
${BOOK_CATEGORY_CANDIDATES.map((category, index) => `${index + 1}. ${category}`).join("\n")}

Aturan wajib:
- recommended_categories harus berisi 3 sampai 5 kategori.
- Total rekomendasi harus 6 sampai 12 item.
- Setiap kategori harus memiliki minimal satu item di read_from_collection_first atau new_recommendations.
- Gunakan read_from_collection_first untuk buku koleksi yang belum selesai.
- Buku koleksi hanya boleh memakai status owned, reading, atau wishlist.
- Jangan masukkan buku finished sebagai rekomendasi normal.
- Jangan mengarang buku koleksi; bookId, title, author, dan status harus persis dari input awal jika memakai buku koleksi.
- Wajib memiliki collection_analysis dengan owned_count, unfinished_count, finished_count, dominant_categories, unread_priority_note, dan gaps.
- Jika output terlalu panjang, pertahankan kategori dengan rank tertinggi dan pangkas item prioritas terendah.

Error validasi:
${validationMessage}

Output tidak valid:
${invalidText}`;
}
