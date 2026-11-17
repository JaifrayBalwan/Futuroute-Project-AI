import {
  BUDGET_CATALOG,
  scoreCatalogItemForCareer,
  type BudgetCatalogItem,
} from "./budget-catalog";
import { getCareerInsight, splitSkills } from "./career-insights";
import { CAREERS, getCareer, type Career } from "./careers";
import type { Roadmap, Task } from "./store";

export type AcademicStreamOption =
  | "student-beginner"
  | "stream-pcm"
  | "stream-pcb"
  | "stream-commerce"
  | "stream-humanities"
  | "stream-diploma";

export const BACKGROUND_STREAM_PRESETS: Record<
  AcademicStreamOption,
  { label: string; skills: string[]; capabilities: string[] }
> = {
  "student-beginner": {
    label: "I am a student / beginner (starting fresh)",
    skills: ["Digital literacy", "Communication", "Basic research", "Time management"],
    capabilities: ["curiosity", "teamwork", "communication"],
  },
  "stream-pcm": {
    label: "Science (PCM — Maths, Physics, CS background)",
    skills: ["Mathematics", "Logical reasoning", "Problem-solving", "Basic programming"],
    capabilities: ["analytical", "problem_solving", "mathematics"],
  },
  "stream-pcb": {
    label: "Science (PCB — Biology, Chemistry background)",
    skills: ["Scientific observation", "Laboratory basics", "Report writing", "Data logging"],
    capabilities: ["observation", "research", "critical_thinking"],
  },
  "stream-commerce": {
    label: "Commerce (Accounting, Economics, Business)",
    skills: ["Spreadsheets", "Financial literacy", "Economics basics", "Business communication"],
    capabilities: ["analytical", "organisation", "communication"],
  },
  "stream-humanities": {
    label: "Humanities / Arts (Writing, History, Psychology)",
    skills: ["Essay writing", "Critical reading", "Qualitative research", "Storytelling"],
    capabilities: ["writing", "communication", "critical_thinking", "creativity"],
  },
  "stream-diploma": {
    label: "Polytechnic / Vocational Diploma holder",
    skills: ["Hands-on troubleshooting", "Technical documentation", "Workflow execution"],
    capabilities: ["technical", "problem_solving", "organisation"],
  },
};

export type TransitionInput = {
  currentBackground: string; // either a Career ID or an AcademicStreamOption
  currentSkills: string[];
  previousQualifications: string;
  targetCareerId: string;
  weeklyHours: number;
  budgetInr: number;
  preferredTimelineMonths: number;
};

export type TransitionSimulation = {
  currentLabel: string;
  targetCareer: Career;
  compatibilityScore: number; // 0-100 rule-based estimate
  transitionDifficulty: "Smooth" | "Moderate" | "Major Pivot";
  existingRelevantSkills: string[];
  transferableSkills: string[];
  missingTechnicalSkills: string[];
  missingSoftSkills: string[];
  missingQualifications: string[];
  certificationsRequired: string[];
  estimatedTotalHours: number;
  estimatedWeeks: number;
  withinPreferredTimeline: boolean;
  recommendedSequence: string[];
  estimatedExpensesInr: {
    totalRecommended: number;
    withinBudget: boolean;
    items: BudgetCatalogItem[];
    freeTrackNote: string;
  };
  recommendedProjects: string[];
  entryLevelJobRoles: string[];
  disclaimer: string;
};

function tokenizeList(items: string[]): Set<string> {
  const out = new Set<string>();
  for (const item of items) {
    const low = item.trim().toLowerCase();
    if (!low) continue;
    out.add(low);
    for (const part of low.split(/[\s/,&-]+/)) {
      if (part.length >= 3) out.add(part);
    }
  }
  return out;
}

