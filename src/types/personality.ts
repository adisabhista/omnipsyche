export type BigFive = {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
};

export type MBTI = "INTJ" | "INTP" | "ENTJ" | "ENTP" | "INFJ" | "INFP" | "ENFJ" | "ENFP" | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ" | "ISTP" | "ISFP" | "ESTP" | "ESFP" | "unknown";

export type Enneagram = {
    type: number | "unknown";
    wing: number | "unknown";
    tritype: string; // e.g., "5-4-8"
};

export type AttitudinalPsyche = string; // e.g., "VLEF"
export type InstinctualVariant = string; // e.g., "sp/sx"
export type Socionics = string; // e.g., "LII-2Ne"
export type Temperament = "Sanguine" | "Choleric" | "Melancholic" | "Phlegmatic" | "Sanguine-Choleric" | string | "unknown";
export type RIASEC = string; // e.g., "R-I-A"

export interface UserProfile {
    name: string;
    bigFive: BigFive | "unknown";
    mbti: MBTI;
    enneagram: Enneagram;
    attitudinalPsyche: AttitudinalPsyche;
    instinctualVariant: InstinctualVariant;
    socionics: Socionics;
    temperament: Temperament;
    riasec: RIASEC;
}

export interface AnalysisResponse {
    markdown: string;
}
