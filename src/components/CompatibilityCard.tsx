import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, Briefcase, ChevronDown, Globe2, IndianRupee, TrendingUp } from "lucide-react";
import { Chip, Glass, Notice, ProgressRing, selectClass } from "@/components/ui-kit";
import {
  CURRENCY_META,
  formatAbroadRange,
  formatRangeFromInr,
  getCareerInsight,
  type CurrencyCode,
} from "@/lib/career-insights";
import type { Career } from "@/lib/careers";
import { computeCompatibility, type CompatibilityBand } from "@/lib/compatibility";
import type { UserProfileRecord } from "@/lib/db";
import type { DiscoveryAnswers } from "@/lib/store";
import { cn } from "@/lib/utils";

const BAND_CLASS: Record<CompatibilityBand, string> = {
  "Strong Match": "border-turquoise/50 bg-turquoise/15 text-turquoise",
  "Good Match": "border-cyan/50 bg-cyan/15 text-cyan",
  "Moderate Match": "border-lavender/50 bg-lavender/20 text-lavender-bright",
  "Low Match": "border-warning/40 bg-warning/15 text-warning",
};

export function CompatibilityBadge({
  career,
  profile,
  fallbackAnswers,
}: {
  career: Career;
  profile?: UserProfileRecord | null | undefined;
  fallbackAnswers?: DiscoveryAnswers | undefined;
}) {
  const report = computeCompatibility(career, profile, fallbackAnswers);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums",
        BAND_CLASS[report.band],
      )}
    >
      <span>{report.score}%</span>
      <span className="opacity-80">· {report.band}</span>
    </span>
  );
}

