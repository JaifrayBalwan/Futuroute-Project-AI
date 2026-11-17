import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  FlaskConical,
  GitCompareArrows,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CareerCard, SaveButton } from "@/components/CareerParts";
import { CompatibilityBadge, CompatibilityCard } from "@/components/CompatibilityCard";
import {
  Button,
  Chip,
  Glass,
  Notice,
  PageHeader,
  btnClass,
  inputClass,
  selectClass,
} from "@/components/ui-kit";
import { CAPABILITIES, INTERESTS, SUBJECTS } from "@/lib/auth";
import { INDUSTRIES, type Career } from "@/lib/careers";
import { useCareersCatalog } from "@/lib/careers-service";
import {
  recommendGrouped,
  type GroupedRecommendations,
  type RecommendationItem,
} from "@/lib/engine";
import { actions, useApp, type DiscoveryAnswers } from "@/lib/store";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Careers — Futuroute" },
      {
        name: "description",
        content:
          "Explore 260+ careers across 20 industries or answer a guided questionnaire for personalised career recommendations.",
      },
      { property: "og:title", content: "Discover Careers — Futuroute" },
      {
        property: "og:description",
        content: "Guided career discovery and 260+ career explorer across 20 industries.",
      },
    ],
  }),
  component: Discover,
});

