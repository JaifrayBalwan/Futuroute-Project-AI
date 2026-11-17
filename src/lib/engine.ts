// Deterministic matching, budget planning, and roadmap builder grounded in the 260-career database.
// Illustrative exploration aid — not a validated psychological assessment or job guarantee.
import {
  BUDGET_CATALOG,
  scoreCatalogItemForCareer,
  type BudgetCatalogItem,
} from "./budget-catalog";
import { CAREERS, getCareer, type Career, type Resource } from "./careers";
import type { DiscoveryAnswers, Roadmap, Task } from "./store";

export const TEXT_TO_SIGNALS: Record<string, string[]> = {
  // Subjects
  Mathematics: ["mathematics", "analytical", "data", "finance"],
  "Computer Science": ["technology", "ai", "technical", "software"],
  Physics: ["science", "technology", "mathematics", "engineering"],
  Chemistry: ["science", "healthcare", "environment"],
  Biology: ["healthcare", "science", "environment", "agriculture"],
  "Art & Design": ["design", "art", "creativity"],
  "Fine Arts": ["art", "design", "creativity"],
  English: ["writing", "communication", "media"],
  "Hindi / Regional language": ["writing", "communication", "media"],
  Economics: ["finance", "business", "government", "analytical"],
  "Business Studies": ["business", "entrepreneurship", "leadership"],
  Accountancy: ["finance", "business", "analytical"],
  "Political Science": ["law", "government", "social", "critical_thinking"],
  Psychology: ["social", "healthcare", "design", "observation"],
  History: ["history", "law", "media", "research"],
  Geography: ["environment", "travel", "government", "agriculture"],
  "Physical Education": ["sports", "football", "cricket", "fitness"],
  "Environmental Studies": ["environment", "agriculture", "science"],
  Music: ["music", "art", "creativity"],

  // Legacy & Discover step phrases -> canonical IDs
  Coding: ["technology", "technical", "problem_solving"],
  Gaming: ["gaming", "technology", "design"],
  Drawing: ["art", "design", "creativity"],
  Writing: ["writing", "communication", "media"],
  "Social media": ["media", "business", "communication"],
  Puzzles: ["problem_solving", "analytical", "mathematics"],
  "Investigating mysteries": ["cyber", "law", "science", "observation", "critical_thinking"],
  Photography: ["art", "media", "observation"],
  Debating: ["law", "government", "public_speaking", "communication"],
  "Building things": ["technology", "engineering", "entrepreneurship", "creativity"],
  "Solving logical problems": ["problem_solving", "analytical", "technology", "mathematics"],
  "Designing visuals": ["design", "art", "creativity"],
  "Working with data": ["data", "mathematics", "analytical", "ai", "finance"],
  "Talking to people": ["communication", "social", "healthcare", "hospitality"],
  "Protecting systems": ["cyber", "technology", "law", "critical_thinking"],
  "Running campaigns": ["business", "media", "entrepreneurship", "communication"],
  "Basic programming": ["technology", "technical"],
  Spreadsheets: ["data", "finance", "analytical"],
  Sketching: ["design", "art", "creativity"],
  "Public speaking": ["public_speaking", "leadership", "communication"],
  Creativity: ["creativity", "design", "art"],
  "Problem-solving": ["problem_solving", "analytical"],
  Impact: ["social", "environment", "healthcare", "government"],
  Stability: ["finance", "government", "healthcare"],
  Flexibility: ["technology", "design", "entrepreneurship", "media"],
  "Physical Fitness": ["sports", "fitness", "defence"],
  "Physical fitness": ["sports", "fitness", "defence"],

  // Direct canonical interests & capabilities
  sports: ["sports", "fitness", "teamwork"],
  football: ["football", "sports", "teamwork"],
  cricket: ["cricket", "sports", "teamwork"],
  gaming: ["gaming", "technology", "creativity"],
  technology: ["technology", "technical"],
  ai: ["ai", "technology", "mathematics"],
  business: ["business", "entrepreneurship"],
  entrepreneurship: ["entrepreneurship", "business", "leadership"],
  music: ["music", "art", "creativity"],
  art: ["art", "design", "creativity"],
  design: ["design", "art", "creativity"],
  history: ["history", "research", "writing"],
  science: ["science", "research"],
  mathematics: ["mathematics", "analytical"],
  writing: ["writing", "communication"],
  travel: ["travel", "hospitality", "environment"],
  healthcare: ["healthcare", "science", "social"],
  law: ["law", "government", "critical_thinking"],
  media: ["media", "writing", "communication"],
  environment: ["environment", "science", "agriculture"],
  social: ["social", "communication"],
  leadership: ["leadership", "teamwork", "communication"],
  communication: ["communication", "writing"],
  creativity: ["creativity", "design", "art"],
  analytical: ["analytical", "mathematics"],
  problem_solving: ["problem_solving", "analytical"],
  observation: ["observation", "research"],
  teamwork: ["teamwork", "leadership"],
  public_speaking: ["public_speaking", "communication"],
  research: ["research", "critical_thinking"],
  fitness: ["fitness", "sports"],
  organisation: ["organisation", "leadership"],
  critical_thinking: ["critical_thinking", "analytical"],
  technical: ["technical", "technology"],
};

const HOBBY_BRIDGE_CAREERS: Record<string, string[]> = {
  football: [
    "football-coach",
    "sports-analytics-engineer",
    "sports-performance-analyst",
    "sports-journalist",
    "sports-psychologist",
    "sports-event-manager",
    "sports-broadcast-director",
    "sports-law-attorney",
    "sports-physiotherapist",
    "data-analyst",
    "digital-marketer",
    "entrepreneurship-founder",
  ],
  sports: [
    "sports-analytics-engineer",
    "sports-performance-analyst",
    "sports-psychologist",
    "sports-journalist",
    "sports-event-manager",
    "sports-physiotherapist",
    "sports-nutritionist",
    "sports-law-attorney",
    "data-analyst",
    "digital-marketer",
  ],
  cricket: [
    "sports-analytics-engineer",
    "sports-performance-analyst",
    "sports-journalist",
    "sports-broadcast-director",
    "sports-event-manager",
    "sports-physiotherapist",
  ],
  gaming: [
    "game-developer",
    "esports-platform-engineer",
    "esports-strategist",
    "game-designer",
    "audio-designer",
    "community-manager",
    "digital-marketer",
  ],
  music: [
    "audio-engineer",
    "music-producer",
    "sound-designer",
    "music-therapist",
    "media-producer",
    "event-manager",
  ],
  art: [
    "ui-ux-designer",
    "graphic-designer",
    "motion-designer",
    "illustrator",
    "product-designer",
    "art-director",
  ],
};

