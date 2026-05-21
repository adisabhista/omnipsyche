import { z } from "zod";
import type { CollectionPattern } from "@/lib/books/collection-pattern";

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
const recommendationModeSchema = z.enum([
    "similar_to_collection",
    "from_unfinished_collection",
    "profile_fit",
    "balancing_blind_spot",
]);

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
    recommendation_mode: recommendationModeSchema.default("profile_fit"),
    priority_reason: z.string().min(1),
    related_profile_factors: z.array(z.string().min(1)),
    collection_context: z.string().min(1),
    read_from_collection_first: z.array(collectionRecommendationSchema).max(3),
    new_recommendations: z.array(newRecommendationSchema).max(3),
});

const balancingSuggestionSchema = z.object({
    category: z.string().min(1),
    reason: z.string().min(1),
    books: z.array(z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        why_optional: z.string().min(1),
    })).max(3),
});

export const bookRecommendationSchema = z.object({
    summary: z.string().min(1),
    collection_analysis: z.object({
        owned_count: z.number().int().min(0),
        unfinished_count: z.number().int().min(0),
        finished_count: z.number().int().min(0),
        dominant_categories: z.array(z.string().min(1)),
        dominant_pattern_summary: z.string().min(1).default("Pola koleksi belum cukup spesifik, jadi rekomendasi memakai sinyal profil dan analisis sebagai pendukung."),
        similarity_priority_note: z.string().min(1).default("Rekomendasi utama diprioritaskan dari kategori yang paling dekat dengan koleksi Anda."),
        blind_spot_note: z.string().min(1).default("Kategori penyeimbang bersifat opsional setelah bacaan utama."),
        unread_priority_note: z.string().min(1).default("Buku yang belum selesai di koleksi diprioritaskan sebelum rekomendasi baru ketika relevan."),
        gaps: z.array(z.object({
            category: z.string().min(1),
            reason: z.string().min(1),
            priority: z.enum(["secondary"]).default("secondary"),
        })),
    }),
    category_ranking_logic: z.string().min(1),
    recommended_categories: z.array(recommendedCategorySchema).min(3).max(5),
    balancing_suggestions: z.array(balancingSuggestionSchema).max(2).default([]),
    reading_path: z.array(
        z.object({
            step: z.number().int().min(1),
            source: z.enum(["collection", "new", "balancing"]),
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
            message: "Total rekomendasi utama harus berada di antara 6 dan 12 item.",
            path: ["recommended_categories"],
        });
    }

    value.recommended_categories.forEach((category, index) => {
        const itemCount = category.read_from_collection_first.length + category.new_recommendations.length;
        if (itemCount === 0) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Setiap kategori utama harus memiliki minimal satu rekomendasi.",
                path: ["recommended_categories", index],
            });
        }
    });

    if (value.collection_analysis.owned_count >= 5) {
        value.recommended_categories.slice(0, 2).forEach((category, index) => {
            if (category.recommendation_mode === "balancing_blind_spot") {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Kategori penyeimbang tidak boleh menjadi dua rekomendasi pertama ketika koleksi sudah cukup kuat.",
                    path: ["recommended_categories", index, "recommendation_mode"],
                });
            }
        });
    }
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
    description?: string | null;
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

function asRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
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

function normalizeRecommendationInput(input: BookRecommendationInput | unknown): BookRecommendationInput {
    const root = asRecord(input);
    const collectionAnalysis = asRecord(root.collection_analysis);
    const unreadPriorityNote = typeof collectionAnalysis.unread_priority_note === "string"
        ? collectionAnalysis.unread_priority_note
        : "Buku yang belum selesai di koleksi diprioritaskan sebelum rekomendasi baru ketika relevan.";

    return {
        ...root,
        collection_analysis: {
            ...collectionAnalysis,
            dominant_pattern_summary: collectionAnalysis.dominant_pattern_summary ?? unreadPriorityNote,
            similarity_priority_note: collectionAnalysis.similarity_priority_note ?? unreadPriorityNote,
            blind_spot_note: collectionAnalysis.blind_spot_note ?? "Kategori penyeimbang bersifat opsional setelah bacaan utama.",
            unread_priority_note: unreadPriorityNote,
            gaps: Array.isArray(collectionAnalysis.gaps)
                ? collectionAnalysis.gaps.map((gap) => ({ ...asRecord(gap), priority: asRecord(gap).priority ?? "secondary" }))
                : [],
        },
        recommended_categories: Array.isArray(root.recommended_categories)
            ? root.recommended_categories.map((category) => ({
                ...asRecord(category),
                recommendation_mode: asRecord(category).recommendation_mode ?? "profile_fit",
            }))
            : [],
        balancing_suggestions: Array.isArray(root.balancing_suggestions) ? root.balancing_suggestions : [],
        reading_path: Array.isArray(root.reading_path)
            ? root.reading_path.map((step) => ({ ...asRecord(step), source: asRecord(step).source ?? "new" }))
            : [],
        warnings: Array.isArray(root.warnings) ? root.warnings : [],
    } as BookRecommendationInput;
}