type Step = {
  key: string;
  title: string;
  help?: string;
  type: "single" | "multi" | "slider";
  options?: { value: string; label: string }[];
  optional?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

const QUICK_CURIOUS_IDS = [
  "software-developer",
  "ai-ml-engineer",
  "sports-analytics-engineer",
  "football-coach",
  "ui-ux-designer",
  "data-analyst",
  "cybersecurity-analyst",
  "digital-marketer",
  "investment-banking-analyst",
  "corporate-lawyer",
  "biotech-researcher",
  "game-developer",
  "entrepreneurship-founder",
  "sustainability-consultant",
  "clinical-psychologist",
];

function buildSteps(careers: Career[]): Step[] {
  const curiousOptions = QUICK_CURIOUS_IDS.map((id) => {
    const c = careers.find((x) => x.id === id);
    return c ? { value: c.id, label: c.name } : null;
  }).filter((x): x is { value: string; label: string } => Boolean(x));

  return [
    {
      key: "education",
      title: "What's your current education level?",
      type: "single",
      options: [
        "Class 9–10",
        "Class 11–12",
        "Diploma",
        "Undergraduate",
        "Postgraduate",
        "Other",
      ].map((v) => ({
        value: v,
        label: v,
      })),
    },
    {
      key: "interests",
      title: "Which interests and topics excite you most?",
      help: "Pick as many as you enjoy — from football and cricket to AI, law, or art.",
      type: "multi",
      options: INTERESTS.map(([value, label]) => ({ value, label })),
    },
    {
      key: "capabilities",
      title: "Which strengths or capabilities fit you best?",
      help: "Pick traits you already notice or want to build.",
      type: "multi",
      options: CAPABILITIES.map(([value, label]) => ({ value, label })),
    },
    {
      key: "subjects",
      title: "Which subjects do you enjoy most?",
      help: "Optional — helps connect school learning with career fields.",
      type: "multi",
      optional: true,
      options: SUBJECTS.map((v) => ({ value: v, label: v })),
    },
    {
      key: "work",
      title: "What kind of day-to-day work sounds appealing?",
      type: "multi",
      options: [
        "Solving logical problems",
        "Designing visuals",
        "Working with data",
        "Talking to people",
        "Protecting systems",
        "Running campaigns",
        "Building things",
        "Physical Fitness",
        "Investigating mysteries",
      ].map((v) => ({ value: v, label: v })),
    },
    {
      key: "environment",
      title: "Preferred working environment?",
      type: "single",
      optional: true,
      options: [
        "Office / desk",
        "Outdoors / on the move",
        "Lab or studio",
        "Remote / from home",
        "With people (schools, clinics, events)",
        "No preference",
      ].map((v) => ({ value: v, label: v })),
    },
    {
      key: "curious",
      title: "Any careers you're already curious about?",
      help: "Optional — pick a few starting points or browse all 260+ in the Explorer tab.",
      type: "multi",
      optional: true,
      options: curiousOptions,
    },
    {
      key: "hours",
      title: "How much time can you give each week?",
      type: "slider",
      min: 1,
      max: 25,
      step: 1,
      unit: "hours / week",
    },
    {
      key: "budget",
      title: "What's your available learning budget?",
      help: "Core learning resources across Futuroute are free to start.",
      type: "single",
      options: ["₹0 — free only", "Up to ₹500", "Up to ₹1,000", "Up to ₹5,000"].map((v) => ({
        value: v,
        label: v,
      })),
    },
    {
      key: "priorities",
      title: "What matters most to you in a career?",
      help: "Pick up to three.",
      type: "multi",
      options: [
        "Creativity",
        "Flexibility",
        "Stability",
        "Problem-solving",
        "Impact",
        "Leadership",
      ].map((v) => ({
        value: v,
        label: v,
      })),
    },
  ];
}

function Discover() {
  const { discovery, profile } = useApp();
  const { careers } = useCareersCatalog();
  const [tab, setTab] = useState<"guided" | "browse">("guided");
  const STEPS = useMemo(() => buildSteps(careers), [careers]);

  const initialAnswers = useMemo<DiscoveryAnswers>(() => {
    const base: DiscoveryAnswers = { hours: profile?.weeklyHours ?? 5 };
    if (profile?.educationLevel) base["education"] = profile.educationLevel;
    if (profile?.interests?.length) base["interests"] = profile.interests;
    if (profile?.capabilities?.length) base["capabilities"] = profile.capabilities;
    if (profile?.subjects?.length) base["subjects"] = profile.subjects;
    if (profile?.environment) base["environment"] = profile.environment;
    if (typeof profile?.budget === "number") {
      base["budget"] =
        profile.budget === 0
          ? "₹0 — free only"
          : profile.budget <= 500
            ? "Up to ₹500"
            : profile.budget <= 1000
              ? "Up to ₹1,000"
              : "Up to ₹5,000";
    }
    return base;
  }, [profile]);

  const [i, setI] = useState(0);
  const [a, setA] = useState<DiscoveryAnswers>(initialAnswers);
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(!discovery);

  useEffect(() => {
    if (!discovery && profile && i === 0) {
      setA((prev) => ({ ...initialAnswers, ...prev }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  const step = STEPS[i]!;
  const val = a[step.key];

  const valid = () =>
    step.optional || step.type === "slider" || (Array.isArray(val) ? val.length > 0 : Boolean(val));

  const submitAssessment = (answersToRun: DiscoveryAnswers) => {
    setErr("");
    const grouped = recommendGrouped(answersToRun, careers);
    actions.setDiscovery(
      answersToRun,
      grouped.strongMatches.map((m) => m.career.id),
      grouped as unknown as Record<string, unknown>,
      "deterministic",
    );
    setShowForm(false);
  };

  const next = () => {
    if (!valid()) {
      setErr("Please choose at least one option, or go back to adjust an earlier answer.");
      return;
    }
    setErr("");
    if (i < STEPS.length - 1) setI(i + 1);
    else submitAssessment(a);
  };

  const toggle = (o: string) => {
    const cur = (Array.isArray(val) ? val : []) as string[];
    if (cur.includes(o)) setA({ ...a, [step.key]: cur.filter((x) => x !== o) });
    else if (step.key === "priorities" && cur.length >= 3)
      setErr("You can pick up to three priorities.");
    else {
      setErr("");
      setA({ ...a, [step.key]: [...cur, o] });
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Discover Careers"
        title="Find paths that match your curiosity"
        text="Get personalised grouped recommendations across our 260-career database, or browse every industry freely."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant={tab === "guided" ? "primary" : "outline"}
            onClick={() => setTab("guided")}
          >
            <SlidersHorizontal className="size-4" /> Guided Discovery
          </Button>
          <Button
            variant={tab === "browse" ? "primary" : "outline"}
            onClick={() => setTab("browse")}
          >
            <Compass className="size-4" /> Explore {careers.length}+ Careers
          </Button>
        </div>
      </PageHeader>

      {tab === "browse" ? (
        <BrowseCatalog careers={careers} userInterests={profile?.interests ?? []} />
      ) : !showForm && discovery ? (
        <GroupedReport
          answers={discovery.answers}
          savedGroups={discovery.groups as GroupedRecommendations | undefined}
          careers={careers}
          onRetake={() => {
            setA(discovery.answers);
            setI(0);
            setShowForm(true);
          }}
        />
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center justify-between text-xs text-text-2">
            <span>
              Step {i + 1} of {STEPS.length}
            </span>
            {profile?.interests?.length ? (
              <span className="text-cyan">Pre-filled from your saved profile (editable)</span>
            ) : null}
          </div>
          <div
            className="mb-6 h-2 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={STEPS.length}
            aria-valuenow={i + 1}
            aria-label="Questionnaire progress"
          >
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${((i + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <Glass>
            <fieldset>
              <legend className="font-display text-2xl font-semibold">{step.title}</legend>
              {step.help && <p className="mt-1 text-sm text-muted-foreground">{step.help}</p>}
              <div className="mt-6">
                {step.type === "slider" ? (
                  <div>
                    <label htmlFor="hours" className="font-display text-4xl font-semibold">
                      {(val as number) ?? 5}{" "}
                      <span className="text-base text-text-2">{step.unit}</span>
                    </label>
                    <input
                      id="hours"
                      type="range"
                      min={step.min}
                      max={step.max}
                      step={step.step}
                      value={(val as number) ?? 5}
                      onChange={(e) => setA({ ...a, [step.key]: Number(e.target.value) })}
                      className="mt-4 w-full accent-[var(--lavender-bright)]"
                    />
                  </div>
                ) : step.type === "single" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {step.options!.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={val === o.value}
                        onClick={() => {
                          setErr("");
                          setA({ ...a, [step.key]: o.value });
                        }}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          val === o.value
                            ? "border-lavender/60 bg-lavender/20 glow"
                            : "border-glass-border bg-secondary hover:bg-accent"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {step.options!.map((o) => (
                      <Chip
                        key={o.value}
                        active={Array.isArray(val) && (val as string[]).includes(o.value)}
                        onClick={() => toggle(o.value)}
                      >
                        {o.label}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>
            {err && (
              <div className="mt-4">
                <Notice tone="warn">{err}</Notice>
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setErr("");
                  setI(Math.max(0, i - 1));
                }}
                disabled={i === 0}
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
              <div className="flex gap-2">
                {step.optional && i < STEPS.length - 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setErr("");
                      setI(i + 1);
                    }}
                  >
                    Skip
                  </Button>
                )}
                <Button onClick={next}>
                  {i === STEPS.length - 1 ? (
                    "Generate Discovery Report"
                  ) : (
                    <>
                      Next <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Glass>
        </div>
      )}
    </AppShell>
  );
}

function GroupedReport({
  answers,
  savedGroups,
  careers,
  onRetake,
}: {
  answers: DiscoveryAnswers;
  savedGroups?: GroupedRecommendations | undefined;
  careers: Career[];
  onRetake: () => void;
}) {
  const nav = useNavigate();
  const { profile } = useApp();
  const [openBreakdownId, setOpenBreakdownId] = useState<string | null>(null);
  const report = useMemo<GroupedRecommendations>(() => {
    if (
      savedGroups &&
      Array.isArray(savedGroups.strongMatches) &&
      savedGroups.strongMatches.length > 0
    ) {
      return savedGroups;
    }
    return recommendGrouped(answers, careers);
  }, [answers, careers, savedGroups]);

  const sections: Array<{
    title: string;
    subtitle: string;
    tone: string;
    items: RecommendationItem[];
  }> = [
    {
      title: "Strong Matches",
      subtitle: "Closest fit across your interests, capabilities, and preferred style of work.",
      tone: "text-cyan",
      items: report.strongMatches,
    },
    {
      title: "Alternative Career Paths",
      subtitle:
        "Cross-industry careers that reuse your strongest capabilities in a different domain.",
      tone: "text-lavender-bright",
      items: report.alternativePaths,
    },
    {
      title: "Unexpected Career Discoveries",
      subtitle: "Creative blends and domains many students overlook until they try them.",
      tone: "text-turquoise",
      items: report.unexpectedDiscoveries,
    },
    {
      title: "Emerging Career Opportunities",
      subtitle: "Modern and fast-evolving roles connected to your profile.",
      tone: "text-pink",
      items: report.emergingOpportunities,
    },
  ];

  const topCompareIds = report.strongMatches.slice(0, 3).map((x) => x.career.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{report.summaryNote}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onRetake}>
            <RotateCcw className="size-4" /> Change answers
          </Button>
          {topCompareIds.length >= 2 && (
            <Button
              onClick={() => {
                actions.setCompare(topCompareIds);
                nav({ to: "/compare" });
              }}
            >
              <GitCompareArrows className="size-4" /> Compare top matches
            </Button>
          )}
        </div>
      </div>

      {sections.map(
        (sec) =>
          sec.items.length > 0 && (
            <section key={sec.title} className="space-y-4">
              <div>
                <h2 className={`font-display text-2xl font-semibold ${sec.tone}`}>{sec.title}</h2>
                <p className="text-sm text-text-2">{sec.subtitle}</p>
              </div>
              <div className="space-y-4">
                {sec.items.map((item) => {
                  const c = item.career;
                  return (
                    <Glass key={c.id} as="article" className="min-w-0 break-words">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-wider text-cyan">
                            {c.industry} · {c.subcategory}
                            {c.emerging ? " · Emerging" : ""}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2.5">
                            <h3 className="font-display text-2xl font-semibold">{c.name}</h3>
                            <CompatibilityBadge
                              career={c}
                              profile={profile}
                              fallbackAnswers={answers}
                            />
                          </div>
                          <p className="mt-1 text-sm text-text-2">{c.short}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <SaveButton career={c} />
                          <Link
                            to="/careers/$id"
                            params={{ id: c.id }}
                            className={btnClass("outline")}
                          >
                            Full profile
                          </Link>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-lavender-bright">
                            1 · Why this career matches
                          </h4>
                          <p className="text-sm text-text-2">{item.whyItMatches}</p>
                        </div>
                        <div>
                          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-lavender-bright">
                            2 · Relevant skills you bring
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {item.relevantSkills.map((s) => (
                              <Chip key={s} className="px-2 py-0.5 text-xs">
                                {s}
                              </Chip>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-lavender-bright">
                            3 · Skills to develop
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {item.skillsToDevelop.map((s) => (
                              <Chip key={s} className="px-2 py-0.5 text-xs">
                                {s}
                              </Chip>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-lavender-bright">
                            4 · Required qualifications
                          </h4>
                          <ul className="space-y-1 text-sm text-text-2">
                            {item.requiredQualifications.map((q) => (
                              <li key={q}>• {q}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-lavender-bright">
                            5 · How to start free
                          </h4>
                          <p className="text-sm text-text-2">{item.howToStart}</p>
                        </div>
                        <div>
                          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-lavender-bright">
                            6 · Practical beginner trial
                          </h4>
                          <p className="text-sm text-text-2">{item.practicalTrial}</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-glass-border pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setOpenBreakdownId(openBreakdownId === c.id ? null : c.id)}
                        >
                          {openBreakdownId === c.id
                            ? "Hide compatibility score"
                            : "Inspect compatibility score"}
                        </Button>
                        <Link to="/try" search={{ c: c.challengeId }} className={btnClass("soft")}>
                          <FlaskConical className="size-4" /> Try the challenge
                        </Link>
                        <Link to="/planner" search={{ career: c.id }} className={btnClass("ghost")}>
                          <Wallet className="size-4" /> Plan learning
                        </Link>
                      </div>

                      {openBreakdownId === c.id && (
                        <div className="mt-4">
                          <CompatibilityCard
                            career={c}
                            profile={profile}
                            fallbackAnswers={answers}
                            defaultExpanded
                          />
                        </div>
                      )}
                    </Glass>
                  );
                })}
              </div>
            </section>
          ),
      )}
    </div>
  );
}

const selCls = selectClass("h-10");

function BrowseCatalog({ careers, userInterests }: { careers: Career[]; userInterests: string[] }) {
  const [queryText, setQueryText] = useState("");
  const [industry, setIndustry] = useState("ALL");
  const [interest, setInterest] = useState("ALL");
  const [capability, setCapability] = useState("ALL");
  const [budgetMax, setBudgetMax] = useState("ALL");
  const [emergingOnly, setEmergingOnly] = useState(false);
  const [beyondInterests, setBeyondInterests] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "az" | "gentle" | "deep">("default");
  const [limit, setLimit] = useState(18);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const userIntSet = new Set(userInterests.map((x) => x.toLowerCase()));

    const list = careers.filter((c) => {
      if (industry !== "ALL" && c.industry !== industry) return false;
      if (interest !== "ALL" && !c.interests.includes(interest)) return false;
      if (capability !== "ALL" && !c.capabilities.includes(capability)) return false;
      if (budgetMax === "0" && c.budgetTier > 0) return false;
      if (budgetMax === "1000" && c.budgetTier > 1000) return false;
      if (emergingOnly && !c.emerging) return false;
      if (beyondInterests && userIntSet.size > 0) {
        if (c.interests.some((intId) => userIntSet.has(intId.toLowerCase()))) return false;
      }
      if (q) {
        const hay =
          `${c.name} ${c.industry} ${c.subcategory} ${c.short} ${c.skills.join(" ")} ${c.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "az") return [...list].sort((x, y) => x.name.localeCompare(y.name));
    if (sortBy === "gentle")
      return [...list].sort(
        (x, y) => x.commitmentLevel - y.commitmentLevel || x.name.localeCompare(y.name),
      );
    if (sortBy === "deep")
      return [...list].sort(
        (x, y) => y.commitmentLevel - x.commitmentLevel || x.name.localeCompare(y.name),
      );
    return list;
  }, [
    careers,
    queryText,
    industry,
    interest,
    capability,
    budgetMax,
    emergingOnly,
    beyondInterests,
    sortBy,
    userInterests,
  ]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="space-y-6">
      <Glass className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={queryText}
              onChange={(e) => {
                setQueryText(e.target.value);
                setLimit(18);
              }}
              placeholder="Search careers, industries, skills (e.g. football analytics, biotech, law)…"
              className={inputClass("h-10 pl-9")}
            />
          </div>
          <select
            aria-label="Filter by industry"
            className={selCls}
            value={industry}
            onChange={(e) => {
              setIndustry(e.target.value);
              setLimit(18);
            }}
          >
            <option value="ALL">All {INDUSTRIES.length} Industries</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort careers"
            className={selCls}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="default">Sort: Featured order</option>
            <option value="az">Sort: A – Z</option>
            <option value="gentle">Sort: Gentlest starting curve</option>
            <option value="deep">Sort: Deepest mastery</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <select
            aria-label="Filter by interest"
            className={selCls}
            value={interest}
            onChange={(e) => {
              setInterest(e.target.value);
              setLimit(18);
            }}
          >
            <option value="ALL">All Interests</option>
            {INTERESTS.map(([id, label]) => (
              <option key={id} value={id}>
                Interest: {label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by capability"
            className={selCls}
            value={capability}
            onChange={(e) => {
              setCapability(e.target.value);
              setLimit(18);
            }}
          >
            <option value="ALL">All Capabilities</option>
            {CAPABILITIES.map(([id, label]) => (
              <option key={id} value={id}>
                Strength: {label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by starting budget"
            className={selCls}
            value={budgetMax}
            onChange={(e) => {
              setBudgetMax(e.target.value);
              setLimit(18);
            }}
          >
            <option value="ALL">Any starter budget</option>
            <option value="0">Free to start (₹0)</option>
            <option value="1000">Up to ₹1,000 optional gear/exam</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-2">
            <Chip active={emergingOnly} onClick={() => setEmergingOnly(!emergingOnly)}>
              <Sparkles className="size-3.5" /> Emerging Careers Only
            </Chip>
            <Chip active={beyondInterests} onClick={() => setBeyondInterests(!beyondInterests)}>
              Explore Beyond My Interests
            </Chip>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {visible.length} of {filtered.length} matching careers ({careers.length} total)
          </p>
        </div>
        {beyondInterests && userInterests.length === 0 && (
          <Notice tone="info">
            Tip: Add interests in your Profile or complete Guided Discovery so “Explore Beyond My
            Interests” hides your primary fields and surfaces surprising paths.
          </Notice>
        )}
      </Glass>

      {filtered.length === 0 ? (
        <Glass className="text-center">
          <p className="font-display text-lg font-semibold">No careers match all active filters</p>
          <p className="mt-1 text-sm text-text-2">
            Try widening your industry, capability, or search query.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQueryText("");
              setIndustry("ALL");
              setInterest("ALL");
              setCapability("ALL");
              setBudgetMax("ALL");
              setEmergingOnly(false);
              setBeyondInterests(false);
            }}
          >
            Clear all filters
          </Button>
        </Glass>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((c) => (
              <CareerCard key={c.id} career={c} />
            ))}
          </div>
          {visible.length < filtered.length && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setLimit((n) => n + 24)}>
                Load more careers ({filtered.length - visible.length} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