export function CompatibilityCard({
  career,
  profile,
  fallbackAnswers,
  defaultExpanded = true,
}: {
  career: Career;
  profile?: UserProfileRecord | null | undefined;
  fallbackAnswers?: DiscoveryAnswers | undefined;
  defaultExpanded?: boolean | undefined;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const report = computeCompatibility(career, profile, fallbackAnswers);

  return (
    <Glass className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={report.score}
            size={84}
            stroke={8}
            label={
              <span className="font-display text-lg font-semibold tabular-nums">
                {report.score}%
              </span>
            }
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-cyan">
              Career Compatibility Score (Estimate)
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  BAND_CLASS[report.band],
                )}
              >
                {report.band}
              </span>
              <span className="text-xs text-muted-foreground">for {career.name}</span>
            </div>
            <p className="mt-1 text-xs text-text-2">{report.financialAlignmentNote}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 rounded-xl border border-glass-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
        >
          {expanded ? "Hide breakdown" : "Inspect 6-factor breakdown"}
          <ChevronDown className={cn("size-3.5 transition", expanded && "rotate-180")} />
        </button>
      </div>

      {report.missingProfileFields.length > 0 && (
        <Notice tone="info">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs">
              <AlertCircle className="size-4 shrink-0 text-cyan" />
              Complete your profile ({report.missingProfileFields.slice(0, 3).join(", ")}) for a
              more accurate compatibility estimate.
            </span>
            <Link to="/profile" className="text-xs font-medium text-cyan hover:underline">
              Update profile →
            </Link>
          </div>
        </Notice>
      )}

      {expanded && (
        <div className="space-y-4 border-t border-glass-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {report.breakdown.map((b) => (
              <div key={b.key} className="glass-soft space-y-1.5 p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-foreground">
                    {b.label} <span className="text-muted-foreground">({b.weightPct}% weight)</span>
                  </span>
                  <span className="font-semibold text-cyan tabular-nums">{b.score}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${b.score}%` }}
                  />
                </div>
                <p className="text-xs text-text-2">{b.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-turquoise">
                Matched strengths & skills
              </h3>
              {report.matchedStrengths.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {report.matchedStrengths.map((s) => (
                    <Chip key={s} className="px-2.5 py-0.5 text-xs capitalize">
                      {s}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No direct skill matches added yet — try starter basics in a 5-phase roadmap.
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-warning">
                Missing skills & qualifications to build
              </h3>
              <ul className="space-y-1 text-xs text-text-2">
                {report.missingSkills.slice(0, 4).map((s) => (
                  <li key={s}>• Skill gap: {s}</li>
                ))}
                {report.missingQualifications.map((q) => (
                  <li key={q}>• {q}</li>
                ))}
                {report.improvementAreas.slice(0, 2).map((imp) => (
                  <li key={imp} className="text-muted-foreground">
                    → {imp}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">{report.disclaimer}</p>
        </div>
      )}
    </Glass>
  );
}

export function FinancialOutlookPanel({
  career,
  profile,
}: {
  career: Career;
  profile?: UserProfileRecord | null | undefined;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const insight = getCareerInsight(career);

  return (
    <Glass className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-cyan">
            Financial Expectations & Market Outlook
          </p>
          <h2 className="font-display text-xl font-semibold">
            Salary benchmarks, entry curve & demand ({career.name})
          </h2>
        </div>
        <label className="flex items-center gap-2 text-xs text-text-2">
          Currency:
          <select
            aria-label="Select display currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className={selectClass("h-9 w-28 px-2 text-xs")}
          >
            {(Object.keys(CURRENCY_META) as CurrencyCode[]).map((code) => (
              <option key={code} value={code}>
                {CURRENCY_META[code].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-soft p-3.5">
          <p className="flex items-center gap-1.5 text-xs text-cyan">
            <IndianRupee className="size-3.5" /> Entry level (0–2 yrs)
          </p>
          <p className="mt-1 font-display text-lg font-semibold tabular-nums">
            {formatRangeFromInr(insight.indiaEntryInr, currency)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            Abroad: {formatAbroadRange(insight.abroadEntryUsd, currency)}
          </p>
        </div>
        <div className="glass-soft p-3.5">
          <p className="flex items-center gap-1.5 text-xs text-lavender-bright">
            <TrendingUp className="size-3.5" /> Mid-career (3–7 yrs)
          </p>
          <p className="mt-1 font-display text-lg font-semibold tabular-nums">
            {formatRangeFromInr(insight.indiaMidInr, currency)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            Abroad: {formatAbroadRange(insight.abroadMidUsd, currency)}
          </p>
        </div>
        <div className="glass-soft p-3.5">
          <p className="flex items-center gap-1.5 text-xs text-turquoise">
            <Globe2 className="size-3.5" /> Experienced (8+ yrs)
          </p>
          <p className="mt-1 font-display text-lg font-semibold tabular-nums">
            {formatRangeFromInr(insight.indiaExperiencedInr, currency)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            Abroad: {formatAbroadRange(insight.abroadExperiencedUsd, currency)}
          </p>
        </div>
      </div>

      {profile?.expectedStartingSalaryInr ? (
        <Notice tone="info">
          <p className="text-xs">
            <span className="font-semibold">Personal alignment check:</span> Your target starting
            pay (₹{(profile.expectedStartingSalaryInr / 100_000).toFixed(1)} LPA
            {profile.preferredWorkLocation ? ` · ${profile.preferredWorkLocation}` : ""}) vs{" "}
            {career.name} entry range{" "}
            <span className="font-medium text-cyan">
              {formatRangeFromInr(insight.indiaEntryInr, "INR")}
            </span>
            . Education budget set:{" "}
            <span className="font-medium">
              ₹{(profile.educationBudgetInr ?? profile.budget).toLocaleString("en-IN")}
            </span>
            .
          </p>
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-soft p-3.5">
          <p className="text-xs font-medium text-cyan">Difficulty of entry</p>
          <p className="mt-1 font-medium text-foreground">{insight.difficultyOfEntry}</p>
          <p className="mt-1 text-xs text-text-2">{insight.difficultyExplanation}</p>
        </div>
        <div className="glass-soft p-3.5">
          <p className="text-xs font-medium text-cyan">Future industry demand</p>
          <p className="mt-1 font-medium text-foreground">
            {insight.futureDemand.trend} ({insight.futureDemand.timeframe})
          </p>
          <p className="mt-1 text-xs text-text-2">{insight.futureDemand.outlookNote}</p>
        </div>
        <div className="glass-soft p-3.5">
          <p className="text-xs font-medium text-cyan">Education investment</p>
          <p className="mt-1 font-medium text-foreground tabular-nums">
            {formatRangeFromInr(insight.educationCostInr, currency, false)}
          </p>
          <p className="mt-1 text-xs text-text-2">{insight.employabilityNote}</p>
        </div>
        <div className="glass-soft p-3.5">
          <p className="flex items-center gap-1 text-xs font-medium text-cyan">
            <Briefcase className="size-3.5" /> Sectors & remote work
          </p>
          <p className="mt-1 font-medium text-foreground">
            {insight.jobOpportunities.remotePossibility}
          </p>
          <p className="mt-1 text-xs text-text-2">
            {insight.jobOpportunities.sectors.slice(0, 3).join(" · ")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-xs text-text-2 sm:grid-cols-2">
        <div className="rounded-xl border border-glass-border bg-secondary/40 p-3">
          <span className="font-medium text-foreground">Fixed & Variable Pay:</span>{" "}
          {insight.compensationStructure.baseNote} {insight.compensationStructure.variableNote}
        </div>
        <div className="rounded-xl border border-glass-border bg-secondary/40 p-3">
          <span className="font-medium text-foreground">Freelance & Self-Employment:</span>{" "}
          {insight.compensationStructure.freelanceNote}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Source attribution: {insight.salarySource} ({insight.salaryPeriod}). Figures are indicative
        industry estimates and do not guarantee salaries, job offers, or promotions.
      </p>
    </Glass>
  );
}