export function simulateCareerTransition(
  input: TransitionInput,
  catalog: Career[] = CAREERS,
): TransitionSimulation {
  const target = getCareer(input.targetCareerId, catalog) ?? catalog[0] ?? CAREERS[0]!;
  const isPreset = input.currentBackground in BACKGROUND_STREAM_PRESETS;
  const preset = isPreset
    ? BACKGROUND_STREAM_PRESETS[input.currentBackground as AcademicStreamOption]
    : undefined;
  const sourceCareer = !isPreset ? getCareer(input.currentBackground, catalog) : undefined;

  const currentLabel = preset
    ? preset.label
    : sourceCareer
      ? sourceCareer.name
      : "General background";

  const combinedSourceSkills = Array.from(
    new Set([
      ...(preset?.skills ?? []),
      ...(sourceCareer?.skills ?? []),
      ...input.currentSkills.map((s) => s.trim()).filter(Boolean),
    ]),
  );
  const sourceCapabilities = Array.from(
    new Set([...(preset?.capabilities ?? []), ...(sourceCareer?.capabilities ?? [])]),
  );

  const sourceTokens = tokenizeList([...combinedSourceSkills, ...sourceCapabilities]);
  const { technical: targetTech, soft: targetSoft } = splitSkills(target);

  const existingRelevantSkills: string[] = [];
  const missingTechnicalSkills: string[] = [];
  for (const skill of targetTech) {
    const words = skill
      .toLowerCase()
      .split(/[\s/,&-]+/)
      .filter((w) => w.length >= 3);
    const hit = sourceTokens.has(skill.toLowerCase()) || words.some((w) => sourceTokens.has(w));
    if (hit) existingRelevantSkills.push(skill);
    else missingTechnicalSkills.push(skill);
  }

  const transferableSkills: string[] = [];
  const missingSoftSkills: string[] = [];
  for (const sSkill of targetSoft) {
    const words = sSkill
      .toLowerCase()
      .split(/[\s/,&-]+/)
      .filter((w) => w.length >= 3);
    const hit = sourceTokens.has(sSkill.toLowerCase()) || words.some((w) => sourceTokens.has(w));
    if (hit) transferableSkills.push(sSkill);
    else missingSoftSkills.push(sSkill);
  }

  // Also credit shared capabilities from source career or preset
  for (const cap of target.capabilities) {
    const readable = cap.replace(/_/g, " ");
    const capPretty = readable.charAt(0).toUpperCase() + readable.slice(1);
    if (sourceCapabilities.includes(cap) && !transferableSkills.includes(capPretty)) {
      transferableSkills.push(capPretty);
    }
  }

  const sameIndustry = sourceCareer?.industry === target.industry;
  const overlapRatio =
    (existingRelevantSkills.length + transferableSkills.length * 0.6) /
    Math.max(1, targetTech.length + targetSoft.length * 0.6);

  const qualLow = input.previousQualifications.toLowerCase();
  const minEduLow = target.minEducation.toLowerCase();
  const hasDegree =
    qualLow.includes("bachelor") ||
    qualLow.includes("b.tech") ||
    qualLow.includes("degree") ||
    qualLow.includes("master") ||
    qualLow.includes("undergraduate") ||
    qualLow.includes("postgraduate");

  const missingQualifications: string[] = [];
  if (
    minEduLow.includes("master") &&
    !qualLow.includes("master") &&
    !qualLow.includes("postgrad")
  ) {
    missingQualifications.push(
      `Target usually asks for ${target.minEducation} — check whether a specialist postgraduate degree or equivalent track is needed.`,
    );
  } else if (
    (minEduLow.includes("bachelor") ||
      minEduLow.includes("degree") ||
      minEduLow.includes("ll.b")) &&
    !hasDegree
  ) {
    missingQualifications.push(
      `Recommended academic qualification: ${target.minEducation}. Alternative skill-portfolio routes: ${target.altRoutes[0] ?? "Verified portfolio + internships"}.`,
    );
  }

  const rawScore =
    32 +
    overlapRatio * 42 +
    (sameIndustry ? 14 : 0) +
    (missingQualifications.length === 0 ? 10 : 0) +
    Math.min(8, input.weeklyHours * 0.5);
  const compatibilityScore = Math.max(15, Math.min(96, Math.round(rawScore)));

  const transitionDifficulty: TransitionSimulation["transitionDifficulty"] =
    compatibilityScore >= 72 ? "Smooth" : compatibilityScore >= 48 ? "Moderate" : "Major Pivot";

  const weeklyHours = Math.max(1, Math.min(50, Math.round(input.weeklyHours || 6)));
  const skillHoursNeeded =
    missingTechnicalSkills.length * 16 + missingSoftSkills.length * 6 + target.commitmentLevel * 12;
  const discountFactor = sameIndustry ? 0.75 : existingRelevantSkills.length >= 2 ? 0.85 : 1;
  const estimatedTotalHours = Math.max(30, Math.round(skillHoursNeeded * discountFactor));
  const estimatedWeeks = Math.max(4, Math.ceil(estimatedTotalHours / weeklyHours));
  const targetWeeksBudget = Math.max(4, Math.round(input.preferredTimelineMonths * 4.3));
  const withinPreferredTimeline = estimatedWeeks <= targetWeeksBudget;

  // Budget-aware transition expenses from verified BUDGET_CATALOG
  const budgetCap = Math.max(0, Math.round(input.budgetInr || 0));
  const rankedCatalog = [...BUDGET_CATALOG]
    .map((item) => ({
      item,
      score: scoreCatalogItemForCareer(
        item,
        target,
        existingRelevantSkills.length >= 2 ? "some" : "beginner",
      ),
    }))
    .sort((a, b) => b.score - a.score || a.item.estimatedCostInr - b.item.estimatedCostInr)
    .map((x) => x.item);

  const chosenItems: BudgetCatalogItem[] = [];
  let spend = 0;
  for (const item of rankedCatalog) {
    if (chosenItems.length >= 3) break;
    if (spend + item.estimatedCostInr <= budgetCap) {
      chosenItems.push(item);
      spend += item.estimatedCostInr;
    }
  }

  const insight = getCareerInsight(target);
  const certificationsRequired = [...target.pathways.slice(0, 2), ...target.altRoutes.slice(0, 1)];

  const recommendedSequence = [
    `1. Bridge transfer: anchor on your ${transferableSkills.slice(0, 2).join(" & ") || "core problem-solving"} while scoping ${target.name} expectations.`,
    missingTechnicalSkills.length > 0
      ? `2. Core gap closure: prioritize ${missingTechnicalSkills.slice(0, 3).join(", ")} using verified open courses (${target.resources[0]?.name ?? "free online modules"}).`
      : `2. Deepen domain fluency across ${target.skills.slice(0, 3).join(", ")}.`,
    `3. Hands-on proof: complete 1–2 portfolio artifacts (${target.projects.slice(0, 2).join("; ")}).`,
    `4. Market readiness: prepare resume & applications targeting ${insight.jobOpportunities.typicalTitles[0] ?? target.progression[0] ?? `Junior ${target.name}`}.`,
  ];

  return {
    currentLabel,
    targetCareer: target,
    compatibilityScore,
    transitionDifficulty,
    existingRelevantSkills,
    transferableSkills,
    missingTechnicalSkills,
    missingSoftSkills,
    missingQualifications,
    certificationsRequired,
    estimatedTotalHours,
    estimatedWeeks,
    withinPreferredTimeline,
    recommendedSequence,
    estimatedExpensesInr: {
      totalRecommended: spend,
      withinBudget: spend <= budgetCap,
      items: chosenItems,
      freeTrackNote:
        budgetCap === 0
          ? `₹0 free-first transition plan using ${target.resources.map((r) => r.name).join(", ")}.`
          : `Estimated optional spend of ₹${spend.toLocaleString("en-IN")} within your ₹${budgetCap.toLocaleString("en-IN")} budget.`,
    },
    recommendedProjects: target.projects,
    entryLevelJobRoles: Array.from(
      new Set([
        target.progression[0] ?? `Trainee ${target.name}`,
        ...insight.jobOpportunities.typicalTitles.slice(0, 2),
      ]),
    ),
    disclaimer:
      "Transition compatibility & duration are rule-based planning estimates; real timelines vary with project depth, mentoring, and hiring cycles.",
  };
}

