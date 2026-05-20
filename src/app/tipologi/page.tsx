import Link from "next/link";
import clsx from "clsx";
import { getLatestUserProfile } from "@/lib/analysis-data";
import { auth } from "@/lib/auth";
import { RightRail, StatusList, SurfaceCard } from "@/components/PlatformCards";
import {
    ATTITUDINAL_PSYCHE_TYPES,
    ENNEAGRAM_TYPES,
    INSTINCTUAL_VARIANTS,
    MBTI_TYPES,
    SOCIONICS_TYPES,
    TEMPERAMENTS,
} from "@/data/frameworks";

type PageProps = {
    searchParams: Promise<{ framework?: string }>;
};

const RIASEC_TYPES = [
    { id: "R", name: "Realistik", description: "Minat pada aktivitas praktis, alat, mesin, alam, atau pekerjaan langsung." },
    { id: "I", name: "Investigatif", description: "Minat pada riset, analisis, pemecahan masalah, dan eksplorasi ide." },
    { id: "A", name: "Artistik", description: "Minat pada ekspresi kreatif, desain, tulisan, seni, atau kebaruan." },
    { id: "S", name: "Sosial", description: "Minat pada membantu, mengajar, memfasilitasi, atau memahami orang lain." },
    { id: "E", name: "Wirausaha", description: "Minat pada persuasi, kepemimpinan, bisnis, dan pengambilan peluang." },
    { id: "C", name: "Konvensional", description: "Minat pada struktur, data, administrasi, dan sistem kerja yang rapi." },
];

const frameworks = [
    { key: "mbti", title: "MBTI", status: "16 Tipe", profileValue: "mbti", types: MBTI_TYPES, description: "Preferensi kognitif untuk membaca cara mengambil informasi dan keputusan." },
    { key: "enneagram", title: "Enneagram", status: "9 Tipe", profileValue: "enneagramType", types: ENNEAGRAM_TYPES, description: "Pola motivasi, ketakutan inti, dan strategi perlindungan diri." },
    { key: "socionics", title: "Socionics", status: "16 Tipe", profileValue: "socionics", types: SOCIONICS_TYPES, description: "Relasi informasi, dinamika interaksi, dan gaya pemrosesan." },
    { key: "attitudinal-psyche", title: "Attitudinal Psyche", status: "24 Tipe", profileValue: "attitudinalPsyche", types: ATTITUDINAL_PSYCHE_TYPES, description: "Prioritas volisi, logika, emosi, dan fisik dalam gaya hidup." },
    { key: "riasec", title: "RIASEC", status: "6 Area", profileValue: "riasec", types: RIASEC_TYPES, description: "Minat kerja dan kecenderungan lingkungan karier." },
    { key: "instinctual-variant", title: "Instinctual Variant", status: "6 Varian", profileValue: "instinctualVariant", types: INSTINCTUAL_VARIANTS, description: "Prioritas instingtual dalam keamanan, sosial, dan intensitas relasi." },
    { key: "temperament", title: "Temperamen", status: "Campuran", profileValue: "temperament", types: TEMPERAMENTS, description: "Pola energi, respons emosi, dan gaya adaptasi." },
] as const;

function normalize(value: unknown) {
    return String(value ?? "").toLowerCase();
}

function isFilled(value: unknown) {
    return value !== null && value !== undefined && value !== "" && normalize(value) !== "unknown";
}

function getTypeTitle(type: { id: string | number; name: string }) {
    const id = String(type.id);
    const name = type.name.includes(" - ") ? type.name.split(" - ")[0] : type.name;
    return name.includes(id) ? name : `${id} · ${name}`;
}

function getTypeDescription(frameworkTitle: string, type: { id: string | number; description: string }) {
    if (frameworkTitle === "RIASEC") {
        return type.description;
    }

    return `Kode ${type.id} dalam kerangka ${frameworkTitle}. Gunakan sebagai referensi eksplorasi, bukan label final.`;
}

export default async function TipologiPage({ searchParams }: PageProps) {
    const session = await auth();
    const profile = session?.user?.id ? await getLatestUserProfile(session.user.id) : null;
    const params = await searchParams;
    const selected = frameworks.find((framework) => framework.key === params.framework) ?? frameworks[0];
    const profileValue = profile?.[selected.profileValue];
    const selectedType = selected.types.find((type) => normalize(type.id) === normalize(profileValue));

    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <SurfaceCard title="Peta Tipologi" eyebrow="Eksplorasi">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {frameworks.map((framework) => {
                            const currentValue = profile?.[framework.profileValue];
                            return (
                                <Link
                                    key={framework.key}
                                    href={`/tipologi?framework=${framework.key}`}
                                    className={clsx(
                                        "rounded-lg border p-4 transition",
                                        selected.key === framework.key
                                            ? "border-cyan-300/45 bg-cyan-300/[0.08]"
                                            : "border-white/10 bg-black/20 hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
                                    )}
                                >
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h2 className="font-semibold text-slate-100">{framework.title}</h2>
                                        <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-slate-400">{framework.status}</span>
                                    </div>
                                    <p className="text-sm leading-6 text-slate-500">{framework.description}</p>
                                    <p className="mt-3 text-xs text-cyan-300">
                                        Tipe kamu: {isFilled(currentValue) ? String(currentValue) : "Belum diisi"}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </SurfaceCard>

                <SurfaceCard title={`Daftar ${selected.title}`}>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {selected.types
                            .filter((type) => type.id !== "unknown")
                            .map((type) => {
                                const active = normalize(type.id) === normalize(profileValue);
                                return (
                                    <article
                                        key={String(type.id)}
                                        className={clsx(
                                            "rounded-lg border p-4",
                                            active ? "border-cyan-300/45 bg-cyan-300/[0.08]" : "border-white/10 bg-black/25"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                        <h2 className="font-medium text-slate-100">{getTypeTitle(type)}</h2>
                                            {active && <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[11px] text-cyan-300">Profil Kamu</span>}
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">{getTypeDescription(selected.title, type)}</p>
                                    </article>
                                );
                            })}
                    </div>
                </SurfaceCard>
            </div>

            <RightRail>
                <SurfaceCard title="Tipe Saat Ini">
                    <StatusList
                        items={[
                            { label: "Profil", value: profile?.name || "Belum dibuat" },
                            { label: selected.title, value: selectedType ? String(selectedType.id) : "Belum diisi" },
                            { label: "Mode", value: profile ? "Terhubung" : "Eksplorasi Umum" },
                        ]}
                    />
                </SurfaceCard>
                <SurfaceCard title="Aksi Cepat">
                    <p className="text-sm leading-6 text-slate-500">
                        Gunakan halaman Bangun Profil untuk menyimpan tipe yang sudah kamu yakini.
                    </p>
                    <Link href="/bangun-profil" className="mt-4 inline-flex rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                        Bangun Profil
                    </Link>
                </SurfaceCard>
            </RightRail>
        </div>
    );
}
