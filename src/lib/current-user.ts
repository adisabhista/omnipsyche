import "server-only";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const AUTH_REQUIRED_MESSAGE = "Kamu harus masuk terlebih dahulu.";
export const NOT_FOUND_MESSAGE = "Data tidak ditemukan.";
export const FORBIDDEN_MESSAGE = "Kamu tidak memiliki akses ke data ini.";

export async function getCurrentUserId() {
    const session = await auth();
    return session?.user?.id ?? null;
}

export async function requireCurrentUserId() {
    const userId = await getCurrentUserId();

    if (!userId) {
        return {
            userId: null,
            response: NextResponse.json({ error: AUTH_REQUIRED_MESSAGE }, { status: 401 }),
        };
    }

    return { userId, response: null };
}
