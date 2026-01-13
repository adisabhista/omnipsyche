import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json(
            { error: "Gemini API Key is missing. Please add it to .env.local" },
            { status: 500 }
        );
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        const prompt = `
      BERTINDAK SEBAGAI: Pakar Profiling Psikolinguistik.

      Tugas Anda adalah menganalisis teks naratif bebas yang diberikan oleh pengguna. Berdasarkan gaya bahasa, fokus perhatian, motivasi yang diungkapkan, ketakutan, dan pola kognitif yang terlihat dalam teks, lakukan 'profiling' untuk memperkirakan tipe kepribadian mereka di 8 kerangka kerja berikut: MBTI, Enneagram (termasuk Wing), Instinctual Variant, Tritype (tebakan kasar), Socionics, Attitudinal Psyche, Four Temperaments, dan RIASEC.

      PENTING:
      1.  Anda tidak sedang memberikan diagnosis pasti. Anda memberikan HIPOTESIS TERBAIK berdasarkan data teks yang terbatas.
      2.  Analisis petunjuk halus: Penggunaan kata-kata abstrak vs konkret (MBTI N/S), fokus pada efisiensi (Te) vs harmoni (Fe), ekspresi kecemasan (Enneagram 6) vs kemarahan (Enneagram 8/1).
      3.  Output WAJIB dalam format JSON murni (tanpa markdown \`\`\`json) dengan struktur berikut:
          {
            "analysis_summary": "Ringkasan singkat 2 kalimat tentang kesan keseluruhan dari teks.",
            "predictions": {
              "mbti": { "type": "Misal: INTJ", "reasoning": "Alasan singkat berdasarkan teks..." },
              "enneagram": { "type": "Misal: 5w4", "reasoning": "..." },
              "instinctual_variant": { "type": "Misal: sp/sx", "reasoning": "..." },
              "tritype": { "type": "Misal: 458", "reasoning": "..." },
              "socionics": { "type": "Misal: LII", "reasoning": "..." },
              "attitudinal_psyche": { "type": "Misal: VLEF", "reasoning": "..." },
              "temperament": { "type": "Misal: Melancholic-Choleric", "reasoning": "..." },
              "riasec": { "type": "Misal: Investigative-Artistic", "reasoning": "..." }
            }
          }

      TEKS PENGGUNA:
      "${text}"
    `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const jsonString = response.text().replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const data = JSON.parse(jsonString);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            // Fallback if model returns invalid JSON, though instructions say strict JSON
            return NextResponse.json({ raw_output: jsonString, error: "Failed to parse JSON response" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Error predicting types:", error);
        return NextResponse.json(
            { error: error.message || "Failed to predict types" },
            { status: 500 }
        );
    }
}