export function buildTransitionRoadmap(
  sim: TransitionSimulation,
  weeklyHours: number,
  budgetInr: number,
): Roadmap {
  const c = sim.targetCareer;
  const hrs = Math.max(1, weeklyHours || 6);
  const uid = `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  let cumHours = 0;

  const mkTask = (
    phase: number,
    title: string,
    desc: string,
    hours: number,
    difficulty: Task["difficulty"],
    objectives: string[],
    practicalTask: string,
    resIdx = 0,
  ): Task => {
    cumHours += hours;
    const week = Math.max(1, Math.ceil(cumHours / hrs));
    const mainRes = c.resources[resIdx] ?? c.resources[0];
    const altRes = c.resources[resIdx + 1] ?? c.resources[0];
    return {
      id: `${phase}-${title}-${uid}`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .slice(0, 96),
      phase,
      week,
      title,
      desc,
      effort: `${hours} h · ~${Math.max(1, Math.ceil(hours / hrs))} wk`,
      objectives,
      difficulty,
      practicalTask,
      resource: mainRes ? { name: mainRes.name, url: mainRes.url } : undefined,
      freeAlternative: altRes ? { name: altRes.name, url: altRes.url } : undefined,
      done: false,
    };
  };

  const gap0 = sim.missingTechnicalSkills[0] ?? c.skills[0] ?? "Domain fundamentals";
  const gap1 = sim.missingTechnicalSkills[1] ?? c.skills[1] ?? "Core workflows";
  const gap2 = sim.missingTechnicalSkills[2] ?? c.skills[2] ?? "Applied execution";

  const tasks: Task[] = [
    mkTask(
      1,
      `Map transferable strengths from ${sim.currentLabel}`,
      `Audit how your existing skills (${sim.transferableSkills.slice(0, 3).join(", ") || "problem-solving"}) transfer into ${c.name}.`,
      4,
      "Beginner",
      [
        "Identify 3 overlapping workflows between your current path and target role",
        "Try the 15-minute practical career starter trial",
      ],
      c.trial,
      0,
    ),
    mkTask(
      2,
      `Bridge priority gap: ${gap0}`,
      `Close your first missing technical area (${gap0}) with structured open curriculum.`,
      12,
      "Beginner",
      [`Grasp core terminology and tools in ${gap0}`, "Complete 2 guided starter exercises"],
      `Publish a short walkthrough or mini-exercise demonstrating ${gap0}.`,
      0,
    ),
    mkTask(
      2,
      `Bridge priority gap: ${gap1}`,
      `Build hands-on confidence in ${gap1} using free documentation and interactive drills.`,
      14,
      "Intermediate",
      [`Apply ${gap1} to realistic sample data or briefs`, "Document common mistakes and fixes"],
      `Solve one real-world scenario problem using ${gap1}.`,
      1,
    ),
    mkTask(
      3,
      `Master ${gap2} & workflow standards`,
      `Combine ${gap0}, ${gap1}, and ${gap2} in an end-to-end intermediate workflow.`,
      14,
      "Intermediate",
      [
        `Connect ${gap2} into quality-checked deliverables`,
        "Follow standard conventions in " + c.industry,
      ],
      "Review two public case studies or open portfolios in this role.",
      2,
    ),
    mkTask(
      4,
      `Build transition portfolio project: ${sim.recommendedProjects[0] ?? c.projects[0] ?? c.trial}`,
      "Demonstrate job readiness to recruiters even without prior titles in this field.",
      18,
      "Advanced",
      [
        "Scope problem statement, execution steps, and measurable outcome",
        "Request review feedback from a peer or mentor",
      ],
      `Ship a polished case study for “${sim.recommendedProjects[0] ?? c.projects[0] ?? c.trial}”.`,
      0,
    ),
    mkTask(
      5,
      `Transition positioning & ${sim.entryLevelJobRoles[0] ?? c.name} applications`,
      `Tailor your CV/LinkedIn to highlight transferable skills and target ${sim.entryLevelJobRoles.join(", ")}.`,
      8,
      "Intermediate",
      [
        "Reframe prior experience around outcomes relevant to " + c.industry,
        "Apply to 3–5 beginner/intern or transition-friendly roles via Opportunity Finder",
      ],
      "Draft an outreach & portfolio summary linking your transition project.",
      0,
    ),
  ];

  return {
    id: `rm-${uid}`,
    careerId: c.id,
    title: `${c.name} Transition Roadmap`,
    level: sim.existingRelevantSkills.length >= 2 ? "some" : "beginner",
    hours: hrs,
    budget: Math.max(0, Math.round(budgetInr)),
    format: "mixed",
    project: sim.recommendedProjects[0] ?? c.projects[0] ?? c.trial,
    weeks: Math.max(4, tasks[tasks.length - 1]?.week ?? sim.estimatedWeeks),
    createdAt: Date.now(),
    tasks,
  };
}
