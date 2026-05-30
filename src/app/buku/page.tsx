"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { BookOpen, Loader2, Search, Sparkles, Trash2 } from "lucide-react";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import { QualityWarningList } from "@/components/QualityWarnings";
import { formatDateTime } from "@/lib/analysis-format";
import type { BookRecommendation } from "@/lib/book-recommendations";
import type { ProfileQualityWarning } from "@/lib/profile-consistency";

type TabId = "recommendations" | "collection" | "overview";

type UserBook = {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    categories: string[];
    thumbnail: string | null;
    isbn10: string | null;
    isbn13: string | null;
    publishedAt: string | null;
    source: string | null;
    sourceId: string | null;
    status: "owned" | "reading" | "finished" | "wishlist";
    rating: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

type CollectionFilter = "all" | "owned" | "reading" | "finished" | "wishlist" | "unfinished";
type CollectionSort = "newest" | "title" | "status" | "author";

type BookCandidate = {
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

interface BookModuleState {
    profile: {
        id: string;
        name: string;
    } | null;
    latestAnalysis: {
        id: string;
        createdAt: string;
        model: string;
        profile: {
            name: string;
        };
    } | null;
    latestBookInsight: {
        id: string;
        createdAt: string;
        model: string | null;
        recommendation: BookRecommendation;
    } | null;
    canRecommend: boolean;
    emptyState: "no_profile" | "no_analysis" | "ready";
    message: string;
}

type BookRecommendationCategory = BookRecommendation["recommended_categories"][number] & {
    books?: BookRecommendation["recommended_categories"][number]["new_recommendations"];
};
type BookRecommendationResponse = {
    recommendation?: unknown;
    bookInsight?: {
        id?: unknown;
        createdAt?: unknown;
        model?: unknown;
    } | null;
};

const tabs: Array<{ id: TabId; label: string }> = [
    { id: "recommendations", label: "Rekomendasi" },
    { id: "collection", label: "Koleksi Saya" },
    { id: "overview", label: "Gambaran & Jalur" },
];

const fitScoreLabels: Record<string, string> = {
    high: "Kecocokan Tinggi",
    medium: "Kecocokan Sedang",
};

const priorityLabels: Record<string, string> = {
    must_read: "Prioritas Awal",
    recommended: "Direkomendasikan",
    optional: "Opsional",
};

const difficultyLabels: Record<string, string> = {
    beginner: "Pemula",
    intermediate: "Menengah",
    advanced: "Lanjutan",
};

const recommendationModeLabels: Record<BookRecommendation["recommended_categories"][number]["recommendation_mode"], string> = {
    similar_to_collection: "Mirip dengan Koleksi Anda",
    from_unfinished_collection: "Baca dari Koleksi Anda",
    profile_fit: "Selaras dengan Profil",
    balancing_blind_spot: "Perspektif Tambahan",
};

const pathSourceLabels: Record<BookRecommendation["reading_path"][number]["source"], string> = {
    collection: "Koleksi",
    new: "Baru",
    balancing: "Perspektif Tambahan",
};

const statusLabels: Record<UserBook["status"], string> = {
    owned: "Dimiliki",
    reading: "Sedang Dibaca",
    finished: "Selesai",
    wishlist: "Ingin Dibaca",
};

const collectionFilters: Array<{ value: CollectionFilter; label: string }> = [
    { value: "all", label: "Semua" },
    { value: "owned", label: "Dimiliki" },
    { value: "reading", label: "Sedang Dibaca" },
    { value: "finished", label: "Selesai" },
    { value: "wishlist", label: "Ingin Dibaca" },
    { value: "unfinished", label: "Belum Selesai" },
];

const collectionSortOptions: Array<{ value: CollectionSort; label: string }> = [
    { value: "newest", label: "Terbaru Ditambahkan" },
    { value: "title", label: "Judul AZ" },
    { value: "status", label: "Status" },
    { value: "author", label: "Penulis" },
];

const sourceLabels: Record<BookCandidate["source"], string> = {
    google_books: "Google Books",
    open_library: "Open Library",
    ai_fallback: "AI fallback",
};

function excerpt(value?: string | null, maxLength = 180) {
    if (!value) return "";
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? value as T[] : [];
}

function asString(value: unknown, fallback = "") {
    return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeRecommendationForDisplay(value: unknown): BookRecommendation | null {
    if (!isRecord(value) || typeof value.summary !== "string" || !Array.isArray(value.recommended_categories)) {
        return null;
    }

    const collectionAnalysis = isRecord(value.collection_analysis) ? value.collection_analysis : {};
    const recommendedCategories = value.recommended_categories.map((category, index) => {
        const categoryRecord = isRecord(category) ? category : {};
        const newRecommendations = Array.isArray(categoryRecord.new_recommendations)
            ? categoryRecord.new_recommendations
            : asArray(categoryRecord.books);

        return {
            ...categoryRecord,
            rank: asNumber(categoryRecord.rank, index + 1),
            name: asString(categoryRecord.name, `Kategori ${index + 1}`),
            fit_score: asString(categoryRecord.fit_score, "medium"),
            recommendation_mode: asString(categoryRecord.recommendation_mode, "profile_fit"),
            priority_reason: asString(categoryRecord.priority_reason, asString(categoryRecord.collection_context, "Kategori ini dipilih dari sinyal koleksi dan profil yang tersedia.")),
            related_profile_factors: asArray<string>(categoryRecord.related_profile_factors),
            collection_context: asString(categoryRecord.collection_context, asString(categoryRecord.priority_reason, "Konteks koleksi belum tersedia untuk kategori ini.")),
            read_from_collection_first: asArray(categoryRecord.read_from_collection_first),
            new_recommendations: newRecommendations,
        };
    });

    return {
        ...value,
        summary: value.summary,
        collection_analysis: {
            ...collectionAnalysis,
            owned_count: asNumber(collectionAnalysis.owned_count),
            unfinished_count: asNumber(collectionAnalysis.unfinished_count),
            finished_count: asNumber(collectionAnalysis.finished_count),
            dominant_categories: asArray<string>(collectionAnalysis.dominant_categories),
            dominant_pattern_summary: asString(collectionAnalysis.dominant_pattern_summary, "Pola koleksi belum cukup spesifik, jadi rekomendasi memakai sinyal profil dan analisis sebagai pendukung."),
            similarity_priority_note: asString(collectionAnalysis.similarity_priority_note, "Rekomendasi utama diprioritaskan dari kategori yang paling dekat dengan koleksi Anda."),
            blind_spot_note: asString(collectionAnalysis.blind_spot_note, "Kategori penyeimbang bersifat opsional setelah bacaan utama."),
            unread_priority_note: asString(collectionAnalysis.unread_priority_note, "Buku yang belum selesai di koleksi diprioritaskan sebelum rekomendasi baru ketika relevan."),
            gaps: asArray(collectionAnalysis.gaps),
        },
        category_ranking_logic: asString(value.category_ranking_logic, "Kategori disusun dari kecocokan profil, pola koleksi, dan prioritas bacaan yang belum selesai."),
        recommended_categories: recommendedCategories,
        balancing_suggestions: asArray(value.balancing_suggestions),
        reading_path: asArray(value.reading_path),
        warnings: asArray<string>(value.warnings),
    } as BookRecommendation;
}

function countRecommendationItems(recommendation: BookRecommendation | null) {
    return recommendation?.recommended_categories.reduce(
        (total, category) => total + (category.read_from_collection_first ?? []).length + (category.new_recommendations ?? []).length,
        0
    ) ?? 0;
}

function EmptyPanel({
    title,
    message,
    href,
    action,
}: {
    title: string;
    message: string;
    href?: string;
    action?: string;
}) {
    return (
        <SurfaceCard title={title}>
            <div className="py-8 text-center">
                <p className="text-sm text-slate-400">{message}</p>
                {href && action && (
                    <Link href={href} className="mt-5 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                        {action}
                    </Link>
                )}
            </div>
        </SurfaceCard>
    );
}

function CollectionRecommendationCard({
    book,
}: {
    book: BookRecommendation["recommended_categories"][number]["read_from_collection_first"][number];
}) {
    return (
        <article className="rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-cyan-300">Urutan {book.reading_order}</p>
                    <h3 className="mt-1 font-semibold text-slate-100">{book.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{book.author || "Penulis tidak tersedia"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full border border-amber-300/25 px-2 py-1 text-[11px] text-amber-200">
                        {statusLabels[book.status]}
                    </span>
                    <span className="rounded-full border border-cyan-300/25 px-2 py-1 text-[11px] text-cyan-200">
                        {priorityLabels[book.priority] ?? book.priority}
                    </span>
                </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{book.why_read_this_first}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Paling Berguna Untuk</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">{book.best_for}</p>
        </article>
    );
}

function NewRecommendationCard({
    book,
}: {
    book: BookRecommendation["recommended_categories"][number]["new_recommendations"][number];
}) {
    return (
        <article className="rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-cyan-300">Urutan {book.reading_order}</p>
                    <h3 className="mt-1 font-semibold text-slate-100">{book.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{book.author}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full border border-cyan-300/25 px-2 py-1 text-[11px] text-cyan-200">
                        {priorityLabels[book.priority] ?? book.priority}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-slate-400">
                        {difficultyLabels[book.difficulty] ?? book.difficulty}
                    </span>
                </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{book.why_recommended}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Paling Berguna Untuk</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">{book.best_for}</p>
        </article>
    );
}

function CategoryCard({
    category,
}: {
    category: BookRecommendationCategory;
}) {
    const collectionBooks = category.read_from_collection_first ?? [];
    const newBooks = category.new_recommendations ?? category.books ?? [];
    const hasCollectionBooks = collectionBooks.length > 0;
    const hasNewRecommendations = newBooks.length > 0;

    return (
        <SurfaceCard title={`${category.rank}. ${category.name}`}>
            <div className="mb-5 max-w-3xl">
                <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-xs text-cyan-300">
                    {fitScoreLabels[category.fit_score] ?? category.fit_score}
                </span>
                <span className="ml-2 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {recommendationModeLabels[category.recommendation_mode]}
                </span>
                <p className="mt-4 text-sm leading-6 text-slate-400">{category.priority_reason}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">{category.collection_context}</p>
                {(category.related_profile_factors ?? []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {(category.related_profile_factors ?? []).map((factor) => (
                            <span key={factor} className="rounded-full bg-cyan-300/10 px-2 py-1 text-[11px] text-cyan-200">
                                {factor}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <div className="space-y-5">
                {hasCollectionBooks && (
                    <section>
                        <div className="mb-3">
                            <h3 className="font-semibold text-slate-100">Baca dari Koleksi Anda</h3>
                            {!hasNewRecommendations && (
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Kategori ini sudah cukup terwakili oleh koleksi Anda, jadi mulai dari buku yang sudah tersimpan.
                                </p>
                            )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {collectionBooks.map((book) => (
                                <CollectionRecommendationCard key={`${category.name}-collection-${book.bookId ?? book.reading_order}`} book={book} />
                            ))}
                        </div>
                    </section>
                )}

                {hasNewRecommendations && (
                    <section>
                        <div className="mb-3">
                            <h3 className="font-semibold text-slate-100">Rekomendasi Serupa</h3>
                            {!hasCollectionBooks && (
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Buku baru ini dipilih karena masih dekat dengan pola kategori dan minat koleksi Anda.
                                </p>
                            )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {newBooks.map((book) => (
                                <NewRecommendationCard key={`${category.name}-new-${book.reading_order}-${book.title}`} book={book} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </SurfaceCard>
    );
}

function CollectionPatternOverview({ recommendation }: { recommendation: BookRecommendation }) {
    const analysis = recommendation.collection_analysis;
    const dominantCategories = analysis.dominant_categories ?? [];

    return (
        <SurfaceCard title="Pola Koleksi Anda" eyebrow="Sinyal Utama Rekomendasi">
            <p className="text-sm leading-6 text-slate-400">{analysis.dominant_pattern_summary}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kategori Dominan</p>
                    <p className="mt-2 text-sm text-slate-300">
                        {dominantCategories.length ? dominantCategories.join(", ") : "Belum cukup data koleksi."}
                    </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Koleksi</p>
                    <p className="mt-2 text-sm text-slate-300">
                        {analysis.owned_count} buku total, {analysis.unfinished_count} belum selesai, {analysis.finished_count} selesai
                    </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Prioritas</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{analysis.similarity_priority_note}</p>
                </div>
            </div>
            <div className="mt-4 rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Baca dari Koleksi Anda</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{analysis.unread_priority_note}</p>
            </div>
        </SurfaceCard>
    );
}

function BalancingSuggestions({ recommendation }: { recommendation: BookRecommendation }) {
    const suggestions = recommendation.balancing_suggestions ?? [];
    const gaps = recommendation.collection_analysis.gaps ?? [];

    if (suggestions.length === 0 && gaps.length === 0) return null;

    return (
        <SurfaceCard title="Perspektif Tambahan" eyebrow="Opsional">
            <p className="text-sm leading-6 text-slate-400">{recommendation.collection_analysis.blind_spot_note}</p>
            {suggestions.length > 0 && (
                <div className="mt-5 grid gap-4">
                    {suggestions.map((suggestion) => (
                        <article key={suggestion.category} className="rounded-lg border border-white/10 bg-black/25 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="font-semibold text-slate-100">{suggestion.category}</h3>
                                <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-xs text-cyan-200">
                                    Opsional
                                </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{suggestion.reason}</p>
                            {(suggestion.books ?? []).length > 0 && (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {(suggestion.books ?? []).map((book) => (
                                        <div key={`${suggestion.category}-${book.title}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <p className="font-medium text-slate-200">{book.title}</p>
                                            <p className="mt-1 text-sm text-slate-400">{book.author}</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">{book.why_optional}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
            {suggestions.length === 0 && (
                <div className="mt-5 grid gap-4">
                    {gaps.map((gap) => (
                        <article key={gap.category} className="rounded-lg border border-white/10 bg-black/25 p-4">
                            <h3 className="font-semibold text-slate-100">{gap.category}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{gap.reason}</p>
                        </article>
                    ))}
                </div>
            )}
        </SurfaceCard>
    );
}

function ReadingPathCard({ recommendation }: { recommendation: BookRecommendation }) {
    const readingPath = recommendation.reading_path ?? [];

    if (readingPath.length === 0) return null;

    return (
        <SurfaceCard title="Jalur Baca" eyebrow="Urutan yang Disarankan">
            <div className="space-y-4">
                {readingPath.map((step) => (
                    <article key={`${step.step}-${step.category}-${step.title}`} className="rounded-lg border border-white/10 bg-black/25 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-sm font-semibold text-slate-950">
                                {step.step}
                            </span>
                            <div>
                                <h3 className="font-semibold text-slate-100">{step.title}</h3>
                                <p className="text-sm text-slate-400">
                                    {step.category} - {pathSourceLabels[step.source]} - {step.focus}
                                </p>
                            </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-500">{step.reason}</p>
                    </article>
                ))}
            </div>
        </SurfaceCard>
    );
}

export default function BukuPage() {
    const { status } = useSession();
    const [activeTab, setActiveTab] = useState<TabId>("recommendations");
    const [moduleState, setModuleState] = useState<BookModuleState | null>(null);
    const [collection, setCollection] = useState<UserBook[]>([]);
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [candidates, setCandidates] = useState<BookCandidate[]>([]);
    const [lookupCompleted, setLookupCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [collectionError, setCollectionError] = useState<string | null>(null);
    const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("all");
    const [collectionSearch, setCollectionSearch] = useState("");
    const [collectionSort, setCollectionSort] = useState<CollectionSort>("newest");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [qualityWarnings, setQualityWarnings] = useState<ProfileQualityWarning[]>([]);

    const recommendation = moduleState?.latestBookInsight?.recommendation ?? null;
    const totalBooks = useMemo(() => {
        return countRecommendationItems(recommendation);
    }, [recommendation]);
    const collectionCategories = useMemo(() => {
        return Array.from(new Set(collection.flatMap((book) => book.categories))).sort((a, b) => a.localeCompare(b));
    }, [collection]);
    const filteredCollection = useMemo(() => {
        const query = collectionSearch.trim().toLowerCase();

        return collection
            .filter((book) => {
                if (collectionFilter === "unfinished") {
                    return ["owned", "reading", "wishlist"].includes(book.status);
                }

                if (collectionFilter !== "all") {
                    return book.status === collectionFilter;
                }

                return true;
            })
            .filter((book) => {
                if (!query) return true;
                return book.title.toLowerCase().includes(query) || (book.author ?? "").toLowerCase().includes(query);
            })
            .filter((book) => {
                if (selectedCategory === "all") return true;
                return book.categories.includes(selectedCategory);
            })
            .sort((a, b) => {
                if (collectionSort === "title") return a.title.localeCompare(b.title);
                if (collectionSort === "author") return (a.author ?? "").localeCompare(b.author ?? "");
                if (collectionSort === "status") return statusLabels[a.status].localeCompare(statusLabels[b.status]);
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [collection, collectionFilter, collectionSearch, collectionSort, selectedCategory]);

    function mapCollectionErrorStatus(statusCode: number, fallback?: string) {
        if (statusCode === 401) return "Masuk terlebih dahulu untuk mengakses koleksi buku.";
        return fallback || "Koleksi buku gagal dimuat. Coba muat ulang.";
    }

    const loadCollection = useCallback(async () => {
        const response = await fetch("/api/books/collection");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(mapCollectionErrorStatus(response.status, data?.error));
        }

        setCollection(data.books ?? []);
        setCollectionError(null);
    }, []);

    const loadQuality = useCallback(async () => {
        const response = await fetch("/api/profile/quality");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || "Kualitas data gagal dimuat.");
        }

        setQualityWarnings((data.warnings ?? []).filter((warning: ProfileQualityWarning) => warning.area === "books"));
    }, []);

    const loadBookState = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
        if (showLoading) {
            setLoading(true);
        }
        setError(null);
        setCollectionError(null);

        const stateRequest = fetch("/api/books/state")
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.error || "Rekomendasi buku gagal dimuat.");
                }
                setModuleState(data);
            })
            .catch((loadError) => {
                console.error("Book state request failed:", loadError);
                setError(loadError instanceof Error ? loadError.message : "Rekomendasi buku gagal dimuat.");
            });

        const collectionRequest = loadCollection()
            .catch((loadError) => {
                console.error("Book collection request failed:", loadError);
                setCollection([]);
                setCollectionError("Koleksi buku gagal dimuat. Coba muat ulang.");
            });
        const qualityRequest = loadQuality()
            .catch((loadError) => {
                console.error("Book quality request failed:", loadError);
                setQualityWarnings([]);
            });

        try {
            await Promise.allSettled([stateRequest, collectionRequest, qualityRequest]);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [loadCollection, loadQuality]);

    useEffect(() => {
        if (status === "authenticated") {
            loadBookState();
            return;
        }

        if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [loadBookState, status]);

    async function searchBooks() {
        try {
            setSearching(true);
            setMessage(null);
            setError(null);
            setLookupCompleted(false);
            setCandidates([]);

            const response = await fetch("/api/books/lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, author: author || undefined }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Gagal mencari metadata buku.");
            }

            setCandidates(data.candidates ?? []);
            setLookupCompleted(true);
        } catch (searchError) {
            console.error("Book lookup request failed:", searchError);
            setError(searchError instanceof Error ? searchError.message : "Gagal mencari metadata buku.");
            setLookupCompleted(false);
        } finally {
            setSearching(false);
        }
    }

    async function addBook(candidate: BookCandidate) {
        try {
            setSaving(true);
            setMessage(null);
            setError(null);

            const response = await fetch("/api/books/collection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...candidate,
                    status: "owned",
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Gagal menyimpan buku.");
            }

            setMessage(data?.message || "Buku ditambahkan ke koleksi.");
            await loadCollection();
            await loadQuality();
        } catch (saveError) {
            console.error("Book save request failed:", saveError);
            setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan buku.");
        } finally {
            setSaving(false);
        }
    }

    async function updateBookStatus(bookId: string, nextStatus: UserBook["status"]) {
        try {
            const response = await fetch(`/api/books/collection/${bookId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Gagal memperbarui buku.");
            }

            setCollection((current) => current.map((book) => book.id === bookId ? data.book : book));
            await loadQuality();
        } catch (updateError) {
            console.error("Book status update failed:", updateError);
            setError(updateError instanceof Error ? updateError.message : "Gagal memperbarui buku.");
        }
    }

    async function deleteBook(bookId: string) {
        try {
            const response = await fetch(`/api/books/collection/${bookId}`, { method: "DELETE" });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Gagal menghapus buku.");
            }

            setCollection((current) => current.filter((book) => book.id !== bookId));
            await loadQuality();
        } catch (deleteError) {
            console.error("Book delete failed:", deleteError);
            setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus buku.");
        }
    }

    async function generateRecommendations() {
        try {
            setGenerating(true);
            setError(null);
            setMessage(null);

            const response = await fetch("/api/books/recommend", { method: "POST" });
            const data = await response.json() as BookRecommendationResponse | unknown;

            if (!response.ok) {
                throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Rekomendasi buku gagal dibuat.");
            }

            const responseRecord = isRecord(data) ? data : {};
            const rawRecommendation = "recommendation" in responseRecord ? responseRecord.recommendation : data;
            const bookInsight = isRecord(responseRecord.bookInsight) ? responseRecord.bookInsight : null;
            const normalizedRecommendation = normalizeRecommendationForDisplay(rawRecommendation);

            if (!normalizedRecommendation) {
                if (process.env.NODE_ENV === "development") {
                    console.warn("Unrecognized book recommendation response shape.");
                }
                setError("Format rekomendasi tidak dikenali.");
                return;
            }

            const recommendationItemCount = countRecommendationItems(normalizedRecommendation);

            setModuleState((current) => ({
                profile: current?.profile ?? null,
                latestAnalysis: current?.latestAnalysis ?? null,
                canRecommend: current?.canRecommend ?? true,
                emptyState: current?.emptyState ?? "ready",
                message: current?.message ?? "Rekomendasi buku siap dibuat.",
                ...current,
                latestBookInsight: {
                    id: asString(bookInsight?.id, current?.latestBookInsight?.id ?? "local-generated"),
                    createdAt: asString(bookInsight?.createdAt, new Date().toISOString()),
                    model: typeof bookInsight?.model === "string" ? bookInsight.model : current?.latestBookInsight?.model ?? null,
                    recommendation: normalizedRecommendation,
                },
            }));
            setActiveTab("recommendations");
            setMessage(recommendationItemCount > 0
                ? "Rekomendasi buku berhasil dibuat."
                : "Rekomendasi berhasil dibuat, tetapi hasilnya masih kosong. Coba lengkapi koleksi atau profil.");
            await loadBookState({ showLoading: false });
        } catch (generateError) {
            console.error("Book recommendation request failed:", generateError);
            setError(generateError instanceof Error ? generateError.message : "Rekomendasi buku gagal dibuat.");
        } finally {
            setGenerating(false);
        }
    }

    if (loading || status === "loading") {
        return (
            <SurfaceCard title="Buku">
                <div className="flex min-h-72 flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                    <p className="mt-4 text-sm text-slate-400">Memuat data buku...</p>
                </div>
            </SurfaceCard>
        );
    }

    if (status !== "authenticated") {
        return (
            <EmptyPanel
                title="Buku"
                message="Masuk terlebih dahulu untuk mengelola koleksi dan mendapatkan rekomendasi buku."
                href="/login"
                action="Masuk"
            />
        );
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                {error && (
                    <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-100">
                        {message}
                    </div>
                )}
                {collectionError && (
                    <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">
                        {collectionError}
                    </div>
                )}

                <SurfaceCard title="Buku" eyebrow="Koleksi dan Rekomendasi">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    activeTab === tab.id
                                        ? "bg-cyan-300 text-slate-950"
                                        : "border border-white/10 text-slate-300 hover:bg-white/5"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </SurfaceCard>

                {activeTab === "recommendations" && (
                    <>
                        <SurfaceCard title="Rekomendasi Buku" eyebrow="Berbasis Analisis dan Koleksi">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    {moduleState?.latestAnalysis ? (
                                        <>
                                            <p className="text-sm text-slate-400">Sumber: analisis {formatDateTime(moduleState.latestAnalysis.createdAt)}</p>
                                            <p className="mt-2 text-sm text-slate-500">Profil: {moduleState.profile?.name}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-400">Rekomendasi membutuhkan profil dan analisis tersimpan.</p>
                                    )}
                                </div>
                                <button
                                    onClick={generateRecommendations}
                                    disabled={generating || !moduleState?.canRecommend}
                                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                                >
                                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {generating ? "Sedang menyusun rekomendasi buku..." : recommendation ? "Buat Ulang Rekomendasi" : "Buat Rekomendasi Buku"}
                                </button>
                            </div>
                        </SurfaceCard>

                        {moduleState?.emptyState === "no_profile" && (
                            <EmptyPanel
                                title="Profil Belum Ada"
                                message="Bangun profil terlebih dahulu untuk mendapatkan rekomendasi buku."
                                href="/bangun-profil"
                                action="Bangun Profil"
                            />
                        )}

                        {moduleState?.emptyState === "no_analysis" && (
                            <EmptyPanel
                                title="Analisis Belum Ada"
                                message="Buat analisis terlebih dahulu agar rekomendasi buku lebih personal."
                                href="/analisis"
                                action="Buat Analisis"
                            />
                        )}

                        {moduleState?.emptyState === "ready" && !recommendation && (
                            <SurfaceCard title="Belum Ada Rekomendasi">
                                <div className="rounded-lg border border-white/10 bg-black/25 p-5">
                                    <BookOpen className="h-6 w-6 text-cyan-300" />
                                    <p className="mt-3 text-sm leading-6 text-slate-400">
                                        Buat rekomendasi dari profil, analisis terbaru, dan koleksi buku yang sudah kamu simpan.
                                    </p>
                                </div>
                            </SurfaceCard>
                        )}

                        {recommendation && (
                            <>
                                <SurfaceCard title="Ringkasan">
                                    <p className="text-sm leading-6 text-slate-400">{recommendation.summary}</p>
                                    {recommendation.warnings.length > 0 && (
                                        <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
                                            <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Catatan Rekomendasi</p>
                                            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100">
                                                {recommendation.warnings.map((warning) => (
                                                    <li key={warning}>{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Logika Ranking Kategori</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-400">{recommendation.category_ranking_logic}</p>
                                    </div>
                                </SurfaceCard>
                                <CollectionPatternOverview recommendation={recommendation} />
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-slate-100">Rekomendasi Utama</h2>
                                    {recommendation.recommended_categories.map((category) => (
                                        <CategoryCard key={category.name} category={category} />
                                    ))}
                                </div>
                                <BalancingSuggestions recommendation={recommendation} />
                                <ReadingPathCard recommendation={recommendation} />
                            </>
                        )}
                    </>
                )}

                {activeTab === "collection" && (
                    <div className="space-y-6">
                        <SurfaceCard title="Koleksi Buku Saya">
                            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                                <label className="block">
                                    <span className="text-sm text-slate-400">Judul buku</span>
                                    <input
                                        value={title}
                                        onChange={(event) => {
                                            setTitle(event.target.value);
                                            setLookupCompleted(false);
                                            setCandidates([]);
                                        }}
                                        className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
                                        placeholder="Judul buku"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm text-slate-400">Penulis</span>
                                    <input
                                        value={author}
                                        onChange={(event) => {
                                            setAuthor(event.target.value);
                                            setLookupCompleted(false);
                                            setCandidates([]);
                                        }}
                                        className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
                                        placeholder="Opsional"
                                    />
                                </label>
                                <button
                                    onClick={searchBooks}
                                    disabled={searching || !title.trim()}
                                    className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                                >
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    {searching ? "Mencari metadata buku..." : "Cari Buku"}
                                </button>
                            </div>
                        </SurfaceCard>

                        {candidates.length > 0 && (
                            <SurfaceCard title="Kandidat Buku">
                                <div className="grid gap-4">
                                    {candidates.map((candidate) => (
                                        <article key={`${candidate.source}-${candidate.sourceId ?? candidate.title}`} className="flex gap-4 rounded-lg border border-white/10 bg-black/25 p-4">
                                            {candidate.thumbnail && (
                                                <Image
                                                    src={candidate.thumbnail}
                                                    alt=""
                                                    width={64}
                                                    height={96}
                                                    unoptimized
                                                    className="h-24 w-16 rounded object-cover"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-cyan-300">{sourceLabels[candidate.source]}</p>
                                                <h3 className="mt-1 font-semibold text-slate-100">{candidate.title}</h3>
                                                <p className="mt-1 text-sm text-slate-400">{candidate.author || "Penulis tidak tersedia"}</p>
                                                {candidate.description && (
                                                    <p className="mt-2 text-sm leading-6 text-slate-500">{excerpt(candidate.description)}</p>
                                                )}
                                                {candidate.source === "ai_fallback" && (
                                                    <p className="mt-2 text-sm leading-6 text-amber-200">
                                                        Metadata lengkap belum ditemukan, data ini hanya normalisasi judul/penulis.
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() => addBook(candidate)}
                                                    disabled={saving}
                                                    className="mt-3 rounded-lg border border-cyan-300/25 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:text-slate-500"
                                                >
                                                    Tambahkan ke Koleksi
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </SurfaceCard>
                        )}

                        {lookupCompleted && candidates.length === 0 && (
                            <SurfaceCard title="Buku Tidak Ditemukan">
                                <div className="py-6">
                                    <p className="text-sm leading-6 text-slate-400">
                                        Buku tidak ditemukan. Coba isi judul dan penulis lebih spesifik, atau tambahkan manual.
                                    </p>
                                </div>
                            </SurfaceCard>
                        )}

                        {title.trim() && (
                            <button
                                onClick={() => addBook({ title, author: author || undefined, source: "ai_fallback" })}
                                disabled={saving}
                                className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:text-slate-500"
                            >
                                Tambahkan Manual
                            </button>
                        )}

                        <SurfaceCard title="Daftar Koleksi">
                            <div className="mb-5 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {collectionFilters.map((filter) => (
                                        <button
                                            key={filter.value}
                                            onClick={() => setCollectionFilter(filter.value)}
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                                collectionFilter === filter.value
                                                    ? "bg-cyan-300 text-slate-950"
                                                    : "border border-white/10 text-slate-300 hover:bg-white/5"
                                            }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="block">
                                        <span className="text-sm text-slate-400">Cari judul atau penulis</span>
                                        <input
                                            value={collectionSearch}
                                            onChange={(event) => setCollectionSearch(event.target.value)}
                                            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
                                            placeholder="Judul atau penulis"
                                        />
                                    </label>
                                    {collectionCategories.length > 0 && (
                                        <label className="block">
                                            <span className="text-sm text-slate-400">Kategori</span>
                                            <select
                                                value={selectedCategory}
                                                onChange={(event) => setSelectedCategory(event.target.value)}
                                                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
                                            >
                                                <option value="all">Semua kategori</option>
                                                {collectionCategories.map((category) => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </label>
                                    )}
                                    <label className="block">
                                        <span className="text-sm text-slate-400">Urutkan</span>
                                        <select
                                            value={collectionSort}
                                            onChange={(event) => setCollectionSort(event.target.value as CollectionSort)}
                                            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
                                        >
                                            {collectionSortOptions.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </div>
                            {collection.length === 0 ? (
                                <p className="text-sm text-slate-400">Belum ada buku di koleksi.</p>
                            ) : filteredCollection.length === 0 ? (
                                <p className="text-sm text-slate-400">Tidak ada buku yang cocok dengan filter ini.</p>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredCollection.map((book) => (
                                        <article key={book.id} className="flex gap-4 rounded-lg border border-white/10 bg-black/25 p-4">
                                            {book.thumbnail && (
                                                <Image
                                                    src={book.thumbnail}
                                                    alt=""
                                                    width={64}
                                                    height={96}
                                                    unoptimized
                                                    className="h-24 w-16 rounded object-cover"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-slate-100">{book.title}</h3>
                                                <p className="mt-1 text-sm text-slate-400">{book.author || "Penulis tidak tersedia"}</p>
                                                {book.categories.length > 0 && (
                                                    <p className="mt-2 text-xs text-slate-500">{book.categories.slice(0, 4).join(", ")}</p>
                                                )}
                                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                                    <select
                                                        value={book.status}
                                                        onChange={(event) => updateBookStatus(book.id, event.target.value as UserBook["status"])}
                                                        className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200 outline-none"
                                                    >
                                                        {Object.entries(statusLabels).map(([value, label]) => (
                                                            <option key={value} value={value}>{label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => deleteBook(book.id)}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-red-400/25 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </SurfaceCard>
                    </div>
                )}

                {activeTab === "overview" && (
                    recommendation ? (
                        <div className="space-y-6">
                            <SurfaceCard title="Pola Koleksi Anda">
                                <p className="text-sm leading-6 text-slate-400">{recommendation.collection_analysis.dominant_pattern_summary}</p>
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kategori Dominan</p>
                                        <p className="mt-2 text-sm text-slate-300">
                                            {recommendation.collection_analysis.dominant_categories.length
                                                ? recommendation.collection_analysis.dominant_categories.join(", ")
                                                : "Belum cukup data koleksi."}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Jumlah Koleksi</p>
                                        <p className="mt-2 text-sm text-slate-300">
                                            {recommendation.collection_analysis.owned_count} buku, {recommendation.collection_analysis.unfinished_count} belum selesai
                                        </p>
                                    </div>
                                </div>
                            </SurfaceCard>
                            <SurfaceCard title="Perspektif Tambahan" eyebrow="Opsional">
                                <p className="mb-5 text-sm leading-6 text-slate-400">{recommendation.collection_analysis.blind_spot_note}</p>
                                <div className="grid gap-4">
                                    {recommendation.collection_analysis.gaps.map((gap) => (
                                        <article key={gap.category} className="rounded-lg border border-white/10 bg-black/25 p-4">
                                            <h3 className="font-semibold text-slate-100">{gap.category}</h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">{gap.reason}</p>
                                        </article>
                                    ))}
                                </div>
                            </SurfaceCard>
                            <SurfaceCard title="Jalur Baca yang Disarankan">
                                <div className="space-y-4">
                                    {recommendation.reading_path.map((step) => (
                                        <article key={`${step.step}-${step.category}-${step.title}`} className="rounded-lg border border-white/10 bg-black/25 p-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-sm font-semibold text-slate-950">
                                                    {step.step}
                                                </span>
                                                <div>
                                                    <h3 className="font-semibold text-slate-100">{step.title}</h3>
                                                    <p className="text-sm text-slate-400">
                                                        {step.category} - {pathSourceLabels[step.source]} - {step.focus}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-slate-500">{step.reason}</p>
                                        </article>
                                    ))}
                                </div>
                            </SurfaceCard>
                        </div>
                    ) : (
                        <EmptyPanel
                            title="Gambaran &amp; Jalur"
                            message="Buat rekomendasi buku terlebih dahulu untuk melihat gambaran koleksi dan jalur baca."
                        />
                    )
                )}
            </div>

            <RightRail>
                <SurfaceCard title="Sumber Data">
                    <StatusList
                        items={[
                            { label: "Profil", value: moduleState?.profile?.name ?? "Belum ada" },
                            { label: "Analisis", value: moduleState?.latestAnalysis ? "Terhubung" : "Belum ada" },
                            { label: "Koleksi", value: `${collection.length} buku` },
                            { label: "Kategori Utama", value: String(recommendation?.recommended_categories.length ?? 0) },
                            { label: "Jumlah Rekomendasi", value: String(totalBooks) },
                        ]}
                    />
                </SurfaceCard>
                <SurfaceCard title="Catatan Data Buku">
                    <QualityWarningList warnings={qualityWarnings} emptyMessage="Data buku terlihat cukup siap untuk rekomendasi." limit={4} />
                </SurfaceCard>
                <SurfaceCard title="Prinsip Kurasi">
                    <p className="text-sm leading-6 text-slate-500">
                        Rekomendasi membaca pola koleksi terlebih dahulu. Buku yang belum selesai dan kategori yang mirip koleksi diprioritaskan sebelum perspektif tambahan.
                    </p>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}
