import type { UserProfile } from "@/types/personality";
import type { PersonalityAnalysis } from "./personality-json-schema";

export interface NormalizedInput {
  explicit: {
    mbti: string | null;
    enneagram_raw: string | null;
    tritype: string | null;
    instinctual_variant: string | null;
    socionics: string | null;
    attitudinal_psyche: string | null;
    riasec: string | null;
  };
  missing: string[];
  notes: string[];
}

export function extractTypologyCodes(text: string) {
  const mbtiRegex = /\b(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP)\b/i;
  const enneagramWingRegex = /\b([1-9])w([1-9])\b/i;
  const enneagramTypeOnlyRegex = /\b(?:Type|Enneagram|E)\s*([1-9])\b/i;
  const tritypeRegex = /\b([1-9]{3})\b/;
  const ivRegex = /\b(sx\/sp|sx\/so|sp\/sx|sp\/so|so\/sx|so\/sp)\b/i;
  const socionicsRegex = /\b(ILI|LII|EIE|SEE|SLI|LSI|ILE|IEI|ESI|LIE|ESE|SEI|LSE|IEE|SLE|EII)\b/i;
  const apRegex = /\b(LVFE|LVEF|LFVE|LFEV|LEVF|LEFV|VLFE|VLEF|VFLE|VFEL|VELF|VEFL|FLVE|FLEV|FVLE|FVEL|FELV|FEVL|ELVF|ELFV|EVLF|EVFL|EFLV|EFVL)\b/i;
  
  // RIASEC check:
  let riasec: string | null = null;
  const riasecLabels = ["riasec", "holland", "minat karier", "minat", "karier", "hasil tes holland"];
  const hasRiasecLabel = riasecLabels.some(label => text.toLowerCase().includes(label));
  if (hasRiasecLabel) {
    const riasecRegex = /\b([RIASECriasec]{2,6})\b/g;
    const matches = Array.from(text.matchAll(riasecRegex));
    for (const match of matches) {
      const candidate = match[1].toUpperCase();
      if (candidate !== "RIASEC") {
        riasec = candidate;
        break;
      }
    }
  }

  const mbtiMatch = text.match(mbtiRegex);
  const mbti = mbtiMatch ? mbtiMatch[1].toUpperCase() : null;

  const egWingMatch = text.match(enneagramWingRegex);
  let enneagramRaw: string | null = null;
  let enneagramType: number | null = null;
  let enneagramWing: string | null = null;
  let wingSource: "explicit" | "inferred" | null = null;

  if (egWingMatch) {
    enneagramRaw = egWingMatch[0].toLowerCase();
    enneagramType = parseInt(egWingMatch[1], 10);
    enneagramWing = egWingMatch[2];
    wingSource = "explicit";
  } else {
    const egTypeMatch = text.match(enneagramTypeOnlyRegex);
    if (egTypeMatch) {
      enneagramType = parseInt(egTypeMatch[1], 10);
      enneagramRaw = String(enneagramType);
    }
  }

  const tritypeMatch = text.match(tritypeRegex);
  const tritype = tritypeMatch ? tritypeMatch[1] : null;

  const ivMatch = text.match(ivRegex);
  const instinctualVariant = ivMatch ? ivMatch[1].toLowerCase() : null;

  const socionicsMatch = text.match(socionicsRegex);
  const socionics = socionicsMatch ? socionicsMatch[1].toUpperCase() : null;

  const apMatch = text.match(apRegex);
  const attitudinalPsyche = apMatch ? apMatch[1].toUpperCase() : null;

  return {
    mbti,
    enneagramRaw,
    enneagramType,
    enneagramWing,
    wingSource,
    tritype,
    instinctualVariant,
    socionics,
    attitudinalPsyche,
    riasec,
  };
}

