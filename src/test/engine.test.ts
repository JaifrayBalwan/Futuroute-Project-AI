import { describe, expect, it } from "vitest";
import {
  formatRangeFromInr,
  getCareerInsight,
  splitSkills,
  type CurrencyCode,
} from "@/lib/career-insights";
import { CAREERS, INDUSTRIES, getCareer } from "@/lib/careers";
import {
  COMPATIBILITY_WEIGHTS,
  computeCompatibility,
  getCompatibilityBand,
} from "@/lib/compatibility";
import {
  buildPlan,
  buildRoadmap,
  recommend,
  recommendGrouped,
  recomputePlanWithItems,
} from "@/lib/engine";
import {
  OPPORTUNITIES_CATALOG,
  OPPORTUNITY_CATEGORIES,
  recommendOpportunities,
} from "@/lib/opportunities";
import { buildTransitionRoadmap, simulateCareerTransition } from "@/lib/simulator";

describe("Futuroute career database & recommendation engine", () => {
  it("contains 250+ distinct careers spanning all 20 required industries", () => {
    expect(CAREERS.length).toBeGreaterThanOrEqual(250);
    const uniqueIds = new Set(CAREERS.map((c) => c.id));
    expect(uniqueIds.size).toBe(CAREERS.length);

    const presentIndustries = new Set(CAREERS.map((c) => c.industry));
    for (const ind of INDUSTRIES) {
      expect(presentIndustries.has(ind)).toBe(true);
    }
    expect(presentIndustries.size).toBe(20);
  });

  it("prioritises UI/UX for design + psychology answers", () => {
    const r = recommend({ subjects: ["Art & Design", "Psychology"], work: ["Designing visuals"] });
    expect(r[0]!.career.id).toBe("ui-ux-designer");
  });

  it("prioritises cybersecurity for investigation + safety answers", () => {
    const r = recommend({ interests: ["Investigating mysteries"], work: ["Protecting systems"] });
    expect(r[0]!.career.id).toBe("cybersecurity-analyst");
  });

  it("returns 3 careers for empty discovery inputs", () => {
    expect(recommend({}).length).toBe(3);
  });

  it("returns 4 structured recommendation groups with all 6 explanation fields and diverse football matches", () => {
    const grouped = recommendGrouped({
      interests: ["football", "mathematics"],
      capabilities: ["leadership", "analytical"],
      budget: 0,
      hours: 5,
    });

    expect(grouped.strongMatches.length).toBeGreaterThanOrEqual(3);
    expect(grouped.alternativePaths.length).toBe(3);
    expect(grouped.unexpectedDiscoveries.length).toBe(3);
    expect(grouped.emergingOpportunities.length).toBe(3);

    const allTopIndustries = grouped.strongMatches.map((m) => m.career.industry);
    expect(allTopIndustries).toContain("Sports");
    expect(grouped.strongMatches[0]!.career.id).not.toBe("actuary");

    for (const item of grouped.strongMatches) {
      expect(item.whyItMatches.length).toBeGreaterThan(5);
      expect(item.relevantSkills.length).toBeGreaterThan(0);
      expect(item.skillsToDevelop.length).toBeGreaterThan(0);
      expect(item.requiredQualifications.length).toBeGreaterThan(0);
      expect(item.howToStart.length).toBeGreaterThan(5);
      expect(item.practicalTrial.length).toBeGreaterThan(5);
    }
  });

  it("distinguishes capabilities: Gaming + Math + Creativity vs Gaming + Leadership + Communication", () => {
    const builder = recommendGrouped({
      interests: ["gaming"],
      capabilities: ["mathematics", "creativity"],
    });
    const communicator = recommendGrouped({
      interests: ["gaming"],
      capabilities: ["leadership", "communication"],
    });

    const builderIds = builder.strongMatches.map((x) => x.career.id);
    const commIds = communicator.strongMatches.map((x) => x.career.id);
    expect(builderIds).not.toEqual(commIds);
  });

  it("handles ₹0 free-only plan without spending while preserving verified URLs", () => {
    const p = buildPlan({
      careerId: "data-analyst",
      level: "beginner",
      budget: 0,
      hours: 5,
      device: "laptop",
      format: "mixed",
      outcome: "fundamentals",
    });
    expect(p.withinBudget).toBe(true);
    expect(p.budgetTotal).toBe(0);
    expect(p.recommendedSpend).toBe(0);
    expect(p.remainingBalance).toBe(0);
    expect(p.allocatedItems).toHaveLength(0);
    expect(p.free.every((r) => r.url.startsWith("https://"))).toBe(true);
    expect(p.certifications.length).toBeGreaterThan(0);
    expect(p.projects.length).toBeGreaterThan(0);
  });

  it("generates genuine INR spending plans across ₹500, ₹1000, ₹2000, ₹3500, ₹5000 without exceeding budget", () => {
    for (const budget of [500, 1000, 2000, 3500, 5000]) {
      const p = buildPlan({
        careerId: "software-developer",
        level: "beginner",
        budget,
        hours: 6,
        device: "laptop",
        format: "mixed",
        outcome: "project",
      });
      expect(p.withinBudget).toBe(true);
      expect(p.budgetTotal).toBe(budget);
      expect(p.recommendedSpend).toBeGreaterThan(0);
      expect(p.recommendedSpend).toBeLessThanOrEqual(budget);
      expect(p.recommendedSpend + p.remainingBalance).toBe(budget);
      expect(p.allocatedItems.length).toBeGreaterThan(0);
      for (const item of p.allocatedItems) {
        expect(item.priceType).toBe("estimated");
        expect(item.providerUrl.startsWith("https://")).toBe(true);
      }
    }
  });

  it("recalculates remaining balance cleanly when items are removed via recomputePlanWithItems", () => {
    const p = buildPlan({
      careerId: "football-coach",
      level: "beginner",
      budget: 2000,
      hours: 6,
      device: "laptop",
      format: "mixed",
      outcome: "fundamentals",
    });
    expect(p.allocatedItems.length).toBeGreaterThan(0);
    const updated = recomputePlanWithItems(p, p.allocatedItems.slice(1));
    expect(updated.recommendedSpend).toBeLessThan(p.recommendedSpend);
    expect(updated.recommendedSpend + updated.remainingBalance).toBe(2000);
    expect(updated.withinBudget).toBe(true);
  });

  it("5-phase roadmap covers phases 1..5 with structured objectives, difficulty, practical tasks, and week scaling", () => {
    const slow = buildRoadmap({
      careerId: "web-developer",
      level: "beginner",
      budget: 0,
      hours: 4,
      device: "laptop",
      format: "mixed",
      outcome: "project",
    });
    const fast = buildRoadmap({
      careerId: "web-developer",
      level: "beginner",
      budget: 0,
      hours: 12,
      device: "laptop",
      format: "mixed",
      outcome: "project",
    });
    expect(new Set(slow.tasks.map((t) => t.phase))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(slow.tasks.every((t) => typeof t.week === "number" && t.week >= 1)).toBe(true);
    expect(
      slow.tasks.every((t) => (t.objectives?.length ?? 0) >= 1 && Boolean(t.practicalTask)),
    ).toBe(true);
    expect(slow.tasks.some((t) => t.done)).toBe(false);
    expect(fast.weeks!).toBeLessThan(slow.weeks!);
  });
});

describe("Compatibility scoring & financial insights", () => {
  it("keeps compatibility category weights summing to 100% and computes valid score bands", () => {
    const sum = Object.values(COMPATIBILITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);

    const dataAnalyst = getCareer("data-analyst")!;
    const emptyReport = computeCompatibility(dataAnalyst, null);
    expect(emptyReport.missingProfileFields.length).toBeGreaterThan(0);
    expect(emptyReport.score).toBeGreaterThanOrEqual(1);
    expect(emptyReport.score).toBeLessThanOrEqual(99);
    expect(emptyReport.band).toBe(getCompatibilityBand(emptyReport.score));

    const matchedReport = computeCompatibility(dataAnalyst, {
      uid: "test-user",
      displayName: "Aarav",
      educationLevel: "Undergraduate",
      interests: ["Mathematics & Logic", "Solving technical puzzles"],
      subjects: ["Mathematics", "Statistics", "Computer Science"],
      capabilities: ["analytical", "problem_solving"],
      currentSkills: ["SQL", "Excel", "Python"],
      weaknesses: [],
      environment: "Quiet focus / remote",
      budget: 2000,
      weeklyHours: 10,
      learningPreferences: ["Practical hands-on projects"],
      expectedStartingSalaryInr: 500_000,
      preferredWorkLocation: "India",
      onboarded: true,
    });
    expect(matchedReport.score).toBeGreaterThan(emptyReport.score);
    expect(matchedReport.missingProfileFields).toHaveLength(0);
    expect(matchedReport.breakdown).toHaveLength(6);
  });

  it("formats financial ranges across INR/USD/GBP/EUR and separates technical vs soft skills", () => {
    const softwareDev = getCareer("software-developer")!;
    const insight = getCareerInsight(softwareDev);
    expect(insight.indiaEntryInr[1]).toBeGreaterThan(insight.indiaEntryInr[0]);
    expect(insight.indiaExperiencedInr[0]).toBeGreaterThan(insight.indiaEntryInr[0]);
    expect(insight.salarySource.length).toBeGreaterThan(5);

    for (const cur of ["INR", "USD", "GBP", "EUR"] as CurrencyCode[]) {
      const formatted = formatRangeFromInr(insight.indiaEntryInr, cur, true);
      expect(formatted.length).toBeGreaterThan(3);
    }

    const split = splitSkills(softwareDev);
    expect(split.technical.length).toBeGreaterThan(0);
    expect(split.soft.length).toBeGreaterThan(0);
  });
});

describe("Career Change Simulator & Opportunity Finder", () => {
  it("simulates student-beginner and career transitions with gap detection and generates a 5-phase roadmap", () => {
    const studentSim = simulateCareerTransition(
      {
        currentBackground: "student-beginner",
        currentSkills: ["Communication"],
        previousQualifications: "Class 12 / Senior Secondary",
        targetCareerId: "data-analyst",
        weeklyHours: 8,
        budgetInr: 1000,
        preferredTimelineMonths: 6,
      },
      CAREERS,
    );
    expect(studentSim.missingTechnicalSkills.length).toBeGreaterThan(0);
    expect(studentSim.estimatedExpensesInr.withinBudget).toBe(true);
    expect(studentSim.recommendedSequence).toHaveLength(4);

    const devToAi = simulateCareerTransition(
      {
        currentBackground: "software-developer",
        currentSkills: ["Python", "Statistics", "Problem-solving"],
        previousQualifications: "Undergraduate degree (Bachelor's)",
        targetCareerId: "ai-ml-engineer",
        weeklyHours: 10,
        budgetInr: 0,
        preferredTimelineMonths: 9,
      },
      CAREERS,
    );
    expect(devToAi.compatibilityScore).toBeGreaterThan(45);
    expect(devToAi.estimatedExpensesInr.totalRecommended).toBe(0);

    const rm = buildTransitionRoadmap(devToAi, 10, 0);
    expect(new Set(rm.tasks.map((t) => t.phase))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(rm.careerId).toBe("ai-ml-engineer");
  });

  it("covers all 10 Opportunity categories with HTTPS portals and ranks field-aligned opportunities first", () => {
    const presentCategories = new Set(OPPORTUNITIES_CATALOG.map((o) => o.category));
    for (const cat of OPPORTUNITY_CATEGORIES) {
      expect(presentCategories.has(cat)).toBe(true);
    }
    expect(OPPORTUNITIES_CATALOG.every((o) => o.url.startsWith("https://"))).toBe(true);

    const sportsCareer = getCareer("football-coach")!;
    const ranked = recommendOpportunities(
      OPPORTUNITIES_CATALOG,
      null,
      [sportsCareer],
      undefined,
      CAREERS,
    );
    expect(ranked[0]!.fields).toContain("Sports");
  });
});
