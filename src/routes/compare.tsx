import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookmarkPlus,
  ChevronDown,
  FlaskConical,
  Plus,
  Scale,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SaveButton } from "@/components/CareerParts";
import { CompatibilityBadge } from "@/components/CompatibilityCard";
import {
  Bar,
  Button,
  Chip,
  Glass,
  Notice,
  PageHeader,
  btnClass,
  inputClass,
  selectClass,
} from "@/components/ui-kit";
import { useUser } from "@/lib/auth";
import {
  CURRENCY_META,
  formatAbroadRange,
  formatRangeFromInr,
  getCareerInsight,
  splitSkills,
  type CurrencyCode,
} from "@/lib/career-insights";
import { HUE_CLASS, INDUSTRIES, getCareer, type Career } from "@/lib/careers";
import { useCareersCatalog } from "@/lib/careers-service";
import { computeCompatibility } from "@/lib/compatibility";
import type { UserProfileRecord } from "@/lib/db";
import { actions, useApp, type DiscoveryAnswers } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare My Futures — Futuroute" },
      {
        name: "description",
        content:
          "Compare two or three careers across 17 dimensions: compatibility scores, India & global salaries, skills, qualifications, entry difficulty, demand, costs, and trade-offs.",
      },
      { property: "og:title", content: "Compare My Futures — Futuroute" },
      {
        property: "og:description",
        content: "17-dimension side-by-side career comparison tailored to your profile.",
      },
    ],
  }),
  component: Compare,
});

const PRESETS = [
  ["software-developer", "ui-ux-designer"],
  ["football-coach", "software-developer"],
  ["data-analyst", "financial-analyst"],
  ["ai-ml-engineer", "cybersecurity-analyst"],
];

type CompareRowContext = {
  currency: CurrencyCode;
  profile?: UserProfileRecord | null | undefined;
  answers?: DiscoveryAnswers | undefined;
};