function stableTieHash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export type Recommendation = { career: Career; reasons: string[] };

export type RecommendationItem = {
  career: Career;
  group: "strong" | "alternative" | "unexpected" | "emerging";
  whyItMatches: string;
  relevantSkills: string[];
  skillsToDevelop: string[];
  requiredQualifications: string[];
  howToStart: string;
  practicalTrial: string;
  reasons: string[];
};

export type GroupedRecommendations = {
  strongMatches: RecommendationItem[];
  alternativePaths: RecommendationItem[];
  unexpectedDiscoveries: RecommendationItem[];
  emergingOpportunities: RecommendationItem[];
  source: "deterministic" | "gemini";
  summaryNote: string;
};

function collectSignals(a: DiscoveryAnswers): {
  tokens: Set<string>;
  rawLabels: string[];
  budgetNum: number;
  envPref: string;
} {
  const keys = ["subjects", "interests", "capabilities", "work", "skills", "priorities"];
  const rawLabels: string[] = [];
  const tokens = new Set<string>();

  for (const k of keys) {
    const val = a[k];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "string" && item.trim()) {
          rawLabels.push(item);
          tokens.add(item.toLowerCase());
          for (const mapped of TEXT_TO_SIGNALS[item] ?? []) tokens.add(mapped);
        }
      }
    }
  }

  let budgetNum = 5000;
  if (typeof a["budget"] === "number") budgetNum = a["budget"];
  else if (typeof a["budget"] === "string") {
    if (a["budget"].includes("0 —")) budgetNum = 0;
    else if (a["budget"].includes("500")) budgetNum = 500;
    else if (a["budget"].includes("1,000")) budgetNum = 1000;
    else if (a["budget"].includes("2,000")) budgetNum = 2000;
  }

  const envPref = typeof a["environment"] === "string" ? a["environment"].toLowerCase() : "";
  return { tokens, rawLabels, budgetNum, envPref };
}

function scoreCareer(
  c: Career,
  a: DiscoveryAnswers,
  tokens: Set<string>,
  rawLabels: string[],
  budgetNum: number,
  envPref: string,
) {
  const curious = Array.isArray(a["curious"]) ? (a["curious"] as string[]) : [];
  let score = 0;
  const matchedLabels: string[] = [];
  const careerInterests = new Set(c.interests.map((x) => x.toLowerCase()));
  const careerCaps = new Set(c.capabilities.map((x) => x.toLowerCase()));
  const careerSubjects = new Set(c.subjects.map((x) => x.toLowerCase()));
  const careerTags = new Set(c.tags.map((x) => x.toLowerCase()));

  if (rawLabels.includes("Investigating mysteries") && c.id === "cybersecurity-analyst") score += 4;
  if (rawLabels.includes("Protecting systems") && c.id === "cybersecurity-analyst") score += 4;
  if (rawLabels.includes("Designing visuals") && c.id === "ui-ux-designer") score += 4;

  // Hobby-to-cross-industry bridges (e.g., Football -> Coach, Analyst, Journalist, Psychologist, Law, Marketing)
  for (const [hobby, bridgeIds] of Object.entries(HOBBY_BRIDGE_CAREERS)) {
    if (tokens.has(hobby) && bridgeIds.includes(c.id)) {
      const rankBonus = Math.max(1.5, 4 - bridgeIds.indexOf(c.id) * 0.25);
      score += rankBonus;
      if (!matchedLabels.includes(hobby)) matchedLabels.push(hobby);
    }
  }

  for (const label of rawLabels) {
    const lower = label.toLowerCase();
    const mapped = TEXT_TO_SIGNALS[label] ?? [lower];
    let hitWeight = 0;
    if (careerInterests.has(lower)) hitWeight += 5.5;
    if (careerCaps.has(lower)) hitWeight += 4;
    if (careerSubjects.has(lower)) hitWeight += 3;
    for (const sig of mapped) {
      if (careerInterests.has(sig)) hitWeight += 2.5;
      if (careerCaps.has(sig)) hitWeight += 2;
      if (careerTags.has(sig)) hitWeight += 1;
    }
    if (hitWeight > 0) {
      score += hitWeight;
      if (!matchedLabels.includes(label)) matchedLabels.push(label);
    }
  }

  const interestOverlap = c.interests.filter((x) => tokens.has(x.toLowerCase())).length;
  const capOverlap = c.capabilities.filter((x) => tokens.has(x.toLowerCase())).length;
  if (interestOverlap >= 2) score += 3.5;
  if (interestOverlap >= 1 && capOverlap >= 2) score += 3;

  if (curious.includes(c.id)) {
    score += 5;
    matchedLabels.unshift("You listed it as a career you're curious about");
  }
  if (c.budgetTier <= budgetNum) score += 0.5;
  if (envPref && c.environment.toLowerCase().includes(envPref.split(" ")[0] ?? "")) score += 1.5;

  return { career: c, score, matchedLabels, interestOverlap, capOverlap };
}

export function buildRecommendationItem(
  c: Career,
  group: RecommendationItem["group"],
  matchedLabels: string[],
  userTokens: Set<string>,
): RecommendationItem {
  const existingCapabilities = c.capabilities
    .filter((cap) => userTokens.has(cap.toLowerCase()))
    .map((cap) => cap.replace(/_/g, " "));
  const relevantSkills =
    existingCapabilities.length > 0
      ? existingCapabilities.slice(0, 4)
      : c.capabilities.slice(0, 2).map((cap) => cap.replace(/_/g, " "));

  const skillsToDevelop = c.skills.slice(0, 4);
  const firstRes = c.resources[0];
  const howToStart = firstRes
    ? `Start free with ${firstRes.name} (${firstRes.cost}) and attempt the starter project: ${c.projects[0] ?? c.trial}.`
    : `Begin with the starter project: ${c.projects[0] ?? c.trial}.`;

  const reasons = matchedLabels.length
    ? matchedLabels.slice(0, 3).map((r) => (r.startsWith("You") ? r : `Connects with “${r}”`))
    : [`Relevant option in ${c.industry} to broaden your perspective`];

  const groupPrefix: Record<RecommendationItem["group"], string> = {
    strong: `Strong alignment across your selected interests and strengths (${reasons.join("; ")}).`,
    alternative: `Draws on overlapping capabilities (${relevantSkills.join(", ")}) in ${c.industry} as a realistic alternative route.`,
    unexpected: `Bridges your profile into ${c.industry} (${c.subcategory}) — a path many students overlook initially.`,
    emerging: `An emerging career in ${c.industry} connecting modern tools with your profile (${reasons.join("; ")}).`,
  };

  return {
    career: c,
    group,
    whyItMatches: groupPrefix[group],
    relevantSkills,
    skillsToDevelop,
    requiredQualifications: [...c.pathways.slice(0, 2), ...c.altRoutes.slice(0, 1)],
    howToStart,
    practicalTrial: c.trial,
    reasons,
  };
}

