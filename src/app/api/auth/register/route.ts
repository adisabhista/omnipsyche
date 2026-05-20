import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getValidationError, isValidationError, registerRequestSchema } from "@/lib/api-validation";
import { hashPassword } from "@/lib/password";

const REGISTER_FALLBACK_ERROR = "Gagal membuat akun. Periksa konfigurasi server.";
const DATABASE_NOT_READY_ERROR = "Database belum siap. Jalankan migrasi terlebih dahulu.";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const payload = registerRequestSchema.parse(body);
        const existing = await prisma.user.findUnique({
            where: { email: payload.email },
            select: { id: true },
        });

        if (existing) {
            return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
        }

        const user = await prisma.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                passwordHash: await hashPassword(payload.password),
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error("Register failed:", error);

        if (isValidationError(error)) {
            return NextResponse.json(
                { error: getValidationError(error, REGISTER_FALLBACK_ERROR) },
                { status: 400 }
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            ["P1001", "P1003", "P2021", "P2022"].includes(error.code)
        ) {
            return NextResponse.json({ error: DATABASE_NOT_READY_ERROR }, { status: 500 });
        }

        if (error instanceof Prisma.PrismaClientInitializationError) {
            return NextResponse.json({ error: DATABASE_NOT_READY_ERROR }, { status: 500 });
        }

        return NextResponse.json(
            { error: REGISTER_FALLBACK_ERROR },
            { status: 500 }
        );
    }
}
