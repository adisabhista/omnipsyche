import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { UserProfile } from "@/types/personality";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json(
            { error: "Gemini API Key is missing. Please add it to .env.local" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const profile: UserProfile = body.profile;

        const genAI = new GoogleGenerativeAI(apiKey);
        // User requested 3.0 Pro. The available model ID is "gemini-3-pro-preview".
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        const prompt = `
      BERTINDAK SEBAGAI PSIKOLOG AHLI DAN ILMUWAN DATA YANG MENGKHUSUSKAN DIRI DALAM INTEGRASI TIPOLOGI KEPRIBADIAN.
      
      Tugas Anda adalah melakukan "SINTESIS AGUNG" (GRAND SYNTHESIS) dari profil kepribadian pengguna berikut.
      Anda harus menganalisis persimpangan antara berbagai kerangka kerja (misalnya, bagaimana MBTI mereka berkorelasi dengan Enneagram dan Socionics mereka).
      
      PENTING:
      Jika nilai input adalah "unknown" atau kosong, ABAIKAN kerangka kerja tersebut dalam analisis Anda. Jangan menebak-nebak. Fokuslah hanya pada data yang diberikan (misalnya, jika hanya MBTI yang diketahui, berikan analisis mendalam tentang MBTI tersebut dan bagaimana hal itu mungkin memengaruhi aspek lain secara umum).
      
      DATA PENGGUNA:
      ${JSON.stringify(profile, null, 2)}
      
      FORMAT OUTPUT:
      Berikan respons dalam format Markdown (Bahasa Indonesia) dengan bagian-bagian berikut.
      JANGAN gunakan garis horizontal (---) atau (***) di mana pun dalam respons.
      
      # 🌌 Analisis OmniPsyche: ${profile.name}
      
      ## 1. Arketipe Inti
      (Judul kreatif dan tersintesis untuk kombinasi spesifik mereka, misal: "Arsitek Visioner Bayangan")
      Deskripsi naratif mendalam tentang siapa mereka pada intinya, menyintesis Big Five, MBTI, dan Enneagram.
      
      ## 2. Dinamika Lintas Kerangka Kerja
      - **Loop Kognitif-Emosional**: Bagaimana fungsi kognitif MBTI mereka berinteraksi dengan ketakutan/keinginan inti Enneagram mereka.
      - **Gaya Sosial & Volisional**: Analisis Socionics dan Attitudinal Psyche (misal: bagaimana mereka menangani logika vs emosi dalam hubungan).
      - **Dorongan Insting**: Bagaimana IV (sp/sx/so) mereka memengaruhi energi harian mereka.
      
      ## 3. Titik Buta (Shadow Work)
      Titik buta psikologis krusial yang perlu mereka sadari. Bersikaplah langsung tetapi konstruktif.
      
      ## 4. Analisis Karir & Jurusan Kuliah (Komprehensif)
      Bagian ini harus sangat detail dan praktis.
      
      ### 🎓 Rekomendasi Jurusan Kuliah
      Sebutkan 3-5 jurusan kuliah yang paling cocok. Untuk setiap jurusan, jelaskan MENGAPA cocok dengan profil kognitif dan minat mereka (hubungkan dengan MBTI/RIASEC).
      
      ### 💼 Jalur Karir Strategis
      Berikan daftar peringkat 5-7 pekerjaan yang paling cocok untuk mereka, diurutkan dari yang paling direkomendasikan (Top Match) hingga ke bawah. Jangan gunakan kategori seperti "Konvensional" atau "Niche". Langsung saja buat daftar berpoin atau bernomor.
      
      ### 🚀 Gaya Kerja & Lingkungan Ideal
      Deskripsikan lingkungan kerja di mana mereka akan paling berkembang (misal: WFH vs Kantor, Tim Kecil vs Korporat, Terstruktur vs Fleksibel).
      
      ## 5. Rekomendasi Pertumbuhan
      3 langkah konkret dan dapat ditindaklanjuti untuk pengembangan diri.
      
      NADA (TONE):
      Wawasan mendalam, profesional, sedikit mistis/futuristik, dan sangat personal. Hindari penulisan gaya horoskop umum. Gunakan terminologi spesifik dari kerangka kerja dengan benar.
    `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ markdown: text });
    } catch (error: any) {
        console.error("Error analyzing profile:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate analysis" },
            { status: 500 }
        );
    }
}