export function recommendGrouped(
  a: DiscoveryAnswers,
  catalog: Career[] = CAREERS,
): GroupedRecommendations {
  const { tokens, rawLabels, budgetNum, envPref } = collectSignals(a);
  const scored = catalog.map((c) => scoreCareer(c, a, tokens, rawLabels, budgetNum, envPref));
  scored.sort(
    (x, y) =>
      y.score - x.score ||
      y.interestOverlap - x.interestOverlap ||
      y.capOverlap - x.capOverlap ||
      (stableTieHash(x.career.id) % 97) - (stableTieHash(y.career.id) % 97),
  );

  const usedIds = new Set<string>();
  const strongMatches: RecommendationItem[] = [];
  const usedStrongIndustries = new Set<string>();

  for (const item of scored) {
    if (strongMatches.length >= 5) break;
    const sameIndCount = strongMatches.filter(
      (m) => m.career.industry === item.career.industry,
    ).length;
    if (
      sameIndCount >= 2 &&
      scored.some(
        (s) =>
          !usedIds.has(s.career.id) && s.score > 2 && !usedStrongIndustries.has(s.career.industry),
      )
    ) {
      continue;
    }
    usedIds.add(item.career.id);
    usedStrongIndustries.add(item.career.industry);
    strongMatches.push(buildRecommendationItem(item.career, "strong", item.matchedLabels, tokens));
  }

  const alternativePaths: RecommendationItem[] = [];
  const topIndustry = strongMatches[0]?.career.industry;
  for (const item of scored) {
    if (alternativePaths.length >= 3) break;
    if (usedIds.has(item.career.id)) continue;
    if (item.career.industry !== topIndustry && (item.capOverlap > 0 || item.score > 1)) {
      usedIds.add(item.career.id);
      alternativePaths.push(
        buildRecommendationItem(item.career, "alternative", item.matchedLabels, tokens),
      );
    }
  }
  for (const item of scored) {
    if (alternativePaths.length >= 3) break;
    if (usedIds.has(item.career.id)) continue;
    usedIds.add(item.career.id);
    alternativePaths.push(
      buildRecommendationItem(item.career, "alternative", item.matchedLabels, tokens),
    );
  }

  const unexpectedDiscoveries: RecommendationItem[] = [];
  const altIndustries = new Set(alternativePaths.map((x) => x.career.industry));
  for (const item of scored) {
    if (unexpectedDiscoveries.length >= 3) break;
    if (usedIds.has(item.career.id)) continue;
    if (
      !usedStrongIndustries.has(item.career.industry) &&
      !altIndustries.has(item.career.industry)
    ) {
      usedIds.add(item.career.id);
      altIndustries.add(item.career.industry);
      unexpectedDiscoveries.push(
        buildRecommendationItem(item.career, "unexpected", item.matchedLabels, tokens),
      );
    }
  }
  for (const item of scored) {
    if (unexpectedDiscoveries.length >= 3) break;
    if (usedIds.has(item.career.id)) continue;
    usedIds.add(item.career.id);
    unexpectedDiscoveries.push(
      buildRecommendationItem(item.career, "unexpected", item.matchedLabels, tokens),
    );
  }

  const emergingOpportunities: RecommendationItem[] = [];
  for (const item of scored) {
    if (emergingOpportunities.length >= 3) break;
    if (usedIds.has(item.career.id)) continue;
    if (item.career.emerging) {
      usedIds.add(item.career.id);
      emergingOpportunities.push(
        buildRecommendationItem(item.career, "emerging", item.matchedLabels, tokens),
      );
    }
  }
  for (const item of scored) {
    if (emergingOpportunities.length >= 3) break;
    if (usedIds.has(item.career.id)) continue;
    if (item.career.emerging || item.score >= 0) {
      usedIds.add(item.career.id);
      emergingOpportunities.push(
        buildRecommendationItem(item.career, "emerging", item.matchedLabels, tokens),
      );
    }
  }

  return {
    strongMatches,
    alternativePaths,
    unexpectedDiscoveries,
    emergingOpportunities,
    source: "deterministic",
    summaryNote:
      rawLabels.length > 0
        ? `Matched across ${catalog.length} careers using your ${rawLabels.length} selected interests, capabilities, and subjects.`
        : "Showing a broad starter sample across industries. Select your interests and capabilities to personalise these paths.",
  };
}

export function recommend(a: DiscoveryAnswers, catalog: Career[] = CAREERS): Recommendation[] {
  const { tokens, rawLabels, budgetNum, envPref } = collectSignals(a);
  if (
    rawLabels.length === 0 &&
    (!Array.isArray(a["curious"]) || (a["curious"] as string[]).length === 0)
  ) {
    return catalog.slice(0, 3).map((career) => ({
      career,
      reasons: ["A broad starting point while you explore your interests"],
    }));
  }
  const scored = catalog.map((c) => scoreCareer(c, a, tokens, rawLabels, budgetNum, envPref));
  scored.sort(
    (x, y) =>
      y.score - x.score ||
      y.interestOverlap - x.interestOverlap ||
      x.career.name.localeCompare(y.career.name),
  );
  const top = scored.filter((s) => s.score > 0).slice(0, 5);
  const list = top.length >= 3 ? top : scored.slice(0, 3);
  return list.map(({ career, matchedLabels }) => ({
    career,
    reasons: matchedLabels.length
      ? matchedLabels.slice(0, 3).map((r) => (r.startsWith("You") ? r : `You selected “${r}”`))
      : ["A broad starting point while you explore your interests"],
  }));
}

export type PlanInput = {
  project?: string;
  careerId: string;
  level: string;
  budget: number;
  hours: number;
  device: string;
  format: string;
  outcome: string;
};

export type Plan = {
  career: Career;
  learn: string[];
  free: Resource[];
  budgetTotal: number;
  recommendedSpend: number;
  remainingBalance: number;
  allocatedItems: BudgetCatalogItem[];
  paidCourses: BudgetCatalogItem[];
  paidTools: BudgetCatalogItem[];
  certificationsList: BudgetCatalogItem[];
  projectExpenses: BudgetCatalogItem[];
  overBudgetOptions: BudgetCatalogItem[];
  catalogRanked: BudgetCatalogItem[];
  optional: { item: string; note: string }[];
  extra: { item: string; note: string }[];
  certifications: string[];
  projects: string[];
  weeks: number;
  schedule: string;
  project: string;
  budgetNote: string;
  withinBudget: boolean;
  warnings: string[];
};

