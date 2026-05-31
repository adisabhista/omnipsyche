import { NextResponse } from "next/server";

export function GET() {
    return NextResponse.json({
        ok: true,
        service: "omnipsyche",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? "unknown",
    });
}
