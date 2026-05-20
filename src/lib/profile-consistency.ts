import { defaultSettings, type SettingsPayload } from "@/lib/settings-schema";

export type ProfileWarningSeverity = "info" | "warning" | "critical";
export type ProfileWarningArea = "profile" | "settings" | "analysis" | "books" | "career";
export type ProfileQualityStatus = "low_data" | "needs_review" | "good";

export type ProfileQualityWarning = {
    id: string;
    severity: ProfileWarningSeverity;
    area: ProfileWarningArea;
    title: string;
    message: string;
    actionLabel: string | null;
    actionHref: string | null;
};

type UnknownRecord = Record<string, unknown>;

type BookLike = {
    status?: string | null;
};

type LatestAnalysisLike = {
    parsedJson?: unknown;
} | null;

export type ProfileQualityResult = {
    score: number;
    status: ProfileQualityStatus;
    warnings: ProfileQualityWarning[];
};

export type DashboardConsistencySummary = {
    score: number;
    status: ProfileQualityStatus;
    warningCount: number;
    topWarning: string;
    actionHref: string;
};

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null;
}

function isKnown(value: unknown) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized !== "" && normalized !== "unknown" && normalized !== "belum tahu";
    }

    return true;
}

function getProfileField(profile: unknown, field: string) {
    return isRecord(profile) ? profile[field] : undefined;
}

function getEnneagramRecord(profile: unknown) {
    const nested = getProfileField(profile, "enneagram");
    return isRecord(nested) ? nested : null;
}

function getEnneagramType(profile: unknown) {
    return getEnneagramRecord(profile)?.type ?? getProfileField(profile, "enneagramType");
}

function getEnneagramWing(profile: unknown) {
    return getEnneagramRecord(profile)?.wing ?? getProfileField(profile, "enneagramWing");
}

function getEnneagramTritype(profile: unknown) {
    return getEnneagramRecord(profile)?.tritype ?? getProfileField(profile, "enneagramTritype");
}

function getSettingsArray(settings: Partial<SettingsPayload>, field: keyof SettingsPayload) {
    const value = settings[field];
    return Array.isArray(value) ? value : [];
}

function hasSettingsText(settings: Partial<SettingsPayload>, field: keyof SettingsPayload) {
    return isKnown(settings[field]);
}

function getAnalysisAudit(latestAnalysis: LatestAnalysisLike) {
    const parsedJson = latestAnalysis?.parsedJson;
    if (!isRecord(parsedJson)) return null;

    const audit = parsedJson.consistency_audit;
    if (!isRecord(audit)) return null;

    return {
        frameworks_used: Array.isArray(audit.frameworks_used) ? audit.frameworks_used.filter((item): item is string => typeof item === "string") : [],
        inferred_fields: Array.isArray(audit.inferred_fields) ? audit.inferred_fields.filter((item): item is string => typeof item === "string") : [],
        warnings: Array.isArray(audit.warnings) ? audit.warnings.filter((item): item is string => typeof item === "string") : [],
    };
}

function uniqueWarnings(warnings: ProfileQualityWarning[]) {
    const seen = new Set<string>();
    return warnings.filter((warning) => {
        if (seen.has(warning.id)) return false;
        seen.add(warning.id);
        return true;
    });
}