const ROWS: {
  key: string;
  label: string;
  render: (c: Career, ctx: CompareRowContext) => ReactNode;
}[] = [
  {
    key: "overview",
    label: "1 · Career overview & daily work",
    render: (c) => (
      <div className="space-y-1.5">
        <p className="font-medium text-foreground">{c.short}</p>
        <p>{c.day}</p>
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {c.responsibilities.slice(0, 3).map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    key: "qualifications",
    label: "2 · Required qualifications & alternative routes",
    render: (c) => (
      <div className="space-y-2">
        <p className="text-xs font-medium text-cyan">Baseline: {c.minEducation}</p>
        <ul className="space-y-1">
          {c.pathways.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
        <p className="text-xs font-medium text-muted-foreground">Alternative routes:</p>
        <ul className="space-y-1 text-xs">
          {c.altRoutes.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    key: "technical_skills",
    label: "3 · Technical & domain skills",
    render: (c) => {
      const { technical } = splitSkills(c);
      return (
        <div className="flex flex-wrap gap-1.5">
          {technical.map((s) => (
            <Chip key={s} className="px-2 py-0.5 text-xs">
              {s}
            </Chip>
          ))}
        </div>
      );
    },
  },
  {
    key: "soft_skills",
    label: "4 · Soft skills & human capabilities",
    render: (c) => {
      const { soft } = splitSkills(c);
      return (
        <div className="flex flex-wrap gap-1.5">
          {soft.map((s) => (
            <Chip key={s} className="px-2 py-0.5 text-xs">
              {s}
            </Chip>
          ))}
        </div>
      );
    },
  },
  {
    key: "salary_india_entry",
    label: "5 · Entry-level salary (India indicative, 0–2 yrs)",
    render: (c, ctx) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-1">
          <p className="font-display text-base font-semibold text-cyan tabular-nums">
            {formatRangeFromInr(ins.indiaEntryInr, ctx.currency)}
          </p>
          <p className="text-xs text-muted-foreground">{ins.compensationStructure.baseNote}</p>
        </div>
      );
    },
  },
  {
    key: "salary_abroad_entry",
    label: "6 · Entry-level salary (Abroad indicative)",
    render: (c, ctx) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-1">
          <p className="font-display text-base font-semibold text-lavender-bright tabular-nums">
            {formatAbroadRange(ins.abroadEntryUsd, ctx.currency)}
          </p>
          <p className="text-xs text-muted-foreground">{ins.salaryPeriod}</p>
        </div>
      );
    },
  },
  {
    key: "salary_mid",
    label: "7 · Mid-career salary (3–7 yrs)",
    render: (c, ctx) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-1 tabular-nums">
          <p className="font-medium text-foreground">
            India: {formatRangeFromInr(ins.indiaMidInr, ctx.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            Abroad: {formatAbroadRange(ins.abroadMidUsd, ctx.currency)}
          </p>
          <p className="text-xs text-text-2">{ins.compensationStructure.variableNote}</p>
        </div>
      );
    },
  },
  {
    key: "salary_experienced",
    label: "8 · Experienced salary (8+ yrs)",
    render: (c, ctx) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-1 tabular-nums">
          <p className="font-medium text-turquoise">
            India: {formatRangeFromInr(ins.indiaExperiencedInr, ctx.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            Abroad: {formatAbroadRange(ins.abroadExperiencedUsd, ctx.currency)}
          </p>
        </div>
      );
    },
  },
  {
    key: "difficulty_entry",
    label: "9 · Difficulty of entry",
    render: (c) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bar value={c.commitmentLevel} />
            <span className="text-xs font-semibold text-cyan">{ins.difficultyOfEntry}</span>
          </div>
          <p>{ins.difficultyExplanation}</p>
        </div>
      );
    },
  },
  {
    key: "job_opportunities",
    label: "10 · Job opportunities, sectors & remote availability",
    render: (c) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-1.5">
          <p className="font-medium text-foreground">{ins.jobOpportunities.remotePossibility}</p>
          <p className="text-xs">
            <span className="text-cyan">Industries:</span>{" "}
            {ins.jobOpportunities.hiringIndustries.join(", ")}
          </p>
          <p className="text-xs">
            <span className="text-cyan">Sectors:</span> {ins.jobOpportunities.sectors.join(", ")}
          </p>
          <p className="text-xs text-muted-foreground">{c.entryLevelOpportunities}</p>
        </div>
      );
    },
  },
  {
    key: "future_demand",
    label: "11 · Future industry demand outlook",
    render: (c) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-1.5">
          <p className="font-medium text-cyan">
            {ins.futureDemand.trend} ({ins.futureDemand.timeframe})
          </p>
          <p>{ins.futureDemand.outlookNote}</p>
          <p className="text-[11px] text-muted-foreground">Source: {ins.futureDemand.source}</p>
        </div>
      );
    },
  },
  {
    key: "education_costs",
    label: "12 · Education & preparation costs",
    render: (c, ctx) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-1.5">
          <p className="font-medium text-cyan tabular-nums">
            Estimated pathway: {formatRangeFromInr(ins.educationCostInr, ctx.currency, false)}
          </p>
          <p className="text-xs text-foreground">
            Starter budget tier: ₹{c.budgetTier.toLocaleString("en-IN")}
          </p>
          <p className="text-xs">{ins.educationCostSummary}</p>
        </div>
      );
    },
  },
  {
    key: "time_employability",
    label: "13 · Time to employability",
    render: (c) => {
      const ins = getCareerInsight(c);
      return (
        <div className="space-y-1.5">
          <p className="font-medium text-foreground tabular-nums">
            ~{ins.employabilityMonths[0]}–{ins.employabilityMonths[1]} months
          </p>
          <p className="text-xs">{ins.employabilityNote}</p>
        </div>
      );
    },
  },
  {
    key: "compatibility_score",
    label: "14 · Personal Career Compatibility Score (Estimate)",
    render: (c, ctx) => {
      const rep = computeCompatibility(c, ctx.profile, ctx.answers);
      return (
        <div className="space-y-2">
          <CompatibilityBadge career={c} profile={ctx.profile} fallbackAnswers={ctx.answers} />
          <p className="text-xs">{rep.financialAlignmentNote}</p>
          {rep.missingSkills.length > 0 && (
            <p className="text-xs text-warning">
              Key gaps: {rep.missingSkills.slice(0, 3).join(", ")}
            </p>
          )}
        </div>
      );
    },
  },
  {
    key: "growth_opportunities",
    label: "15 · Growth, freelance & entrepreneurship opportunities",
    render: (c) => (
      <div className="space-y-2">
        <ol className="space-y-0.5 text-xs text-foreground">
          {c.progression.map((step, i) => (
            <li key={step}>
              {i + 1}. {step}
            </li>
          ))}
        </ol>
        <p className="text-xs">
          <span className="font-medium text-cyan">Freelance:</span> {c.freelanceOpportunity}
        </p>
        <p className="text-xs">
          <span className="font-medium text-cyan">Startup / Independent:</span>{" "}
          {c.entrepreneurshipOpportunity}
        </p>
      </div>
    ),
  },
  {
    key: "advantages",
    label: "16 · Advantages",
    render: (c) => (
      <ul className="space-y-1 text-success">
        {c.pros.map((r) => (
          <li key={r}>+ {r}</li>
        ))}
      </ul>
    ),
  },
  {
    key: "disadvantages",
    label: "17 · Disadvantages & trade-offs",
    render: (c) => (
      <ul className="space-y-1 text-warning">
        {c.cons.map((r) => (
          <li key={r}>– {r}</li>
        ))}
      </ul>
    ),
  },
];

