import type { TipologiExploreRequest } from "@/lib/tipologi-explore-schema";

type PromptContext = {
    payload: TipologiExploreRequest;
    profileContext?: unknown;
    analysisContext?: unknown;
    validationError?: string;
    previousResponse?: string;
};

function compactJson(value: unknown) {
    if (!value) return "Tidak tersedia";

    try {
        return JSON.stringify(value).slice(0, 2500);
    } catch {
        return "Tidak tersedia";
    }
}

export function buildTipologiExplorePrompt({ payload, profileContext, analysisContext }: PromptContext) {
    const mistype = payload.mistypeWith.length > 0 ? payload.mistypeWith.join(", ") : "tidak ada data mistype spesifik";
    const userText = payload.userText?.trim() || "Pengguna belum memberi konteks pribadi.";

    return `Kamu adalah agen eksplorasi kepribadian dalam platform Tipologi.

Tipe yang sedang dieksplorasi:
- Sistem     : ${payload.system}
- Kode tipe  : ${payload.typeCode}
- Nama tipe  : ${payload.typeName}
- Deskripsi  : ${payload.description}
- Sering mistype dengan: ${mistype}

Konteks pengguna:
- Cerita pengguna: ${userText}
- Profil tersimpan: ${compactJson(payload.userContext?.currentProfile ?? profileContext)}
- Analisis terakhir: ${compactJson(payload.userContext?.latestAnalysis ?? analysisContext)}
- Settings: ${compactJson(payload.userContext?.settings)}

Tugasmu:
- Jangan konfirmasi tipe secara langsung.
- Tanyakan dulu pengalaman konkret yang membuat pengguna merasa cocok dengan ${payload.typeCode}.
- Ajukan 2-3 pertanyaan perilaku yang membedakan ${payload.typeCode} dari ${mistype}.
- Jika ada inkonsistensi antara self-report dan perilaku yang diceritakan, tandai dengan lembut.
- Hubungkan ke sistem lain jika relevan, misalnya MBTI dan Socionics atau Enneagram dan Instinctual Variant.
- Gunakan bahasa Indonesia santai.
- Hindari jargon tanpa penjelasan.
- Maksimal 120 kata untuk field response.
- Field response wajib selalu diakhiri dengan satu pertanyaan eksplorasi.

Jangan katakan:
- "Kamu pasti tipe ini"
- "Tipe kamu benar"
- "Tipe kamu salah"
- "AI membuktikan"

Gunakan wording hati-hati:
- "bisa jadi"
- "terlihat mengarah"
- "perlu dibedakan dari"
- "coba cek dari pengalaman nyata"
- "belum cukup untuk menyimpulkan"

Kembalikan HANYA JSON valid tanpa markdown:
{
  "response": "maksimal 120 kata, diakhiri satu pertanyaan eksplorasi",
  "questions": ["2 sampai 3 pertanyaan perilaku konkret"],
  "distinction_focus": ["fokus pembeda singkat"],
  "warnings": ["catatan kehati-hatian jika ada"]
}`;
}

export function buildTipologiExploreRepairPrompt({ payload, validationError, previousResponse }: PromptContext) {
    return `Perbaiki respons eksplorasi Tipologi berikut agar menjadi JSON valid sesuai schema.

Sistem: ${payload.system}
Kode tipe: ${payload.typeCode}
Nama tipe: ${payload.typeName}
Mistype: ${payload.mistypeWith.join(", ") || "tidak tersedia"}

Masalah validasi:
${validationError || "Respons tidak valid."}

Respons sebelumnya:
${previousResponse || ""}

Aturan:
- HANYA JSON valid.
- response maksimal 120 kata.
- response tidak boleh memastikan tipe pengguna.
- response wajib diakhiri satu pertanyaan eksplorasi.
- questions berisi 2-3 pertanyaan perilaku.

Schema:
{
  "response": "string",
  "questions": ["string"],
  "distinction_focus": ["string"],
  "warnings": ["string"]
}`;
}
