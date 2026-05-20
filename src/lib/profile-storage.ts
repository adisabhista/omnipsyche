import { Prisma } from "@prisma/client";
import type { UserProfile } from "@/types/personality";
import type { PartialProfileInput, ProfileInput } from "@/lib/api-validation";

type StoredProfile = {
    id: string;
    name: string;
    mbti: string;
    enneagramType: string;
    enneagramWing: string;
    enneagramTritype: string;
    attitudinalPsyche: string;
    instinctualVariant: string;
    socionics: string;
    temperament: string;
    riasec: string;
    bigFive: Prisma.JsonValue | null;
    rawProfile: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
};

export function profileToCreateInput(profile: ProfileInput, userId?: string): Prisma.UserProfileCreateInput {
    return {
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        name: profile.name,
        mbti: profile.mbti,
        enneagramType: String(profile.enneagram.type),
        enneagramWing: String(profile.enneagram.wing),
        enneagramTritype: profile.enneagram.tritype,
        attitudinalPsyche: profile.attitudinalPsyche,
        instinctualVariant: profile.instinctualVariant,
        socionics: profile.socionics,
        temperament: profile.temperament,
        riasec: profile.riasec,
        bigFive: profile.bigFive === "unknown" ? Prisma.JsonNull : profile.bigFive as Prisma.InputJsonValue,
        rawProfile: profile as unknown as Prisma.InputJsonValue,
    };
}

export function profileToUpdateInput(profile: PartialProfileInput, existing: StoredProfile): Prisma.UserProfileUpdateInput {
    const merged = {
        ...storedProfileToUserProfile(existing),
        ...profile,
        enneagram: {
            ...storedProfileToUserProfile(existing).enneagram,
            ...profile.enneagram,
        },
    };

    return {
        ...(profile.name !== undefined ? { name: profile.name } : {}),
        ...(profile.mbti !== undefined ? { mbti: profile.mbti } : {}),
        ...(profile.enneagram?.type !== undefined ? { enneagramType: String(profile.enneagram.type) } : {}),
        ...(profile.enneagram?.wing !== undefined ? { enneagramWing: String(profile.enneagram.wing) } : {}),
        ...(profile.enneagram?.tritype !== undefined ? { enneagramTritype: profile.enneagram.tritype } : {}),
        ...(profile.attitudinalPsyche !== undefined ? { attitudinalPsyche: profile.attitudinalPsyche } : {}),
        ...(profile.instinctualVariant !== undefined ? { instinctualVariant: profile.instinctualVariant } : {}),
        ...(profile.socionics !== undefined ? { socionics: profile.socionics } : {}),
        ...(profile.temperament !== undefined ? { temperament: profile.temperament } : {}),
        ...(profile.riasec !== undefined ? { riasec: profile.riasec } : {}),
        ...(profile.bigFive !== undefined ? { bigFive: profile.bigFive === "unknown" ? Prisma.JsonNull : profile.bigFive as Prisma.InputJsonValue } : {}),
        rawProfile: merged as unknown as Prisma.InputJsonValue,
    };
}

export function storedProfileToUserProfile(profile: StoredProfile): UserProfile {
    return {
        name: profile.name,
        mbti: profile.mbti as UserProfile["mbti"],
        enneagram: {
            type: parseEnneagramValue(profile.enneagramType),
            wing: parseEnneagramValue(profile.enneagramWing),
            tritype: profile.enneagramTritype,
        },
        attitudinalPsyche: profile.attitudinalPsyche,
        instinctualVariant: profile.instinctualVariant,
        socionics: profile.socionics,
        temperament: profile.temperament,
        riasec: profile.riasec,
        bigFive: profile.bigFive ?? "unknown",
    } as UserProfile;
}

export function serializeProfile(profile: StoredProfile) {
    return {
        id: profile.id,
        profile: storedProfileToUserProfile(profile),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
}

function parseEnneagramValue(value: string) {
    if (value === "unknown") {
        return "unknown";
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? "unknown" : parsed;
}