export function normalizeBookRecommendation(input: BookRecommendationInput | unknown): BookRecommendation {
    const normalizedInput = normalizeRecommendationInput(input);
    const seenCategories = new Set<string>();
    let nextReadingOrder = 1;

    const parsed = bookRecommendationSchema.parse(normalizedInput);

    const recommended_categories = [...parsed.recommended_categories]
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
    const reading_path = parsed.reading_path
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
        ...parsed,
        recommended_categories,
        balancing_suggestions: parsed.balancing_suggestions.slice(0, 2),
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
    settings: unknown;
    collectionPattern: CollectionPattern;
    latestBookInsight: unknown;
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

Buat rekomendasi buku yang selektif, ranked, personal, dan terutama mengikuti pola koleksi pengguna.
Gunakan bahasa Indonesia.
Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar, tanpa teks pembuka.

Filosofi kurasi:
1. Baca pola koleksi pengguna terlebih dahulu.
2. Rekomendasikan kategori dan buku yang mirip dengan koleksi pengguna.
3. Gunakan profil kepribadian hanya sebagai konteks pendukung.
4. Kategori blind spot/growth hanya muncul sebagai penyeimbang sekunder, bukan prioritas utama.

Jangan bersikap seperti: "karena kepribadian Anda punya kelemahan, baca ini dulu."
Bersikaplah seperti: "berdasarkan pola koleksi dan bacaan Anda, ini yang paling dekat; setelah itu ada opsi penyeimbang."

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
    "dominant_pattern_summary": "string",
    "similarity_priority_note": "string",
    "blind_spot_note": "string",
    "unread_priority_note": "string",
    "gaps": [
      {
        "category": "string",
        "reason": "string",
        "priority": "secondary"
      }
    ]
  },
  "category_ranking_logic": "string",
  "recommended_categories": [
    {
      "rank": 1,
      "name": "string",
      "fit_score": "high | medium",
      "recommendation_mode": "similar_to_collection | from_unfinished_collection | profile_fit | balancing_blind_spot",
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
  "balancing_suggestions": [
    {
      "category": "string",
      "reason": "string",
      "books": [
        {
          "title": "string",
          "author": "string",
          "why_optional": "string"
        }
      ]
    }
  ],
  "reading_path": [
    {
      "step": 1,
      "source": "collection | new | balancing",
      "title": "string",
      "category": "string",
      "focus": "string",
      "reason": "string"
    }
  ],
  "warnings": ["string"]
}

Aturan ranking wajib:
- Urutan prioritas: dominant collection categories -> unfinished books in dominant categories -> similar new books -> profile fit -> balancing/blind spot.
- Jika koleksi punya 5+ buku, dua kategori pertama tidak boleh recommendation_mode "balancing_blind_spot".
- Jika koleksi punya 5+ buku dan kategori dominan jelas, 60-70% rekomendasi utama harus selaras dengan pola koleksi.
- Jika koleksi kosong, fallback ke profil dan analisis.
- Jika koleksi kurang dari 3 buku, pakai koleksi secara ringan dan jelaskan confidence lebih rendah.
- Jika kategori dominan punya buku owned/reading/wishlist, masukkan buku itu ke read_from_collection_first sebelum buku baru.
- Finished books adalah sinyal minat terkuat, tetapi jangan direkomendasikan sebagai item normal.
- Jangan merekomendasikan buku finished kecuali sebagai catatan reread di warnings.
- Wishlist memengaruhi ranking, tetapi lebih rendah dari owned, reading, dan finished.
- Tampilkan hanya 3 sampai 5 recommended_categories.
- Total rekomendasi utama harus 6 sampai 12 item.
- balancing_suggestions hanya 0 sampai 2 kategori dan bersifat opsional.
- collection_analysis.gaps harus berisi area yang belum banyak terwakili, dengan priority "secondary".
- Jangan gunakan kategori blind spot sebagai rank #1 kecuali collectionPattern sendiri kuat di kategori itu.
- Jangan memakai frasa "Kelemahan Anda", "Anda harus memperbaiki", atau "wajib karena blind spot".
- Gunakan frasa lembut seperti "sebagai penyeimbang", "untuk memperluas sudut pandang", "area yang belum banyak muncul di koleksi", dan "opsional setelah bacaan utama".
- Jangan mengarang buku dalam koleksi pengguna.
- Untuk buku koleksi, bookId, title, author, dan status harus persis sama dengan data database.
- Buku baru harus buku nyata, bukan judul fiktif.
- related_profile_factors hanya boleh memakai faktor yang ada di daftar faktor tersedia.
- Jangan menyebut RIASEC jika RIASEC tidak ada di daftar faktor tersedia.
- Jangan mengarang tipe, skor Big Five, atau data profil yang tidak ada.
- reading_order harus urut lintas semua item utama, mulai dari 1.
- reading_path harus menempatkan source "collection" atau "new" sebelum "balancing" jika koleksi memiliki cukup sinyal.
- collection_analysis.owned_count harus sama dengan ${ownedCount}.
- collection_analysis.unfinished_count harus sama dengan ${unfinishedBooks.length}.
- collection_analysis.finished_count harus sama dengan ${finishedBooks.length}.

Ringkasan pola koleksi deterministik:
${JSON.stringify(context.collectionPattern, null, 2)}

Faktor profil yang tersedia:
${context.availableFactors.length ? context.availableFactors.map((factor) => `- ${factor}`).join("\n") : "- Tidak ada faktor eksplisit"}

Profil tersimpan:
${JSON.stringify(context.profile, null, 2)}

Pengaturan pengguna:
${JSON.stringify(context.settings, null, 2)}

Analisis JSON tersimpan:
${JSON.stringify(context.analysisJson, null, 2)}

Buku koleksi belum selesai:
${JSON.stringify(unfinishedBooks, null, 2)}

Buku koleksi selesai:
${JSON.stringify(finishedBooks, null, 2)}

Rekomendasi buku terakhir, jika ada:
${JSON.stringify(context.latestBookInsight, null, 2)}

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
- Total rekomendasi utama harus 6 sampai 12 item.
- Setiap kategori utama harus memiliki minimal satu item di read_from_collection_first atau new_recommendations.
- recommendation_mode harus salah satu dari similar_to_collection, from_unfinished_collection, profile_fit, balancing_blind_spot.
- Gunakan read_from_collection_first untuk buku koleksi yang belum selesai.
- Buku koleksi hanya boleh memakai status owned, reading, atau wishlist.
- Jangan masukkan buku finished sebagai rekomendasi normal.
- Jangan mengarang buku koleksi; bookId, title, author, dan status harus persis dari input awal jika memakai buku koleksi.
- Kategori penyeimbang harus masuk balancing_suggestions atau category mode balancing_blind_spot di posisi akhir.
- balancing_suggestions maksimal 2 kategori.
- Wajib memiliki collection_analysis dengan owned_count, unfinished_count, finished_count, dominant_categories, dominant_pattern_summary, similarity_priority_note, blind_spot_note, unread_priority_note, dan gaps.
- Jika output terlalu panjang, pertahankan kategori yang paling mirip koleksi dan pangkas item prioritas terendah.
- Hindari bahasa korektif seperti "kelemahan Anda" atau "harus memperbaiki".

Error validasi:
${validationMessage}

Output tidak valid:
${invalidText}`;
}
