import { prisma } from "@/lib/prisma";
import { generateNarrativePrediction, getConfiguredVertexModel } from "@/lib/vertex-ai";

export async function createNarrativePrediction(text: string, userId: string, profileId?: string) {
    if (profileId) {
        const profile = await prisma.userProfile.findFirst({
            where: { id: profileId, userId },
            select: { id: true },
        });

        if (!profile) {
            throw new Error("Data tidak ditemukan.");
        }
    }

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

    const jsonString = (await generateNarrativePrediction(prompt)).replace(/```json/g, "").replace(/```/g, "").trim();
    const prediction = JSON.parse(jsonString);
    const model = getConfiguredVertexModel();
    const saved = await prisma.narrativePrediction.create({
        data: {
            userId,
            profileId,
            inputText: text,
            prediction,
            model,
        },
    });

    return {
        prediction,
        narrativePredictionId: saved.id,
        profileId: saved.profileId,
        model,
        createdAt: saved.createdAt,
    };
}