function buildComparisonSummary(
  cs: Career[],
  profile?: UserProfileRecord | null,
  answers?: DiscoveryAnswers,
): string[] {
  const shared = cs[0]!.skills.filter((s) => cs.slice(1).every((c) => c.skills.includes(s)));
  const scored = cs
    .map((c) => ({ c, rep: computeCompatibility(c, profile, answers), ins: getCareerInsight(c) }))
    .sort((a, b) => b.rep.score - a.rep.score);
  const fastest = [...scored].sort(
    (a, b) => a.ins.employabilityMonths[0] - b.ins.employabilityMonths[0],
  )[0]!;
  const lowestCost = [...scored].sort((a, b) => a.c.budgetTier - b.c.budgetTier)[0]!;
  const topCompat = scored[0]!;

  return [
    shared.length
      ? `Shared transferable skills: ${shared.join(", ")} — building these keeps all compared futures open.`
      : "These careers rely on distinct primary skill sets, so trying a 15-minute practical challenge on each is valuable.",
    `Highest profile compatibility estimate: ${topCompat.c.name} (${topCompat.rep.score}% · ${topCompat.rep.band}) based on your current profile and preferences.`,
    `Fastest time to entry employability: ${fastest.c.name} (~${fastest.ins.employabilityMonths[0]}–${fastest.ins.employabilityMonths[1]} months); lowest starter budget tier: ${lowestCost.c.name} (₹${lowestCost.c.budgetTier.toLocaleString("en-IN")}).`,
    ...scored.map(
      ({ c, ins }) =>
        `${c.name} (${ins.futureDemand.trend} demand): stronger if you value ${(c.pros[0] ?? "").toLowerCase()}, weighing trade-off: ${(c.cons[0] ?? "").toLowerCase()}.`,
    ),
  ];
}

