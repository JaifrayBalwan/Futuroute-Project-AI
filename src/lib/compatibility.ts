import { TEXT_TO_SIGNALS } from "./engine";
import { getCareerInsight } from "./career-insights";
import type { Career } from "./career-types";
import type { UserProfileRecord } from "./db";
import type { DiscoveryAnswers } from "./store";

export type CompatibilityBand = "Strong Match" | "Good Match" | "Moderate Match" | "Low Match";

export const COMPATIBILITY_WEIGHTS = {
  interests: 0.25,
  subjects: 0.2,
  skills: 0.2,
  strengths: 0.15,
  financial: 0.1,
  readiness: 0.1,
} as const;

export type CompatibilityCategoryBreakdown = {
  key: keyof typeof COMPATIBILITY_WEIGHTS;
  label: string;
  weightPct: number;
  score: number; // 0-100 within category
  detail: string;
};

export type CompatibilityReport = {
  careerId: string;
  score: number; // 0-100 weighted total
  band: CompatibilityBand;
  breakdown: CompatibilityCategoryBreakdown[];
  matchedStrengths: string[];
  missingSkills: string[];
  missingQualifications: string[];
  improvementAreas: string[];
  missingProfileFields: string[];
  financialAlignmentNote: string;
  disclaimer: string;
};

const EDU_RANK: Record<string, number> = {
  "Class 8–10": 1,
  "Class 9–10": 1,
  "Class 11–12": 2,
  Diploma: 3,
  Undergraduate: 4,
  Postgraduate: 5,
  "Working / gap year": 4,
};

function expandSignalTokens(items: string[]): Set<string> {
  const out = new Set<string>();
  for (const item of items) {
    const low = item.trim().toLowerCase();
    if (!low) continue;
    out.add(low);
    for (const word of low.split(/[\s/,&-]+/)) {
      if (word.length >= 3) out.add(word);
    }
    for (const mapped of TEXT_TO_SIGNALS[item] ?? TEXT_TO_SIGNALS[low] ?? []) {
      out.add(mapped.toLowerCase());
    }
  }
  return out;
}

function minEduRank(minEdu: string): number {
  const m = minEdu.toLowerCase();
  if (m.includes("master") || m.includes("postgrad") || m.includes("mbbs") || m.includes("phd"))
    return 5;
  if (m.includes("bachelor") || m.includes("degree") || m.includes("b.tech") || m.includes("ll.b"))
    return 4;
  if (m.includes("diploma")) return 3;
  if (m.includes("12")) return 2;
  return 1;
}

export function getCompatibilityBand(score: number): CompatibilityBand {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Moderate Match";
  return "Low Match";
}

