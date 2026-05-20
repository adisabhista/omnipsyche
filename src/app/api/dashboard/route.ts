import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";

export async function GET() {
    try {
        const data = await getDashboardData();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Dashboard API failed:", error);
        return NextResponse.json(
            { error: "Gagal memuat data dashboard." },
            { status: 500 }
        );
    }
}