export function getProfileWarnings(profile: unknown, settingsInput?: Partial<SettingsPayload> | null, latestAnalysis?: LatestAnalysisLike) {
    const settings = settingsInput ?? defaultSettings;
    const warnings: ProfileQualityWarning[] = [];
    const hasProfile = isRecord(profile);
    const enneagramType = getEnneagramType(profile);
    const enneagramWing = getEnneagramWing(profile);
    const tritype = getEnneagramTritype(profile);
    const instinctualVariant = getProfileField(profile, "instinctualVariant");
    const mbti = getProfileField(profile, "mbti");
    const socionics = getProfileField(profile, "socionics");
    const attitudinalPsyche = getProfileField(profile, "attitudinalPsyche");
    const riasec = getProfileField(profile, "riasec");

    if (hasProfile && isKnown(enneagramType) && !isKnown(enneagramWing)) {
        warnings.push({
            id: "profile-enneagram-wing-missing",
            severity: "warning",
            area: "profile",
            title: "Wing Enneagram belum lengkap",
            message: "Enneagram membutuhkan wing, misalnya 5w4 atau 5w6.",
            actionLabel: "Lengkapi Profil",
            actionHref: "/bangun-profil",
        });
    }

    if (hasProfile && isKnown(tritype) && !isKnown(enneagramType)) {
        warnings.push({
            id: "profile-tritype-without-enneagram",
            severity: "warning",
            area: "profile",
            title: "Tipe Enneagram belum diisi",
            message: "Tritype sudah tersedia, tetapi tipe Enneagram inti belum diisi.",
            actionLabel: "Lengkapi Enneagram",
            actionHref: "/bangun-profil",
        });
    }

    if (hasProfile && isKnown(instinctualVariant) && !isKnown(enneagramType)) {
        warnings.push({
            id: "profile-instinct-without-enneagram",
            severity: "warning",
            area: "profile",
            title: "Insting perlu konteks Enneagram",
            message: "Varian instingtual sudah tersedia, tetapi tipe Enneagram inti belum diisi.",
            actionLabel: "Lengkapi Enneagram",
            actionHref: "/bangun-profil",
        });
    }

    if (hasProfile && !isKnown(riasec)) {
        warnings.push({
            id: "profile-riasec-missing",
            severity: "info",
            area: "career",
            title: "RIASEC belum diisi",
            message: "RIASEC belum diisi. Rekomendasi karier akan lebih kuat jika data ini tersedia.",
            actionLabel: "Isi RIASEC",
            actionHref: "/bangun-profil",
        });
    }

    if (hasProfile && isKnown(socionics) && isKnown(mbti)) {
        warnings.push({
            id: "profile-socionics-mbti-independent",
            severity: "info",
            area: "profile",
            title: "Socionics dan MBTI dianalisis terpisah",
            message: "Socionics tidak otomatis sama dengan MBTI. Keduanya akan dianalisis sebagai framework terpisah.",
            actionLabel: null,
            actionHref: null,
        });
    }

    if (hasProfile && isKnown(attitudinalPsyche)) {
        warnings.push({
            id: "profile-ap-independent",
            severity: "info",
            area: "profile",
            title: "Attitudinal Psyche berdiri sendiri",
            message: "Attitudinal Psyche akan dibaca sebagai framework terpisah dari MBTI.",
            actionLabel: null,
            actionHref: null,
        });
    }

    const educationMissing = !hasSettingsText(settings, "educationLevel") &&
        !hasSettingsText(settings, "fieldOfStudy") &&
        !hasSettingsText(settings, "institution") &&
        !hasSettingsText(settings, "graduationStatus");
    if (educationMissing) {
        warnings.push({
            id: "settings-education-missing",
            severity: "info",
            area: "settings",
            title: "Data pendidikan kosong",
            message: "Lengkapi pendidikan dan minat karier agar rekomendasi karier lebih relevan.",
            actionLabel: "Buka Pengaturan",
            actionHref: "/settings",
        });
    }

    const interestsMissing = getSettingsArray(settings, "hobbies").length === 0 &&
        getSettingsArray(settings, "interests").length === 0 &&
        getSettingsArray(settings, "favoriteTopics").length === 0;
    if (interestsMissing) {
        warnings.push({
            id: "settings-interests-missing",
            severity: "info",
            area: "settings",
            title: "Hobi dan minat kosong",
            message: "Lengkapi hobi dan topik favorit agar rekomendasi buku lebih personal.",
            actionLabel: "Buka Pengaturan",
            actionHref: "/settings",
        });
    }

    if (getSettingsArray(settings, "favoriteBookGenres").length === 0) {
        warnings.push({
            id: "settings-book-genres-missing",
            severity: "info",
            area: "books",
            title: "Genre buku favorit kosong",
            message: "Genre buku favorit belum diisi, sehingga rekomendasi buku memakai sinyal profil yang lebih umum.",
            actionLabel: "Isi Genre Buku",
            actionHref: "/settings",
        });
    }

    const careerGoalMissing = !hasSettingsText(settings, "targetCareer") && getSettingsArray(settings, "careerInterests").length === 0;
    if (careerGoalMissing) {
        warnings.push({
            id: "settings-career-goal-missing",
            severity: "info",
            area: "career",
            title: "Tujuan karier kosong",
            message: "Lengkapi tujuan dan minat karier agar rekomendasi karier lebih relevan.",
            actionLabel: "Buka Pengaturan",
            actionHref: "/settings",
        });
    }

    const audit = getAnalysisAudit(latestAnalysis ?? null);
    if (audit) {
        audit.inferred_fields.forEach((field) => {
            warnings.push({
                id: `analysis-inferred-${field}`,
                severity: "info",
                area: "analysis",
                title: "Ada data yang diinferensikan",
                message: `${field} diinferensikan oleh analisis karena data eksplisit belum lengkap.`,
                actionLabel: "Lihat Analisis",
                actionHref: "/analisis",
            });
        });

        audit.warnings.forEach((message, index) => {
            warnings.push({
                id: `analysis-warning-${index}-${message}`,
                severity: "info",
                area: "analysis",
                title: "Catatan audit analisis",
                message,
                actionLabel: "Lihat Analisis",
                actionHref: "/analisis",
            });
        });
    }

    return uniqueWarnings(warnings);
}