export function buildNormalizedInput(profile: UserProfile): NormalizedInput & { wingSource: "explicit" | "inferred" | null } {
  const textParts: string[] = [];
  if (profile.mbti && profile.mbti !== "unknown") textParts.push(profile.mbti);
  
  if (profile.enneagram) {
    const type = profile.enneagram.type;
    const wing = profile.enneagram.wing;
    if (type && type !== "unknown") {
      if (wing && wing !== "unknown") {
        textParts.push(`${type}w${wing}`);
      } else {
        textParts.push(`Type ${type}`);
      }
    }
    if (profile.enneagram.tritype) {
      textParts.push(`Tritype ${profile.enneagram.tritype}`);
    }
  }

  if (profile.attitudinalPsyche && profile.attitudinalPsyche !== "unknown") {
    textParts.push(profile.attitudinalPsyche);
  }
  if (profile.instinctualVariant && profile.instinctualVariant !== "unknown") {
    textParts.push(profile.instinctualVariant);
  }
  if (profile.socionics && profile.socionics !== "unknown") {
    textParts.push(profile.socionics);
  }
  if (profile.riasec) {
    textParts.push(`RIASEC ${profile.riasec}`);
  }

  const concatenatedText = textParts.join(" ");
  const extracted = extractTypologyCodes(concatenatedText);

  const cleanMbti = extracted.mbti;
  let cleanEnneagramRaw = extracted.enneagramRaw;
  const cleanEnneagramType = extracted.enneagramType;
  let cleanEnneagramWing = extracted.enneagramWing;
  let cleanWingSource: "explicit" | "inferred" | null = extracted.wingSource;

  // Enneagram wing inference:
  if (cleanEnneagramType === 5 && !cleanEnneagramWing) {
    const tritypeStr = extracted.tritype || "";
    if (cleanMbti === "INTJ") {
      if (tritypeStr.includes("3")) {
        cleanEnneagramWing = "4";
        cleanEnneagramRaw = "5w4";
        cleanWingSource = "inferred";
      } else if (tritypeStr.includes("6") || tritypeStr.includes("1")) {
        cleanEnneagramWing = "6";
        cleanEnneagramRaw = "5w6";
        cleanWingSource = "inferred";
      } else {
        cleanEnneagramWing = "4";
        cleanEnneagramRaw = "5w4";
        cleanWingSource = "inferred";
      }
    } else {
      cleanEnneagramWing = "4";
      cleanEnneagramRaw = "5w4";
      cleanWingSource = "inferred";
    }
  } else if (cleanEnneagramType && !cleanEnneagramWing) {
    const defaults: Record<number, string> = {
      1: "9",
      2: "3",
      3: "2",
      4: "5",
      5: "4",
      6: "5",
      7: "6",
      8: "9",
      9: "1"
    };
    cleanEnneagramWing = defaults[cleanEnneagramType] || null;
    if (cleanEnneagramWing) {
      cleanEnneagramRaw = `${cleanEnneagramType}w${cleanEnneagramWing}`;
      cleanWingSource = "inferred";
    }
  }

  const explicit = {
    mbti: cleanMbti,
    enneagram_raw: cleanEnneagramRaw,
    tritype: extracted.tritype,
    instinctual_variant: extracted.instinctualVariant,
    socionics: extracted.socionics,
    attitudinal_psyche: extracted.attitudinalPsyche,
    riasec: extracted.riasec,
  };

  const missing: string[] = [];
  const notes: string[] = [];

  if (!cleanMbti) {
    missing.push("mbti");
  }
  if (!cleanEnneagramRaw) {
    missing.push("enneagram");
  } else if (cleanWingSource === "inferred") {
    notes.push(`Enneagram wing diinferensikan menjadi ${cleanEnneagramRaw} karena input tidak menyertakan wing secara eksplisit.`);
  }

  if (!extracted.tritype) {
    missing.push("tritype");
  }
  if (!extracted.instinctualVariant) {
    missing.push("instinctual_variant");
  }
  if (!extracted.socionics) {
    missing.push("socionics");
  }
  if (!extracted.attitudinalPsyche) {
    missing.push("attitudinal_psyche");
  }
  if (!extracted.riasec) {
    missing.push("riasec");
    notes.push("RIASEC dikosongkan (null) karena tidak ada input Holland/RIASEC eksplisit.");
  }

  return {
    explicit,
    missing,
    notes,
    wingSource: cleanWingSource
  };
}