export function computeCompatibility(
  career: Career,
  profile?: UserProfileRecord | null,
  fallbackAnswers?: DiscoveryAnswers,
): CompatibilityReport {
  const interests = profile?.interests?.length
    ? profile.interests
    : Array.isArray(fallbackAnswers?.["interests"])
      ? (fallbackAnswers["interests"] as string[])
      : [];
  const subjects = profile?.subjects?.length
    ? profile.subjects
    : Array.isArray(fallbackAnswers?.["subjects"])
      ? (fallbackAnswers["subjects"] as string[])
      : [];
  const capabilities = profile?.capabilities?.length
    ? profile.capabilities
    : Array.isArray(fallbackAnswers?.["capabilities"])
      ? (fallbackAnswers["capabilities"] as string[])
      : [];
  const currentSkills = profile?.currentSkills ?? [];
  const eduLevel =
    profile?.educationLevel ??
    (typeof fallbackAnswers?.["education"] === "string" ? fallbackAnswers["education"] : undefined);
  const weeklyHours =
    profile?.weeklyHours ??
    (typeof fallbackAnswers?.["hours"] === "number" ? fallbackAnswers["hours"] : undefined);
  const budget = profile?.budget ?? 0;

  const missingProfileFields: string[] = [];
  if (interests.length === 0) missingProfileFields.push("Personal interests");
  if (subjects.length === 0) missingProfileFields.push("Favourite subjects");
  if (currentSkills.length === 0) missingProfileFields.push("Current skills");
  if (capabilities.length === 0) missingProfileFields.push("Strengths & capabilities");
  if (!eduLevel) missingProfileFields.push("Education level");
  if (!profile?.expectedStartingSalaryInr && !profile?.preferredWorkLocation) {
    missingProfileFields.push("Financial expectations & work location");
  }

  // 1. Interests (25%)
  const userIntTokens = expandSignalTokens(interests);
  const careerInterests = career.interests.map((x) => x.toLowerCase());
  const interestHits = careerInterests.filter(
    (ci) => userIntTokens.has(ci) || career.tags.some((t) => userIntTokens.has(t.toLowerCase())),
  );
  const interestDirectCount = careerInterests.filter((ci) => userIntTokens.has(ci)).length;
  const interestScore =
    interests.length === 0
      ? 45
      : Math.min(
          100,
          Math.round(
            (interestDirectCount / Math.max(1, careerInterests.length)) * 85 +
              (interestHits.length > 0 ? 15 : 0),
          ),
        );

  // 2. Subjects (20%)
  const userSubTokens = expandSignalTokens(subjects);
  const subjDirect = career.subjects.filter(
    (cs) =>
      userSubTokens.has(cs.toLowerCase()) ||
      cs
        .toLowerCase()
        .split(/[\s/,&-]+/)
        .some((w) => w.length >= 4 && userSubTokens.has(w)),
  );
  const subjectSignalOverlap = career.subjects.filter((cs) =>
    (TEXT_TO_SIGNALS[cs] ?? []).some((sig) => userSubTokens.has(sig)),
  );
  const subjectScore =
    subjects.length === 0
      ? 50
      : Math.min(
          100,
          Math.round(
            (subjDirect.length / Math.max(1, career.subjects.length)) * 75 +
              (subjectSignalOverlap.length > 0 ? 25 : 0),
          ),
        );

  // 3. Skills (20%) — matches explicit currentSkills + related subject/work tokens against career.skills
  const userSkillTokens = expandSignalTokens([...currentSkills, ...capabilities, ...subjects]);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const reqSkill of career.skills) {
    const words = reqSkill
      .toLowerCase()
      .split(/[\s/,&-]+/)
      .filter((w) => w.length >= 3);
    const hasMatch =
      userSkillTokens.has(reqSkill.toLowerCase()) ||
      words.some((w) => userSkillTokens.has(w)) ||
      (TEXT_TO_SIGNALS[reqSkill]?.some((sig) => userSkillTokens.has(sig)) ?? false);
    if (hasMatch) matchedSkills.push(reqSkill);
    else missingSkills.push(reqSkill);
  }
  const skillScore =
    currentSkills.length === 0 && capabilities.length === 0
      ? 35
      : Math.min(
          100,
          Math.round(
            (matchedSkills.length / Math.max(1, career.skills.length)) * 85 +
              (currentSkills.length > 0 ? 15 : 0),
          ),
        );

  // 4. Strengths & capabilities + preferred environment (15%)
  const userCapTokens = expandSignalTokens(capabilities);
  const matchedCaps = career.capabilities.filter((c) => userCapTokens.has(c.toLowerCase()));
  const envMatch =
    profile?.environment &&
    profile.environment !== "No preference" &&
    career.environment
      .toLowerCase()
      .includes((profile.environment.split(" ")[0] ?? "").toLowerCase());
  const strengthScore =
    capabilities.length === 0
      ? 45
      : Math.min(
          100,
          Math.round(
            (matchedCaps.length / Math.max(1, career.capabilities.length)) * 85 +
              (envMatch ? 15 : 5),
          ),
        );

  // 5. Financial expectations & study cost alignment (10%)
  const insight = getCareerInsight(career);
  const expectedStart = profile?.expectedStartingSalaryInr;
  const desiredLong = profile?.desiredLongTermSalaryInr;
  const eduBudget = profile?.educationBudgetInr ?? budget;
  let financialScore = 72;
  let financialAlignmentNote = `Typical India entry range is ₹${(insight.indiaEntryInr[0] / 100_000).toFixed(1)}L–₹${(insight.indiaEntryInr[1] / 100_000).toFixed(1)}L/yr; starter learning budget fits ₹${career.budgetTier.toLocaleString("en-IN")}.`;

  if (expectedStart && expectedStart > 0) {
    const targetPool: [number, number] =
      profile?.preferredWorkLocation === "Abroad"
        ? [insight.abroadEntryUsd[0] * 84.5, insight.abroadEntryUsd[1] * 84.5]
        : insight.indiaEntryInr;
    if (expectedStart <= targetPool[1] * 1.05) {
      financialScore = 90;
      financialAlignmentNote = `Your expected starting compensation (₹${(expectedStart / 100_000).toFixed(1)}L) aligns realistically with ${profile?.preferredWorkLocation === "Abroad" ? "international" : "India"} entry benchmarks.`;
    } else if (expectedStart <= targetPool[1] * 1.45) {
      financialScore = 62;
      financialAlignmentNote = `Your expected starting pay (₹${(expectedStart / 100_000).toFixed(1)}L) sits slightly above typical entry benchmarks — typically reachable by mid-career.`;
    } else {
      financialScore = 38;
      financialAlignmentNote = `Expected starting pay (₹${(expectedStart / 100_000).toFixed(1)}L) exceeds typical entry bands for this role; review mid/experienced salary progression or combine specializations.`;
    }
  }
  if (desiredLong && desiredLong > 0) {
    const expMax =
      profile?.preferredWorkLocation === "Abroad"
        ? insight.abroadExperiencedUsd[1] * 84.5
        : insight.indiaExperiencedInr[1];
    if (desiredLong > expMax * 1.4) {
      financialScore = Math.max(30, financialScore - 15);
    }
  }
  if (eduBudget < career.budgetTier && profile?.willingToInvestEducation === "No") {
    financialScore = Math.max(30, financialScore - 15);
  }

  // 6. Learning time & educational readiness (10%)
  const userEduRank = eduLevel ? (EDU_RANK[eduLevel] ?? 2) : 2;
  const reqEduRank = minEduRank(career.minEducation);
  const eduGap = Math.max(0, reqEduRank - userEduRank);
  const hoursBonus =
    typeof weeklyHours === "number" ? (weeklyHours >= 10 ? 25 : weeklyHours >= 5 ? 18 : 10) : 12;
  const readinessBase = eduGap === 0 ? 75 : eduGap === 1 ? 58 : Math.max(25, 70 - eduGap * 18);
  const readinessScore = Math.min(100, readinessBase + hoursBonus);

  const missingQualifications: string[] = [];
  if (eduGap > 0) {
    missingQualifications.push(
      `Recommended baseline: ${career.minEducation} (pathway: ${career.pathways[0] ?? "Structured degree/diploma"})`,
    );
  }
  if (profile?.willingHigherEducation === "No" && reqEduRank >= 5) {
    missingQualifications.push(
      "Usually expects postgraduate or formal licensing — check alternative routes.",
    );
  }

  const breakdown: CompatibilityCategoryBreakdown[] = [
    {
      key: "interests",
      label: "Interests & curiosity",
      weightPct: Math.round(COMPATIBILITY_WEIGHTS.interests * 100),
      score: interestScore,
      detail:
        interests.length === 0
          ? "Add interests in Profile for tighter alignment."
          : interestDirectCount > 0
            ? `Matches ${interestDirectCount} of your core interests`
            : "Partial thematic overlap with your interest tags",
    },
    {
      key: "subjects",
      label: "Favourite subjects",
      weightPct: Math.round(COMPATIBILITY_WEIGHTS.subjects * 100),
      score: subjectScore,
      detail:
        subjects.length === 0
          ? "Optional school/college subjects not yet listed."
          : subjDirect.length > 0
            ? `Connects with ${subjDirect.join(", ")}`
            : `Helpful foundations: ${career.subjects.slice(0, 2).join(", ")}`,
    },
    {
      key: "skills",
      label: "Current skills",
      weightPct: Math.round(COMPATIBILITY_WEIGHTS.skills * 100),
      score: skillScore,
      detail:
        matchedSkills.length > 0
          ? `Already covers ${matchedSkills.length}/${career.skills.length} listed skills`
          : `Build starter skills: ${career.skills.slice(0, 2).join(", ")}`,
    },
    {
      key: "strengths",
      label: "Strengths & environment",
      weightPct: Math.round(COMPATIBILITY_WEIGHTS.strengths * 100),
      score: strengthScore,
      detail:
        matchedCaps.length > 0
          ? `Uses your strengths: ${matchedCaps
              .slice(0, 3)
              .map((c) => c.replace(/_/g, " "))
              .join(", ")}`
          : `Needs ${career.capabilities
              .slice(0, 2)
              .map((c) => c.replace(/_/g, " "))
              .join(", ")}`,
    },
    {
      key: "financial",
      label: "Financial expectations",
      weightPct: Math.round(COMPATIBILITY_WEIGHTS.financial * 100),
      score: financialScore,
      detail: financialAlignmentNote,
    },
    {
      key: "readiness",
      label: "Time & education readiness",
      weightPct: Math.round(COMPATIBILITY_WEIGHTS.readiness * 100),
      score: readinessScore,
      detail: `${weeklyHours ?? 5} h/wk pace · Baseline: ${career.minEducation}`,
    },
  ];

  const totalScore = Math.max(
    1,
    Math.min(
      99,
      Math.round(
        breakdown.reduce((acc, item) => acc + item.score * COMPATIBILITY_WEIGHTS[item.key], 0),
      ),
    ),
  );

  const matchedStrengths = Array.from(
    new Set([...matchedCaps.map((c) => c.replace(/_/g, " ")), ...matchedSkills, ...subjDirect]),
  ).slice(0, 6);

  const improvementAreas = [
    ...missingSkills.slice(0, 3).map((s) => `Develop practical experience in ${s}`),
    ...(profile?.weaknesses?.length
      ? [
          `Watch out for self-noted areas (${profile.weaknesses.slice(0, 2).join(", ")}) when choosing daily tasks`,
        ]
      : []),
    ...(eduGap > 0
      ? [`Plan academic prerequisite (${career.minEducation}) or portfolio alternative`]
      : []),
  ].slice(0, 4);

  return {
    careerId: career.id,
    score: totalScore,
    band: getCompatibilityBand(totalScore),
    breakdown,
    matchedStrengths,
    missingSkills,
    missingQualifications,
    improvementAreas,
    missingProfileFields,
    financialAlignmentNote,
    disclaimer:
      "Compatibility score is a rule-based estimate across 6 profile dimensions — use it as a guide alongside practical trials, not a scientific prediction.",
  };
}