export function getProfileDataQuality(
    profile: unknown,
    settingsInput?: Partial<SettingsPayload> | null,
    latestAnalysis?: LatestAnalysisLike,
    bookCollection: BookLike[] = []
): ProfileQualityResult {
    const settings = settingsInput ?? defaultSettings;
    const warnings = getProfileWarnings(profile, settings, latestAnalysis);
    const unfinishedCount = bookCollection.filter((book) => ["owned", "reading", "wishlist"].includes(book.status ?? "")).length;
    const personalizationFields = [
        getSettingsArray(settings, "favoriteBookGenres").length,
        getSettingsArray(settings, "hobbies").length,
        getSettingsArray(settings, "interests").length,
        getSettingsArray(settings, "favoriteTopics").length,
        getSettingsArray(settings, "careerInterests").length,
        hasSettingsText(settings, "educationLevel") ? 1 : 0,
        hasSettingsText(settings, "targetCareer") ? 1 : 0,
    ];

    if (bookCollection.length === 0) {
        warnings.push({
            id: "books-collection-empty",
            severity: "info",
            area: "books",
            title: "Koleksi buku kosong",
            message: "Koleksi buku masih kosong. Rekomendasi dibuat berdasarkan profil saja.",
            actionLabel: "Tambah Buku",
            actionHref: "/buku",
        });
    }

    if (unfinishedCount >= 3) {
        warnings.push({
            id: "books-unfinished-many",
            severity: "info",
            area: "books",
            title: "Ada buku belum selesai",
            message: "Ada buku di koleksi yang belum selesai. Sistem akan memprioritaskan buku tersebut sebelum menyarankan buku baru.",
            actionLabel: "Lihat Koleksi",
            actionHref: "/buku",
        });
    }

    if (personalizationFields.every((count) => count === 0)) {
        warnings.push({
            id: "books-profile-only-context",
            severity: "info",
            area: "books",
            title: "Personalisasi buku terbatas",
            message: "Rekomendasi buku saat ini lebih banyak memakai profil karena pengaturan minat belum lengkap.",
            actionLabel: "Lengkapi Pengaturan",
            actionHref: "/settings",
        });
    }

    const unique = uniqueWarnings(warnings);
    const score = Math.max(
        0,
        Math.min(
            100,
            100 - unique.reduce((total, warning) => total + (warning.severity === "warning" ? 12 : warning.severity === "critical" ? 35 : 5), 0)
        )
    );
    const profileHasLowData = !isRecord(profile) || unique.filter((warning) => warning.severity === "info").length >= 4;
    const status: ProfileQualityStatus = unique.length === 0 ? "good" : profileHasLowData ? "low_data" : "needs_review";

    return {
        score,
        status,
        warnings: unique,
    };
}

export function getDashboardConsistencySummary(
    profile: unknown,
    settingsInput?: Partial<SettingsPayload> | null,
    latestAnalysis?: LatestAnalysisLike,
    bookCollection: BookLike[] = []
): DashboardConsistencySummary {
    const quality = getProfileDataQuality(profile, settingsInput, latestAnalysis, bookCollection);
    const topWarning = quality.warnings[0];

    return {
        score: quality.score,
        status: quality.status,
        warningCount: quality.warnings.length,
        topWarning: topWarning?.message ?? (quality.status === "low_data" ? "Beberapa data belum lengkap." : "Profil terlihat cukup konsisten."),
        actionHref: topWarning?.actionHref ?? "/bangun-profil",
    };
}