function Compare() {
  const { compare, saved, savedComparisons, profile, discovery } = useApp();
  const { user } = useUser();
  const { careers } = useCareersCatalog();

  const ids = compare.filter((id) => getCareer(id, careers));
  const cs = ids.map((id) => getCareer(id, careers)!);

  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [open, setOpen] = useState<Record<string, boolean>>({
    overview: true,
    qualifications: true,
    salary_india_entry: true,
    difficulty_entry: true,
    compatibility_score: true,
    advantages: true,
    disadvantages: true,
  });
  const [picking, setPicking] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerIndustry, setPickerIndustry] = useState("ALL");
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const key = ids.join("|");
  useEffect(() => {
    if (cs.length >= 2) {
      actions.markCompared(cs.map((c) => c.name));
      setSaveTitle(cs.map((c) => c.name).join(" vs "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const pickerChoices = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return [...careers]
      .filter((c) => !ids.includes(c.id))
      .filter((c) => (pickerIndustry === "ALL" ? true : c.industry === pickerIndustry))
      .filter((c) =>
        !q ? true : `${c.name} ${c.industry} ${c.skills.join(" ")}`.toLowerCase().includes(q),
      )
      .sort((a, b) => Number(saved.includes(b.id)) - Number(saved.includes(a.id)))
      .slice(0, 24);
  }, [careers, ids, pickerSearch, pickerIndustry, saved]);

  const remove = (id: string) => actions.setCompare(ids.filter((x) => x !== id));
  const add = (id: string) => {
    actions.setCompare([...ids, id]);
    setPicking(false);
    setPickerSearch("");
  };

  const toggleAllRows = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    for (const r of ROWS) next[r.key] = expand;
    setOpen(next);
  };

  const handleSaveComparison = async () => {
    if (cs.length < 2) return;
    setSaving(true);
    try {
      await actions.saveComparisonRecord(
        ids,
        saveTitle.trim() || cs.map((c) => c.name).join(" vs "),
      );
      toast.success(
        user?.emailVerified
          ? "Comparison saved to your account"
          : "Comparison saved locally (sign in & verify email to sync)",
      );
    } finally {
      setSaving(false);
    }
  };

  const ctx: CompareRowContext = { currency, profile, answers: discovery?.answers };

  return (
    <AppShell>
      <PageHeader
        eyebrow="17-Dimension Career Comparison"
        title="Compare My Futures"
        text="Examine 2 or 3 careers across salaries (India & abroad), skills, qualifications, demand, employability time, compatibility score, and trade-offs — without picking a universal winner."
      >
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Comparison display currency"
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
          <Button
            variant="outline"
            className="h-9 min-h-9 px-3 text-xs"
            onClick={() => toggleAllRows(true)}
          >
            Expand all 17
          </Button>
          <Button
            variant="ghost"
            className="h-9 min-h-9 px-3 text-xs"
            onClick={() => toggleAllRows(false)}
          >
            Collapse all
          </Button>
        </div>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Try a comparison:</span>
        {PRESETS.map((p) => {
          const names = p.map((id) => getCareer(id, careers)?.name).filter(Boolean);
          if (names.length < 2) return null;
          return (
            <Chip
              key={p.join()}
              active={p.join() === ids.join()}
              onClick={() => actions.setCompare(p)}
            >
              {names.join(" vs ")}
            </Chip>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cs.map((c) => {
          const h = HUE_CLASS[c.hue];
          return (
            <Glass key={c.id} className={cn("relative min-w-0 break-words border-t-2", h.border)}>
              <button
                type="button"
                onClick={() => remove(c.id)}
                aria-label={`Remove ${c.name} from comparison`}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-2 pr-8">
                <span
                  className={cn(
                    "inline-grid size-10 shrink-0 place-items-center rounded-xl border font-display font-semibold",
                    h.bg,
                    h.border,
                    h.text,
                  )}
                >
                  {c.name[0]}
                </span>
                <CompatibilityBadge
                  career={c}
                  profile={profile}
                  fallbackAnswers={discovery?.answers}
                />
              </div>
              <p className="mt-2 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                {c.industry}
              </p>
              <h2 className="mt-0.5 pr-6 font-display text-xl font-semibold leading-snug">
                {c.name}
              </h2>
              <p className="mt-1 text-sm text-text-2">{c.short}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SaveButton career={c} />
                <Link to="/careers/$id" params={{ id: c.id }} className={btnClass("ghost")}>
                  Full profile
                </Link>
              </div>
            </Glass>
          );
        })}

        {cs.length < 3 && (
          <div className="glass flex min-h-48 min-w-0 flex-col justify-center gap-3 border-dashed p-5">
            {!picking ? (
              <div className="text-center">
                <button type="button" onClick={() => setPicking(true)} className={btnClass("soft")}>
                  <Plus className="size-4" /> Add a career from 260+ options
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search career or skill…"
                    className={inputClass("h-9 pl-8 pr-2 text-xs")}
                  />
                </div>
                <select
                  aria-label="Filter career picker by industry"
                  value={pickerIndustry}
                  onChange={(e) => setPickerIndustry(e.target.value)}
                  className={selectClass("h-9 px-2 text-xs")}
                >
                  <option value="ALL">All industries</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {pickerChoices.map((c) => (
                    <Chip key={c.id} onClick={() => add(c.id)} className="px-2.5 py-1 text-xs">
                      {saved.includes(c.id) ? "★ " : ""}
                      {c.name}
                    </Chip>
                  ))}
                </div>
                <button
                  type="button"
                  className={btnClass("ghost", "h-8 min-h-8 text-xs")}
                  onClick={() => setPicking(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {cs.length < 2 ? (
        <div className="mt-6">
          <Notice>Add at least two careers to see the 17-dimension comparison.</Notice>
        </div>
      ) : (
        <>
          <Glass className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scale className="size-5 text-cyan" />
                <h2 className="font-display text-xl font-semibold">
                  Difference highlights & user-priority summary
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label="Comparison title"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Comparison name…"
                  className={inputClass("h-9 w-56 text-xs")}
                />
                {user ? (
                  <Button
                    variant="soft"
                    className="h-9 min-h-9 px-3 text-xs"
                    onClick={handleSaveComparison}
                    disabled={saving}
                  >
                    <BookmarkPlus className="size-3.5" /> {saving ? "Saving…" : "Save Comparison"}
                  </Button>
                ) : (
                  <Link
                    to="/auth"
                    search={{ next: "/compare" }}
                    className={btnClass("soft", "h-9 min-h-9 px-3 text-xs")}
                  >
                    Sign in to save comparison
                  </Link>
                )}
              </div>
            </div>
            <ul className="space-y-2 text-text-2">
              {buildComparisonSummary(cs, profile, discovery?.answers).map((l) => (
                <li key={l} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lavender" />
                  <span className="min-w-0 break-words">{l}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground">
              Salaries and timelines are indicative market benchmarks (2025–2026) and do not
              guarantee income. Futuroute highlights trade-offs based on your priorities rather than
              declaring a single universal winner.
            </p>
          </Glass>

          <section aria-label="Comparison table" className="mt-6 space-y-3">
            {ROWS.map((r) => (
              <div key={r.key} className="glass overflow-hidden p-0">
                <button
                  type="button"
                  aria-expanded={!!open[r.key]}
                  onClick={() => setOpen({ ...open, [r.key]: !open[r.key] })}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-display font-semibold hover:bg-secondary"
                >
                  <span>{r.label}</span>
                  <ChevronDown
                    className={cn("size-4 shrink-0 transition", open[r.key] && "rotate-180")}
                  />
                </button>
                {open[r.key] && (
                  <div
                    className={cn(
                      "grid gap-px border-t border-glass-border bg-glass-border",
                      cs.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
                    )}
                  >
                    {cs.map((c) => (
                      <div
                        key={c.id}
                        className="min-w-0 break-words bg-indigo-deep/85 p-5 text-sm text-text-2"
                      >
                        <p
                          className={cn(
                            "mb-2 text-xs font-medium uppercase tracking-wider",
                            HUE_CLASS[c.hue].text,
                          )}
                        >
                          {c.name}
                        </p>
                        {r.render(c, ctx)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>

          <Glass className="mt-6">
            <h2 className="font-display text-2xl font-semibold">What should I try first?</h2>
            <p className="mt-1 text-text-2">
              Spend 10 minutes on each. Notice which one you&apos;d happily keep doing.
            </p>
            <div
              className={cn(
                "mt-5 grid gap-4",
                cs.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
              )}
            >
              {cs.map((c) => (
                <div key={c.id} className="glass-soft flex min-w-0 flex-col gap-3 p-5 break-words">
                  <p className={cn("text-sm font-medium", HUE_CLASS[c.hue].text)}>{c.name} trial</p>
                  <p className="text-text-2">{c.trial}</p>
                  <Link
                    to="/try"
                    search={{ c: c.challengeId }}
                    className={btnClass("outline", "mt-auto")}
                  >
                    <FlaskConical className="size-4" /> Start this trial
                  </Link>
                </div>
              ))}
            </div>
          </Glass>
        </>
      )}

      {savedComparisons.length > 0 && (
        <Glass className="mt-6">
          <h2 className="font-display text-lg font-semibold">Your saved comparisons</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {savedComparisons.map((item) => (
              <div
                key={item.id}
                className="glass-soft flex items-center justify-between gap-3 px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => actions.setCompare(item.careerIds)}
                  className="min-w-0 flex-1 text-left hover:text-cyan"
                >
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.careerIds.length} careers · Click to load
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${item.title}`}
                  onClick={() => void actions.removeComparisonRecord(item.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-warning"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </Glass>
      )}
    </AppShell>
  );
}