export function recomputePlanWithItems(base: Plan, nextItems: BudgetCatalogItem[]): Plan {
  const uniqueItems = nextItems.filter(
    (item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx,
  );
  // Enforce budget cap strictly
  const bounded: BudgetCatalogItem[] = [];
  let runningSpend = 0;
  for (const item of uniqueItems) {
    if (runningSpend + item.estimatedCostInr <= base.budgetTotal) {
      bounded.push(item);
      runningSpend += item.estimatedCostInr;
    }
  }
  const remainingBalance = Math.max(0, base.budgetTotal - runningSpend);
  const selectedIds = new Set(bounded.map((x) => x.id));

  const paidCourses = bounded.filter((x) => x.category === "paid_course");
  const paidTools = bounded.filter((x) => x.category === "paid_tool");
  const certificationsList = bounded.filter((x) => x.category === "certification");
  const projectExpenses = bounded.filter((x) => x.category === "project_expense");

  const overBudgetOptions = base.catalogRanked.filter((x) => !selectedIds.has(x.id)).slice(0, 4);

  const budgetNote =
    base.budgetTotal === 0
      ? `Free-only ₹0 track for ${base.career.name}: relies 100% on ${base.free.length} verified free resources below. Zero mandatory cost.`
      : bounded.length > 0
        ? `Tailored ₹${base.budgetTotal.toLocaleString("en-IN")} spending plan for ${base.career.name}: allocates an estimated ₹${runningSpend.toLocaleString("en-IN")} across ${bounded.length} targeted resource${bounded.length > 1 ? "s" : ""} alongside free foundations, leaving ₹${remainingBalance.toLocaleString("en-IN")} unspent.`
        : `Your ₹${base.budgetTotal.toLocaleString("en-IN")} budget is kept flexible (₹0 currently allocated). Add optional upgrades below or start immediately with free resources.`;

  return {
    ...base,
    recommendedSpend: runningSpend,
    remainingBalance,
    allocatedItems: bounded,
    paidCourses,
    paidTools,
    certificationsList,
    projectExpenses,
    overBudgetOptions,
    budgetNote,
    withinBudget: runningSpend <= base.budgetTotal,
  };
}

export function buildPlan(i: PlanInput, catalog: Career[] = CAREERS): Plan {
  const career = getCareer(i.careerId, catalog) ?? catalog[0] ?? CAREERS[0]!;
  const levelNorm: "beginner" | "some" | "comfortable" =
    i.level === "some" || i.level === "comfortable" ? i.level : "beginner";
  const baseFactor = { beginner: 1, some: 0.7, comfortable: 0.5 }[levelNorm];
  const outcomeHours = i.outcome === "project" ? 60 : i.outcome === "portfolio" ? 100 : 35;
  const totalHours = Math.round(outcomeHours * baseFactor * (0.8 + career.commitmentLevel * 0.1));
  const weeks = Math.max(2, Math.ceil(totalHours / Math.max(1, i.hours)));
  const warnings: string[] = [];
  const budgetTotal = Math.max(0, Math.round(Number(i.budget) || 0));

  const needsComputer =
    ["Technology & IT", "Artificial Intelligence", "Design", "Engineering"].includes(
      career.industry,
    ) ||
    career.tags.includes("technical") ||
    career.tags.includes("cad");

  if (i.device === "phone" && needsComputer) {
    warnings.push(
      `Hands-on labs or software tools for ${career.name} are difficult on a phone alone. Use your phone for reading/videos and a school/college lab or public library computer for practice.`,
    );
  }
  if (i.hours < 3) {
    warnings.push(
      "With under 3 hours a week, momentum fades easily — short focused 25-minute sessions twice or three times a week work well.",
    );
  }

  // Score and rank paid/hybrid catalog items for this specific career, skill level & format
  const catalogRanked = [...BUDGET_CATALOG]
    .map((item) => {
      let score = scoreCatalogItemForCareer(item, career, levelNorm);
      if (i.format === "video" && item.category === "paid_course") score += 1.2;
      if (
        i.format === "interactive" &&
        (item.category === "paid_tool" || item.category === "project_expense")
      )
        score += 1.2;
      if (i.outcome === "portfolio" && item.category === "project_expense") score += 1;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.estimatedCostInr - b.item.estimatedCostInr)
    .map((x) => x.item);

  // Select realistic budget-fitting mix across categories when budget > 0
  const chosen: BudgetCatalogItem[] = [];
  if (budgetTotal > 0) {
    let spent = 0;
    const categoryOrder: BudgetCatalogItem["category"][] =
      levelNorm === "comfortable"
        ? ["certification", "paid_tool", "project_expense", "paid_course"]
        : ["paid_course", "project_expense", "paid_tool", "certification"];

    // Pass 1: best-fitting affordable item per category
    for (const cat of categoryOrder) {
      if (chosen.length >= 4) break;
      const match = catalogRanked.find(
        (item) =>
          item.category === cat &&
          !chosen.some((c) => c.id === item.id) &&
          spent + item.estimatedCostInr <= budgetTotal,
      );
      if (match) {
        chosen.push(match);
        spent += match.estimatedCostInr;
      }
    }

    // Pass 2: if budget still has meaningful room (>= ₹500 left), add highest-value remaining relevant item
    if (budgetTotal >= 1000 && budgetTotal - spent >= 400 && chosen.length < 4) {
      for (const item of catalogRanked) {
        if (chosen.length >= 4) break;
        if (chosen.some((c) => c.id === item.id)) continue;
        if (spent + item.estimatedCostInr <= budgetTotal) {
          chosen.push(item);
          spent += item.estimatedCostInr;
        }
      }
    }
  }

  const optional: { item: string; note: string }[] = [
    {
      item: "Verified course or exam certificate (optional)",
      note: "Core lectures/curriculum can be studied free; check current certificate exam fee directly on provider sites (such as NPTEL or Coursera).",
    },
    {
      item: "Starter textbook, field notebook, or second-hand guide",
      note: "Optional — public/school libraries or free NCERT/MIT OCW notes cover fundamentals. Price varies by seller.",
    },
  ];
  if (career.budgetTier >= 1000) {
    optional.push({
      item: "Official federation, licensing, or formal entrance/certification path",
      note: `${career.estimatedCostNote} Not required just to explore the fundamentals.`,
    });
  }

  const extra: { item: string; note: string }[] = [
    {
      item: "Internet connection",
      note: "Uses your existing data/Wi-Fi; downloading guides offline saves data.",
    },
    ...(i.device === "phone" && needsComputer
      ? [
          {
            item: "Shared computer access",
            note: "Prefer school/college labs or community libraries rather than buying hardware immediately.",
          },
        ]
      : []),
    ...(career.environment.toLowerCase().includes("outdoors")
      ? [
          {
            item: "Transport / basic field gear",
            note: "Depending on local volunteering or academy visits; start close to home first.",
          },
        ]
      : []),
  ];

  const certifications = [...career.pathways.slice(0, 2), ...career.altRoutes.slice(0, 1)];

  const initialPlan: Plan = {
    career,
    learn: career.skills,
    free: career.resources,
    budgetTotal,
    recommendedSpend: 0,
    remainingBalance: budgetTotal,
    allocatedItems: [],
    paidCourses: [],
    paidTools: [],
    certificationsList: [],
    projectExpenses: [],
    overBudgetOptions: [],
    catalogRanked,
    optional,
    extra,
    certifications,
    projects: career.projects,
    weeks,
    schedule: `About ${totalHours} hours in total ≈ ${weeks} weeks at ${i.hours} h/week (illustrative pacing, not a guarantee).`,
    project: i.project || career.projects[0] || career.trial,
    budgetNote: "",
    withinBudget: true,
    warnings,
  };

  return recomputePlanWithItems(initialPlan, chosen);
}

type MilestoneSpec = {
  phase: 1 | 2 | 3 | 4 | 5;
  title: string;
  desc: string;
  hours: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  objectives: string[];
  practicalTask: string;
  resIdx?: number;
};

const CAREER_ROADMAP_TEMPLATES: Record<string, MilestoneSpec[]> = {
  "software-developer": [
    {
      phase: 1,
      title: "Programming & version control fundamentals",
      desc: "Learn variables, control flow, functions, and Git basics using a free browser/IDE workflow.",
      hours: 10,
      difficulty: "Beginner",
      objectives: ["Write clean functions & loops", "Create commits and push a repo to GitHub"],
      practicalTask: "Publish a CLI quiz or expense calculator on GitHub with a clear README.",
      resIdx: 0,
    },
    {
      phase: 2,
      title: "Data structures & debugging workflows",
      desc: "Understand arrays, hash maps, complexity basics, and reading stack traces.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Choose arrays vs maps for fast lookup", "Debug failing logic step by step"],
      practicalTask: "Solve 10 beginner algorithmic exercises and document your approach.",
      resIdx: 1,
    },
    {
      phase: 3,
      title: "APIs, databases & modular architecture",
      desc: "Connect a web frontend or service to REST JSON endpoints and relational or document storage.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Design clean data schemas", "Handle validation & network error states"],
      practicalTask: "Build a notes or study tracker API with CRUD persistence.",
      resIdx: 0,
    },
    {
      phase: 4,
      title: "Full capstone application & code review",
      desc: "Build, test, and deploy an end-to-end starter project solving a genuine problem.",
      hours: 16,
      difficulty: "Advanced",
      objectives: ["Write basic automated tests", "Deploy live and gather 2 peer review notes"],
      practicalTask: "Ship a deployed web app with live demo link and walkthrough notes.",
      resIdx: 0,
    },
    {
      phase: 5,
      title: "Technical portfolio, GitHub & fresher prep",
      desc: "Polish 2 public repos, write a 1-page technical CV, and practise explaining system trade-offs.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: [
        "Prepare concise project pitch summaries",
        "Practise common fresher problem-solving interviews",
      ],
      practicalTask: "Complete a mock 20-minute walkthrough of your capstone code.",
      resIdx: 1,
    },
  ],
  "ai-ml-engineer": [
    {
      phase: 1,
      title: "Python, NumPy & foundational linear intuition",
      desc: "Set up Kaggle/Colab notebooks and revise vectors, probability basics, and Python data types.",
      hours: 10,
      difficulty: "Beginner",
      objectives: ["Load CSV datasets with pandas", "Visualize distributions & missing values"],
      practicalTask: "Analyze an open school/sports CSV dataset in a public Kaggle notebook.",
      resIdx: 0,
    },
    {
      phase: 2,
      title: "Supervised learning & feature engineering",
      desc: "Train regression, tree, and classification baselines with clean train/validation splits.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Prevent data leakage & overfitting", "Compare precision, recall & RMSE"],
      practicalTask: "Submit a clean baseline entry to a Kaggle Getting Started competition.",
      resIdx: 0,
    },
    {
      phase: 3,
      title: "Deep learning, NLP & open model evaluation",
      desc: "Explore neural nets, embeddings, or fine-tuning small open-source Hugging Face models.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Understand tokenization & embeddings", "Benchmark error cases quantitatively"],
      practicalTask:
        "Build a classifier or semantic search notebook using an open pre-trained model.",
      resIdx: 1,
    },
    {
      phase: 4,
      title: "Reproducible ML capstone & model card",
      desc: "Package an end-to-end ML workflow with evaluation charts, limitations, and live demo.",
      hours: 16,
      difficulty: "Advanced",
      objectives: [
        "Document dataset bias and edge-case failures",
        "Publish reproducible code + model card",
      ],
      practicalTask: "Deploy a lightweight demo app or interactive notebook with clear metrics.",
      resIdx: 0,
    },
    {
      phase: 5,
      title: "Research reading, internships & technical CV",
      desc: "Summarize 2 applied papers and apply to AI/data internships via curated student portals.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: [
        "Explain an ML pipeline clearly to non-technical reviewers",
        "Align projects to entry roles",
      ],
      practicalTask: "Write a 300-word breakdown of your capstone methodology for LinkedIn/GitHub.",
      resIdx: 1,
    },
  ],
  "web-developer": [
    {
      phase: 1,
      title: "Semantic HTML5, accessible CSS & Flexbox/Grid",
      desc: "Craft responsive layouts that remain readable on both mobile phones and wide desktops.",
      hours: 10,
      difficulty: "Beginner",
      objectives: ["Use landmarks & semantic headings", "Build mobile-first responsive grids"],
      practicalTask: "Code a 3-section responsive portfolio landing page from scratch.",
      resIdx: 0,
    },
    {
      phase: 2,
      title: "Modern JavaScript, DOM & async data fetching",
      desc: "Handle state, events, form validation, and REST API error states cleanly.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Manipulate arrays/objects cleanly", "Render loading and error UI reliably"],
      practicalTask: "Build an interactive filterable catalog using a public JSON dataset.",
      resIdx: 1,
    },
    {
      phase: 3,
      title: "Component architecture, React & routing",
      desc: "Structure reusable UI components, client state, and accessible keyboard navigation.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Compose modular React hooks & forms", "Pass accessibility & contrast checks"],
      practicalTask: "Upgrade your catalog into a multi-view SPA with saved favorites.",
      resIdx: 0,
    },
    {
      phase: 4,
      title: "Full capstone web build & performance check",
      desc: "Complete your starter web project, audit Lighthouse performance, and fix edge cases.",
      hours: 14,
      difficulty: "Advanced",
      objectives: ["Optimize image weights & responsive breakpoints", "Collect real user feedback"],
      practicalTask: "Deploy your project publicly and record a 2-minute walkthrough.",
      resIdx: 0,
    },
    {
      phase: 5,
      title: "Frontend portfolio & junior role readiness",
      desc: "Curate live demos, prepare UI/code walkthrough talking points, and apply for internships.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: [
        "Show before/after problem solving in your portfolio",
        "Prepare HTML/CSS/JS interview basics",
      ],
      practicalTask: "Send your live portfolio link to 2 mentors for review feedback.",
      resIdx: 1,
    },
  ],
  "data-analyst": [
    {
      phase: 1,
      title: "Spreadsheet fluency & structured thinking",
      desc: "Master pivot tables, lookups, data cleaning, and formulating business questions.",
      hours: 8,
      difficulty: "Beginner",
      objectives: [
        "Spot duplicates, missing values & unit mismatches",
        "Build clean summary tables",
      ],
      practicalTask: "Clean a messy public dataset and compute 5 summary KPIs.",
      resIdx: 0,
    },
    {
      phase: 2,
      title: "SQL querying & Python/pandas essentials",
      desc: "Write SELECT, JOIN, GROUP BY, and window summaries plus basic pandas transformations.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Join multiple tables accurately", "Aggregate metrics without double counting"],
      practicalTask: "Answer 8 analytical questions against a sample retail or sports SQLite DB.",
      resIdx: 0,
    },
    {
      phase: 3,
      title: "Data storytelling & executive dashboards",
      desc: "Choose appropriate charts, highlight outliers honestly, and write insight-driven titles.",
      hours: 12,
      difficulty: "Intermediate",
      objectives: [
        "Avoid misleading axes or cluttered charts",
        "Turn metrics into concrete recommendations",
      ],
      practicalTask:
        "Build a 1-page visual dashboard (Looker Studio, Power BI Free, or notebook plots).",
      resIdx: 1,
    },
    {
      phase: 4,
      title: "End-to-end analytical case study",
      desc: "Combine cleaning, SQL/Python exploration, and visual storytelling in one portfolio piece.",
      hours: 14,
      difficulty: "Advanced",
      objectives: ["Explain assumptions & data limits clearly", "Recommend specific next actions"],
      practicalTask: "Publish a complete written + visual case study on GitHub or Kaggle.",
      resIdx: 0,
    },
    {
      phase: 5,
      title: "Analyst portfolio & business case prep",
      desc: "Practise SQL case questions and apply for data analyst / BI internships.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: [
        "Solve timed SQL & spreadsheet drills",
        "Present your capstone insights in 3 minutes",
      ],
      practicalTask: "Draft a 1-page data analyst CV linking 2 quantified case studies.",
      resIdx: 1,
    },
  ],
  "ui-ux-designer": [
    {
      phase: 1,
      title: "Human-centered design & UX psychology basics",
      desc: "Learn usability heuristics, hierarchy, accessibility contrast, and common UI laws.",
      hours: 8,
      difficulty: "Beginner",
      objectives: [
        "Audit 3 everyday apps for friction points",
        "Apply contrast & spacing principles",
      ],
      practicalTask: "Write a 1-page heuristic teardown of a school or local app.",
      resIdx: 1,
    },
    {
      phase: 2,
      title: "User research, flows & wireframing",
      desc: "Conduct 3–5 short user interviews, map journeys, and sketch low-fidelity wireframes.",
      hours: 12,
      difficulty: "Intermediate",
      objectives: ["Ask non-leading user questions", "Sketch task flows before styling pixels"],
      practicalTask: "Interview 3 peers and sketch wireframes for a student task flow.",
      resIdx: 0,
    },
    {
      phase: 3,
      title: "High-fidelity UI systems & Figma prototyping",
      desc: "Build reusable components, typography scales, auto-layout frames, and clickable prototypes.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Organize design tokens & components", "Link interactive prototype screens"],
      practicalTask: "Create an interactive 6-screen clickable prototype in Figma.",
      resIdx: 0,
    },
    {
      phase: 4,
      title: "Usability testing & full UX case study",
      desc: "Test your prototype with 3 users, iterate on confusion points, and document the story.",
      hours: 14,
      difficulty: "Advanced",
      objectives: ["Capture observed usability fixes cleanly", "Explain why final decisions work"],
      practicalTask: "Publish an illustrated Before → Testing → After case study.",
      resIdx: 0,
    },
    {
      phase: 5,
      title: "Design critique prep & internship applications",
      desc: "Organize a clean Behance/Notion/Contra portfolio and practise live app critiques.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: [
        "Present user problems before visual polish",
        "Tailor portfolio for product & agency teams",
      ],
      practicalTask: "Record a 3-minute Figma walkthrough and apply to 3 design internships.",
      resIdx: 1,
    },
  ],
  "cybersecurity-analyst": [
    {
      phase: 1,
      title: "Networking, Linux & OS security basics",
      desc: "Understand TCP/IP, DNS, HTTP, Linux permissions, and common command-line diagnostics.",
      hours: 10,
      difficulty: "Beginner",
      objectives: [
        "Navigate Linux file permissions comfortably",
        "Trace HTTP requests & DNS lookups",
      ],
      practicalTask: "Complete introductory Linux & networking fundamentals rooms on TryHackMe.",
      resIdx: 0,
    },
    {
      phase: 2,
      title: "Threat landscapes & OWASP Top Ten risks",
      desc: "Study authentication flaws, injection patterns, phishing defense, and secure configuration.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: [
        "Explain top 5 OWASP web vulnerabilities",
        "Identify suspicious headers or payloads",
      ],
      practicalTask: "Complete 2 guided web-security labs in a legal sandbox environment.",
      resIdx: 1,
    },
    {
      phase: 3,
      title: "Log inspection, SIEM & incident triage",
      desc: "Read system/auth logs, spot brute-force anomalies, and draft structured incident notes.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: ["Correlate timestamps across logs", "Document containment & remediation steps"],
      practicalTask:
        "Write a mock SOC triage report for a simulated phishing or brute-force alert.",
      resIdx: 0,
    },
    {
      phase: 4,
      title: "Security audit & defensive hardening project",
      desc: "Run an authorized vulnerability checklist on a sample web app and propose concrete fixes.",
      hours: 14,
      difficulty: "Advanced",
      objectives: [
        "Prioritize findings by severity & impact",
        "Provide actionable developer fixes",
      ],
      practicalTask: "Publish an ethical security review report on an open demo/lab target.",
      resIdx: 1,
    },
    {
      phase: 5,
      title: "Blue-team portfolio & entry SOC readiness",
      desc: "Consolidate lab write-ups responsibly and prepare for junior SOC / security analyst roles.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: [
        "Communicate risks clearly to non-security teams",
        "Track entry certs & cyber challenges",
      ],
      practicalTask: "Organize 3 clean lab write-ups and apply for security analyst internships.",
      resIdx: 0,
    },
  ],
  "football-coach": [
    {
      phase: 1,
      title: "Grassroots philosophy & age-group safety",
      desc: "Understand player-first coaching principles, safeguarding, warm-ups, and session structure.",
      hours: 8,
      difficulty: "Beginner",
      objectives: [
        "Design a safe 45-minute youth warm-up & ball mastery block",
        "Adapt feedback to age",
      ],
      practicalTask: "Study 2 grassroots modules on FIFA Training Centre and draft a session card.",
      resIdx: 0,
    },
    {
      phase: 2,
      title: "Tactical principles & match observation",
      desc: "Break games into 4 phases (attack, defense, transitions) and track space/decision patterns.",
      hours: 12,
      difficulty: "Intermediate",
      objectives: [
        "Spot build-up vs pressing triggers",
        "Translate observations into drill constraints",
      ],
      practicalTask: "Annotate 20 minutes of a match focusing strictly on transition moments.",
      resIdx: 0,
    },
    {
      phase: 3,
      title: "Practice design & player communication",
      desc: "Run constrained small-sided games where the game itself teaches spacing and scanning.",
      hours: 12,
      difficulty: "Intermediate",
      objectives: [
        "Keep coaching interventions crisp (<30 seconds)",
        "Give encouraging actionable cues",
      ],
      practicalTask: "Lead or co-lead one local/school practice session and log player feedback.",
      resIdx: 1,
    },
    {
      phase: 4,
      title: "4-week microcycle portfolio & video breakdown",
      desc: "Design a progressive 4-week training plan for a youth team plus a match-clip review.",
      hours: 12,
      difficulty: "Advanced",
      objectives: [
        "Balance physical load & tactical themes across weeks",
        "Document coaching reflections",
      ],
      practicalTask: "Compile your 4-week session library & annotated match brief.",
      resIdx: 0,
    },
    {
      phase: 5,
      title: "Licensing pathways (AIFF D/C) & academy volunteering",
      desc: "Prepare documentation and apply as an assistant/volunteer coach at local academies or schools.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: ["Check official AIFF / state FA D-License schedules", "Build a coaching CV"],
      practicalTask: "Contact 2 local grassroots academies offering volunteer session support.",
      resIdx: 0,
    },
  ],
  "financial-analyst": [
    {
      phase: 1,
      title: "Accounting statements & time value of money",
      desc: "Read income statements, balance sheets, and cash-flow statements with clear intuition.",
      hours: 10,
      difficulty: "Beginner",
      objectives: ["Connect profit vs operating cash flow", "Compute NPV, CAGR & margin ratios"],
      practicalTask:
        "Complete Varsity fundamental analysis modules and summarize 1 listed company.",
      resIdx: 0,
    },
    {
      phase: 2,
      title: "Financial modeling in Excel / Sheets",
      desc: "Build dynamic 3-statement projections, sensitivity tables, and clean assumption tabs.",
      hours: 14,
      difficulty: "Intermediate",
      objectives: [
        "Separate hard-coded inputs from formulas",
        "Stress-test revenue & margin assumptions",
      ],
      practicalTask: "Build a 3-year projection spreadsheet for a real public retail or tech firm.",
      resIdx: 1,
    },
    {
      phase: 3,
      title: "Valuation & industry benchmarking",
      desc: "Compare DCF intuition with peer multiples (EV/EBITDA, P/E) and competitive moats.",
      hours: 12,
      difficulty: "Intermediate",
      objectives: ["Pick relevant industry peers", "Identify valuation risks & catalysts"],
      practicalTask: "Create a 2-page equity/financial comparison memo across 3 peer companies.",
      resIdx: 0,
    },
    {
      phase: 4,
      title: "Full company initiation report",
      desc: "Combine financial model + qualitative thesis + risk matrix into a polished analyst report.",
      hours: 14,
      difficulty: "Advanced",
      objectives: ["Present bull/base/bear scenarios cleanly", "Defend key assumptions concisely"],
      practicalTask: "Write and format a 4-page analyst pitch report with charts.",
      resIdx: 0,
    },
    {
      phase: 5,
      title: "Case competitions, NISM/CFA prep & internships",
      desc: "Enter finance case competitions and prepare spreadsheet & market-awareness interviews.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: [
        "Track current macro headlines concisely",
        "Prepare corporate finance & ratio questions",
      ],
      practicalTask: "Enter 1 Unstop finance competition or apply to analyst internships.",
      resIdx: 1,
    },
  ],
  "digital-marketer": [
    {
      phase: 1,
      title: "Audience psychology, positioning & funnels",
      desc: "Understand awareness → consideration → conversion journeys and clear value propositions.",
      hours: 8,
      difficulty: "Beginner",
      objectives: [
        "Write clear landing-page headlines for a target persona",
        "Map a simple funnel",
      ],
      practicalTask: "Audit 2 brands' social & web funnels and list 3 conversion gaps.",
      resIdx: 0,
    },
    {
      phase: 2,
      title: "SEO, content strategy & copywriting",
      desc: "Research search intent, structure helpful articles/reels, and write conversion-focused copy.",
      hours: 12,
      difficulty: "Intermediate",
      objectives: ["Match keywords to user intent", "Edit copy for clarity and action"],
      practicalTask:
        "Create a 2-week organic content + SEO brief for a student club or local shop.",
      resIdx: 1,
    },
    {
      phase: 3,
      title: "Analytics, attribution & performance experiments",
      desc: "Set up GA4 events, UTM links, CTR/CAC/ROAS tracking, and structured A/B hypotheses.",
      hours: 12,
      difficulty: "Intermediate",
      objectives: ["Calculate CTR, CPC & conversion rates", "Avoid vanity-metric reporting"],
      practicalTask:
        "Complete Google Skillshop Analytics training and build a mock campaign dashboard.",
      resIdx: 0,
    },
    {
      phase: 4,
      title: "Live growth campaign case study",
      desc: "Run a real zero-budget or ₹500 micro-campaign for a college event or mock product and report outcomes.",
      hours: 14,
      difficulty: "Advanced",
      objectives: ["Measure baseline vs test performance", "Extract repeatable audience learnings"],
      practicalTask: "Deliver a structured campaign post-mortem deck with real numbers.",
      resIdx: 0,
    },
    {
      phase: 5,
      title: "Marketing portfolio & agency/startup applications",
      desc: "Package campaign case studies and apply for growth & content marketing internships.",
      hours: 6,
      difficulty: "Intermediate",
      objectives: ["Show measurable impact & creative hooks", "Prepare campaign critique answers"],
      practicalTask: "Publish your portfolio deck and apply to 3 marketing internships.",
      resIdx: 1,
    },
  ],
};

