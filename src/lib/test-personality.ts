import { buildNormalizedInput } from "./personality-parser";
import type { UserProfile } from "@/types/personality";

function runTest() {
    console.log("=== RUNNING OMNIPSYCHE PERSONALITY PARSER TESTS ===\n");

    // Case 1: INTJ 5w4 513 sx/sp ILI LVFE
    const case1Profile: UserProfile = {
        name: "Test Case 1",
        mbti: "INTJ",
        enneagram: {
            type: 5,
            wing: 4,
            tritype: "513",
        },
        instinctualVariant: "sx/sp",
        socionics: "ILI",
        attitudinalPsyche: "LVFE",
        temperament: "unknown",
        riasec: "",
        bigFive: "unknown"
    };

    const case1Result = buildNormalizedInput(case1Profile);
    console.log("Case 1 Input: INTJ 5w4 513 sx/sp ILI LVFE");
    console.log("Result Explicit:", JSON.stringify(case1Result.explicit, null, 2));
    console.log("Result Missing:", case1Result.missing);
    console.log("Result Notes:", case1Result.notes);
    console.log("Result Wing Source:", case1Result.wingSource);
    console.log("-------------------------------------------\n");

    // Assertions for Case 1
    if (case1Result.explicit.mbti !== "INTJ") throw new Error("Case 1 MBTI failed");
    if (case1Result.explicit.enneagram_raw !== "5w4") throw new Error("Case 1 Enneagram raw failed");
    if (case1Result.wingSource !== "explicit") throw new Error("Case 1 Enneagram wing source failed");
    if (case1Result.explicit.tritype !== "513") throw new Error("Case 1 Tritype failed");
    if (case1Result.explicit.instinctual_variant !== "sx/sp") throw new Error("Case 1 Instinctual variant failed");
    if (case1Result.explicit.socionics !== "ILI") throw new Error("Case 1 Socionics failed");
    if (case1Result.explicit.attitudinal_psyche !== "LVFE") throw new Error("Case 1 AP failed");
    if (case1Result.explicit.riasec !== null) throw new Error("Case 1 RIASEC failed");

    // Case 2: INTJ Enneagram 5 Tritype 513 ILI LVFE (No wing, no RIASEC)
    const case2Profile: UserProfile = {
        name: "Test Case 2",
        mbti: "INTJ",
        enneagram: {
            type: 5,
            wing: "unknown",
            tritype: "513",
        },
        instinctualVariant: "unknown",
        socionics: "ILI",
        attitudinalPsyche: "LVFE",
        temperament: "unknown",
        riasec: "",
        bigFive: "unknown"
    };

    const case2Result = buildNormalizedInput(case2Profile);
    console.log("Case 2 Input: INTJ Enneagram 5 Tritype 513 ILI LVFE");
    console.log("Result Explicit:", JSON.stringify(case2Result.explicit, null, 2));
    console.log("Result Missing:", case2Result.missing);
    console.log("Result Notes:", case2Result.notes);
    console.log("Result Wing Source:", case2Result.wingSource);
    console.log("-------------------------------------------\n");

    // Assertions for Case 2
    if (case2Result.explicit.enneagram_raw !== "5w4") throw new Error("Case 2 Enneagram wing inference failed");
    if (case2Result.wingSource !== "inferred") throw new Error("Case 2 Wing source failed");
    if (case2Result.explicit.riasec !== null) throw new Error("Case 2 RIASEC failed");

    // Case 3: INTJ 5w6 514 sp/so LII FLVE RIASEC IRC
    const case3Profile: UserProfile = {
        name: "Test Case 3",
        mbti: "INTJ",
        enneagram: {
            type: 5,
            wing: 6,
            tritype: "514",
        },
        instinctualVariant: "sp/so",
        socionics: "LII",
        attitudinalPsyche: "FLVE",
        temperament: "unknown",
        riasec: "IRC",
        bigFive: "unknown"
    };

    const case3Result = buildNormalizedInput(case3Profile);
    console.log("Case 3 Input: INTJ 5w6 514 sp/so LII FLVE RIASEC IRC");
    console.log("Result Explicit:", JSON.stringify(case3Result.explicit, null, 2));
    console.log("Result Missing:", case3Result.missing);
    console.log("Result Notes:", case3Result.notes);
    console.log("Result Wing Source:", case3Result.wingSource);
    console.log("-------------------------------------------\n");

    // Assertions for Case 3
    if (case3Result.explicit.riasec !== "IRC") throw new Error("Case 3 RIASEC failed");
    if (case3Result.explicit.enneagram_raw !== "5w6") throw new Error("Case 3 Enneagram wing failed");

    // Case 4: ENFP 7w6 sx/so
    const case4Profile: UserProfile = {
        name: "Test Case 4",
        mbti: "ENFP",
        enneagram: {
            type: 7,
            wing: 6,
            tritype: "",
        },
        instinctualVariant: "sx/so",
        socionics: "unknown",
        attitudinalPsyche: "unknown",
        temperament: "unknown",
        riasec: "",
        bigFive: "unknown"
    };

    const case4Result = buildNormalizedInput(case4Profile);
    console.log("Case 4 Input: ENFP 7w6 sx/so");
    console.log("Result Explicit:", JSON.stringify(case4Result.explicit, null, 2));
    console.log("Result Missing:", case4Result.missing);
    console.log("Result Notes:", case4Result.notes);
    console.log("Result Wing Source:", case4Result.wingSource);
    console.log("-------------------------------------------\n");

    // Assertions for Case 4
    if (case4Result.explicit.socionics !== null) throw new Error("Case 4 Socionics must be null");
    if (case4Result.explicit.attitudinal_psyche !== null) throw new Error("Case 4 Attitudinal Psyche must be null");
    if (case4Result.explicit.riasec !== null) throw new Error("Case 4 RIASEC must be null");

    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

try {
    runTest();
} catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
}