export function cleanAndParseJSON(text: string) {
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();

  const firstBrace = cleanText.indexOf("{");
  const lastBrace = cleanText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleanText);
}

export function parsedJsonToMarkdown(json: PersonalityAnalysis, name: string): string {
  let md = `# 🌌 Analisis OmniPsyche: ${name}\n\n`;

  md += `## 1. Arketipe Inti\n`;
  md += `### ${json.archetype.title}\n\n`;
  md += `${json.archetype.summary}\n\n`;

  md += `## 2. Dinamika Lintas Kerangka Kerja\n`;
  md += `- **Loop Kognitif-Emosional**: ${json.cognitive_dynamics.loop_description}\n`;
  md += `- **Sintesis Lintas Framework**: ${json.cognitive_dynamics.cross_framework_synthesis}\n`;
  md += `- **Gaya Sosial & Volisional**: ${json.social_volitional.description}\n`;
  if (json.social_volitional.ap_breakdown) {
    const ap = json.social_volitional.ap_breakdown;
    md += `  - *Posisi 1*: ${ap.position_1}\n`;
    md += `  - *Posisi 2*: ${ap.position_2}\n`;
    md += `  - *Posisi 3*: ${ap.position_3}\n`;
    md += `  - *Posisi 4*: ${ap.position_4}\n`;
  }
  md += `- **Dorongan Insting**: ${json.instinctual_drive}\n\n`;

  md += `## 3. Titik Buta (Shadow Work)\n`;
  if (json.shadow_work.blind_spots.length > 0) {
    md += `### 👁️ Blind Spots\n`;
    json.shadow_work.blind_spots.forEach(bs => {
      md += `- ${bs}\n`;
    });
    md += `\n`;
  }
  if (json.shadow_work.growth_edges.length > 0) {
    md += `### 🌱 Growth Edges\n`;
    json.shadow_work.growth_edges.forEach(ge => {
      md += `- ${ge}\n`;
    });
    md += `\n`;
  }

  md += `## 4. Analisis Karir & Jurusan Kuliah (Komprehensif)\n\n`;

  md += `### 🎓 Rekomendasi Jurusan Kuliah\n`;
  json.career.recommended_majors.forEach(major => {
    md += `- **${major.name}**: ${major.rationale}\n`;
  });
  md += `\n`;

  md += `### 💼 Jalur Karir Strategis\n`;
  json.career.career_paths.forEach((path, i) => {
    md += `${i + 1}. **${path.title}** (Kesesuaian: *${path.fit_score.toUpperCase()}*)\n`;
    md += `   *Rasional*: ${path.rationale}\n`;
  });
  md += `\n`;

  md += `### 🚀 Gaya Kerja & Lingkungan Ideal\n`;
  json.career.ideal_environment.forEach(env => {
    md += `- ${env}\n`;
  });
  md += `\n`;

  md += `## 5. Rekomendasi Pertumbuhan\n`;
  json.growth_recommendations.forEach((rec, i) => {
    md += `${i + 1}. **${rec.area}**: ${rec.practice}\n`;
  });
  md += `\n`;

  md += `## 🔍 Audit Konsistensi\n`;
  md += `- **Framework yang Digunakan**: ${json.consistency_audit.frameworks_used.join(", ") || "-"}\n`;
  if (json.consistency_audit.inferred_fields.length > 0) {
    md += `- **Field yang Diinferensikan**: ${json.consistency_audit.inferred_fields.join(", ")}\n`;
  }
  if (json.consistency_audit.warnings.length > 0) {
    md += `- **Peringatan / Catatan**: \n`;
    json.consistency_audit.warnings.forEach(warn => {
      md += `  - ⚠️ ${warn}\n`;
    });
  } else {
    md += `- **Peringatan / Catatan**: Tidak ada masalah konsistensi terdeteksi.\n`;
  }

  return md;
}