export function buildRoadmap(
  i: PlanInput & { currentSkills?: string[] | undefined },
  catalog: Career[] = CAREERS,
): Roadmap {
  const c = getCareer(i.careerId, catalog) ?? catalog[0] ?? CAREERS[0]!;
  const r = c.resources;
  const levelNorm =
    i.level === "comfortable" ? "comfortable" : i.level === "some" ? "some" : "beginner";
  const eff = (h: number) =>
    `${Math.max(1, Math.round(h))} h · ~${Math.max(1, Math.ceil(h / Math.max(1, i.hours)))} wk`;
  const scale = levelNorm === "comfortable" ? 0.65 : levelNorm === "some" ? 0.82 : 1;
  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  let cumulativeHours = 0;

  const currentSkillSet = new Set((i.currentSkills ?? []).map((s) => s.toLowerCase()));

  const makeTask = (
    phase: number,
    title: string,
    desc: string,
    baseHours: number,
    difficulty: "Beginner" | "Intermediate" | "Advanced",
    objectives: string[],
    practicalTask: string,
    res?: Resource,
    altRes?: Resource,
  ): Task => {
    const alreadyFamiliar =
      phase <= 2 && Array.from(currentSkillSet).some((sk) => title.toLowerCase().includes(sk));
    const effectiveHours = Math.max(1, Math.round(baseHours * scale * (alreadyFamiliar ? 0.7 : 1)));
    cumulativeHours += effectiveHours;
    const week = Math.max(1, Math.ceil(cumulativeHours / Math.max(1, i.hours)));
    return {
      id: `${phase}-${title}-${uid}`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .slice(0, 100),
      phase,
      week,
      title,
      desc,
      effort: eff(effectiveHours),
      objectives,
      difficulty,
      practicalTask,
      resource: res ? { name: res.name, url: res.url } : undefined,
      freeAlternative: altRes ? { name: altRes.name, url: altRes.url } : undefined,
      done: false,
    };
  };

  const mainProj = i.project || c.projects[0] || c.trial;
  const template = CAREER_ROADMAP_TEMPLATES[c.id];

  let tasks: Task[];
  if (template) {
    tasks = template.map((spec) => {
      const res = r[spec.resIdx ?? 0] ?? r[0];
      const alt = r[(spec.resIdx ?? 0) + 1] ?? r[0];
      return makeTask(
        spec.phase,
        spec.title,
        spec.desc,
        spec.hours,
        spec.difficulty,
        spec.objectives,
        spec.phase === 4 && i.project
          ? `Complete milestone for “${mainProj}” (${spec.practicalTask})`
          : spec.practicalTask,
        res,
        alt !== res ? alt : undefined,
      );
    });
  } else {
    const s0 = c.skills[0] ?? "Core concepts";
    const s1 = c.skills[1] ?? "Foundational workflows";
    const s2 = c.skills[2] ?? "Applied problem-solving";
    const s3 = c.skills[3] ?? "Professional communication";

    tasks = [
      makeTask(
        1,
        `Phase 1 Foundations: ${c.name} landscape & ${s0}`,
        `${c.day} Build baseline vocabulary in ${s0.toLowerCase()} with free introductory guides.`,
        8,
        "Beginner",
        [
          `Understand core responsibilities of a ${c.name}`,
          `Learn foundational terminology for ${s0}`,
        ],
        c.trial,
        r[0],
        r[1],
      ),
      makeTask(
        2,
        `Core Technical & Domain Skill: ${s1}`,
        `Practise ${s1.toLowerCase()} using guided exercises and structured study notes.`,
        12,
        "Beginner",
        [`Apply ${s1} on guided starter drills`, "Log common pitfalls and checklist steps"],
        `Complete 2 small practice exercises centered on ${s1}.`,
        r[1] ?? r[0],
        r[0],
      ),
      makeTask(
        2,
        `Core Technical & Domain Skill: ${s2}`,
        `Build applied fluency in ${s2.toLowerCase()} within realistic ${c.industry.toLowerCase()} scenarios.`,
        12,
        "Intermediate",
        [`Combine ${s0} and ${s2} together`, "Check output quality against industry examples"],
        `Solve one realistic mini-scenario using ${s2}.`,
        r[2] ?? r[0],
        r[0],
      ),
      makeTask(
        3,
        `Core Knowledge & Mastery: ${s3} & domain standards`,
        `Deepen into ${c.pathways[0] ?? "domain standards"} and strengthen ${s3.toLowerCase()} across deliverables.`,
        12,
        "Intermediate",
        [
          `Review standard workflows in ${c.subcategory}`,
          `Explore formal/alternative route: ${c.altRoutes[0] ?? c.pathways[0] ?? "Portfolio track"}`,
        ],
        "Write a concise 1-page review of two exemplary professionals or case studies in this field.",
        r[0],
        r[1],
      ),
      makeTask(
        4,
        `Practical Project & Portfolio: ${mainProj}`,
        `Scope, build, test, and refine a demonstrable starter project for your ${c.name} portfolio.`,
        16,
        "Advanced",
        [
          "Deliver a complete end-to-end starter artifact",
          "Request constructive feedback from a teacher, peer, or mentor",
        ],
        `Complete and document “${mainProj}” with problem, approach, and takeaways.`,
        r[0],
        r[2] ?? r[1],
      ),
      makeTask(
        5,
        `Career Preparation & Applications (${c.progression[0] ?? c.name})`,
        `Package your portfolio, tailor your CV around ${c.entryLevelOpportunities}, and explore live internships/openings.`,
        6,
        "Intermediate",
        [
          `Align CV and portfolio to ${c.entryLevelOpportunities}`,
          "Shortlist beginner-friendly opportunities and prepare interview stories",
        ],
        `Prepare a 1-page starter CV and shortlist 3 verified opportunities for ${c.name}.`,
        r[1] ?? r[0],
      ),
    ];
  }

  const totalWeeks = Math.max(2, tasks[tasks.length - 1]?.week ?? 6);
  return {
    id: `rm-${uid}`,
    careerId: c.id,
    title: `${c.name} Roadmap`,
    level: levelNorm,
    hours: i.hours,
    budget: i.budget,
    format: i.format,
    project: mainProj,
    weeks: totalWeeks,
    createdAt: Date.now(),
    tasks,
  };
}
