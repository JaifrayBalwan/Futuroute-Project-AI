import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Map,
  Plus,
  Rocket,
  Save,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Chip,
  Glass,
  Notice,
  PageHeader,
  ProgressRing,
  btnClass,
  inputClass,
  selectClass,
} from "@/components/ui-kit";
import { formatAmountFromInr } from "@/lib/career-insights";
import { useCareersCatalog } from "@/lib/careers-service";
import {
  BACKGROUND_STREAM_PRESETS,
  buildTransitionRoadmap,
  simulateCareerTransition,
  type AcademicStreamOption,
} from "@/lib/simulator";
import { actions, useApp } from "@/lib/store";

export const Route = createFileRoute("/simulator")({
  validateSearch: (search: Record<string, unknown>): { target?: string | undefined } => {
    const res: { target?: string | undefined } = {};
    if (typeof search["target"] === "string") res.target = search["target"];
    return res;
  },
  head: () => ({
    meta: [
      { title: "Career Change Simulator — Futuroute" },
      {
        name: "description",
        content:
          "Compare your current background or academic stream against any of 260+ target careers: transferable skills, skill gaps, costs, timeline, and transition roadmap.",
      },
      { property: "og:title", content: "Career Change Simulator — Futuroute" },
      {
        property: "og:description",
        content: "Plan a realistic transition between roles or academic streams.",
      },
    ],
  }),
  component: CareerSimulatorPage,
});

const QUALIFICATION_OPTIONS = [
  "Class 10 / Secondary",
  "Class 12 / Senior Secondary",
  "Vocational / Polytechnic Diploma",
  "Undergraduate degree (Bachelor's)",
  "Postgraduate degree (Master's / MBA / PhD)",
  "Self-taught / Certificate track",
] as const;

const BUDGET_PRESETS = [0, 500, 1000, 2000, 5000, 15000] as const;
const TIMELINE_OPTIONS = [3, 6, 9, 12, 18, 24] as const;

const SUGGESTED_QUICK_SKILLS = [
  "Communication",
  "Spreadsheets",
  "Python",
  "SQL",
  "Design thinking",
  "Writing",
  "Mathematics",
  "Project planning",
  "Public speaking",
  "Data analysis",
] as const;

function CareerSimulatorPage() {
  const { careers } = useCareersCatalog();
  const s = useApp();
  const search = Route.useSearch();
  const nav = useNavigate();

  const sortedCareers = useMemo(
    () => [...careers].sort((a, b) => a.name.localeCompare(b.name)),
    [careers],
  );

  const [currentBackground, setCurrentBackground] = useState<string>("student-beginner");
  const [targetCareerId, setTargetCareerId] = useState<string>(() => {
    if (search.target && careers.some((c) => c.id === search.target)) return search.target;
    return "data-analyst";
  });

  useEffect(() => {
    if (search.target && careers.some((c) => c.id === search.target)) {
      setTargetCareerId(search.target);
    }
  }, [search.target, careers]);

  const [currentSkills, setCurrentSkills] = useState<string[]>(() =>
    s.profile?.currentSkills?.length
      ? s.profile.currentSkills
      : ["Communication", "Problem-solving"],
  );
  const [skillDraft, setSkillDraft] = useState("");
  const [previousQualifications, setPreviousQualifications] = useState<string>(() => {
    const edu = s.profile?.educationLevel;
    if (edu === "Undergraduate") return "Undergraduate degree (Bachelor's)";
    if (edu === "Postgraduate") return "Postgraduate degree (Master's / MBA / PhD)";
    if (edu === "Diploma") return "Vocational / Polytechnic Diploma";
    return "Class 12 / Senior Secondary";
  });
  const [weeklyHours, setWeeklyHours] = useState<number>(() => s.profile?.weeklyHours ?? 6);
  const [budgetInr, setBudgetInr] = useState<number>(() => s.profile?.budget ?? 1000);
  const [preferredTimelineMonths, setPreferredTimelineMonths] = useState<number>(6);
  const [creatingRoadmap, setCreatingRoadmap] = useState(false);
  const [savingSim, setSavingSim] = useState(false);

  const sim = useMemo(
    () =>
      simulateCareerTransition(
        {
          currentBackground,
          currentSkills,
          previousQualifications,
          targetCareerId,
          weeklyHours,
          budgetInr,
          preferredTimelineMonths,
        },
        careers,
      ),
    [
      currentBackground,
      currentSkills,
      previousQualifications,
      targetCareerId,
      weeklyHours,
      budgetInr,
      preferredTimelineMonths,
      careers,
    ],
  );

  const addSkill = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (currentSkills.some((x) => x.toLowerCase() === cleaned.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    setCurrentSkills((prev) => [...prev, cleaned].slice(0, 18));
    setSkillDraft("");
  };

  const removeSkill = (skill: string) => {
    setCurrentSkills((prev) => prev.filter((x) => x !== skill));
  };

  const handleGenerateRoadmap = async () => {
    setCreatingRoadmap(true);
    try {
      const rm = buildTransitionRoadmap(sim, weeklyHours, budgetInr);
      await actions.addRoadmap(rm, sim.targetCareer.name);
      toast.success(`5-phase transition roadmap created for ${sim.targetCareer.name}`);
      void nav({ to: "/roadmap" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate transition roadmap");
    } finally {
      setCreatingRoadmap(false);
    }
  };

  const handleSaveAnalysis = async () => {
    setSavingSim(true);
    try {
      await actions.addTransition({
        currentRole: sim.currentLabel,
        targetCareerId: sim.targetCareer.id,
        targetCareerName: sim.targetCareer.name,
        existingSkills: [...sim.existingRelevantSkills, ...sim.transferableSkills],
        missingSkills: [...sim.missingTechnicalSkills, ...sim.missingSoftSkills],
        compatibilityScore: sim.compatibilityScore,
        estimatedWeeks: sim.estimatedWeeks,
        budgetInr,
        weeklyHours,
      });
      toast.success("Transition analysis saved to your account");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save transition analysis");
    } finally {
      setSavingSim(false);
    }
  };

  const difficultyTone =
    sim.transitionDifficulty === "Smooth"
      ? "border-success/40 bg-success/15 text-success"
      : sim.transitionDifficulty === "Moderate"
        ? "border-cyan/40 bg-cyan/15 text-cyan"
        : "border-warning/40 bg-warning/15 text-warning";

  return (
    <AppShell>
      <PageHeader
        eyebrow="Career Change Simulator"
        title="Simulate switching paths before you commit"
        text="Compare your current career or student stream against any target career — map transferable strengths, spot missing skills or qualifications, estimate realistic time and INR cost, and generate a 5-phase transition roadmap."
      >
        <Link to="/compare" className={btnClass("outline")}>
          <ArrowLeftRight className="size-4" /> Compare Careers
        </Link>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        {/* Left: Simulation Inputs */}
        <Glass className="space-y-5 self-start">
          <div>
            <h2 className="font-display text-lg font-semibold">1. Where are you starting from?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Students & beginners can pick an academic stream; career switchers can select any of
              260+ roles.
            </p>
          </div>

          <div className="space-y-4">
            <label className="grid gap-1.5 text-xs text-text-2">
              Current career or student background
              <select
                value={currentBackground}
                onChange={(e) => setCurrentBackground(e.target.value)}
                className={selectClass()}
              >
                <optgroup label="Student / Academic Stream">
                  {(Object.keys(BACKGROUND_STREAM_PRESETS) as AcademicStreamOption[]).map((key) => (
                    <option key={key} value={key}>
                      {BACKGROUND_STREAM_PRESETS[key].label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="260+ Existing Careers">
                  {sortedCareers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry})
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label className="grid gap-1.5 text-xs text-text-2">
              Target career to transition into
              <select
                value={targetCareerId}
                onChange={(e) => setTargetCareerId(e.target.value)}
                className={selectClass()}
              >
                {sortedCareers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.industry}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs text-text-2">
              Highest / current qualification
              <select
                value={previousQualifications}
                onChange={(e) => setPreviousQualifications(e.target.value)}
                className={selectClass()}
              >
                {QUALIFICATION_OPTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2.5 border-t border-glass-border pt-4">
            <p className="text-xs font-medium text-text-2">2. Your current skills</p>
            <div className="flex gap-2">
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillDraft);
                  }
                }}
                placeholder="Add a skill (e.g. Excel, Writing, Python)…"
                className={inputClass("h-10")}
              />
              <Button
                variant="soft"
                onClick={() => addSkill(skillDraft)}
                className="h-10 shrink-0 px-3"
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>

            {currentSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {currentSkills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1 rounded-full border border-lavender/40 bg-lavender/15 px-2.5 py-1 text-xs text-foreground"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => removeSkill(sk)}
                      aria-label={`Remove ${sk}`}
                      className="text-text-2 hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="pt-1">
              <p className="mb-1.5 text-[11px] text-muted-foreground">Quick-add common skills:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUICK_SKILLS.filter(
                  (q) => !currentSkills.some((x) => x.toLowerCase() === q.toLowerCase()),
                ).map((q) => (
                  <Chip key={q} onClick={() => addSkill(q)} className="px-2.5 py-0.5 text-[11px]">
                    + {q}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-glass-border pt-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs text-text-2">
              Weekly study hours ({weeklyHours} h/wk)
              <input
                type="range"
                min={2}
                max={35}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="accent-cyan"
              />
            </label>
            <label className="grid gap-1.5 text-xs text-text-2">
              Preferred timeline
              <select
                value={preferredTimelineMonths}
                onChange={(e) => setPreferredTimelineMonths(Number(e.target.value))}
                className={selectClass("h-10")}
              >
                {TIMELINE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    Within {m} months
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-2">
              <span>Learning & upskilling budget (INR)</span>
              <span className="font-medium text-foreground">
                {budgetInr === 0 ? "₹0 (Free-first)" : `₹${budgetInr.toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_PRESETS.map((b) => (
                <Chip
                  key={b}
                  active={budgetInr === b}
                  onClick={() => setBudgetInr(b)}
                  className="px-2.5 py-1 text-xs"
                >
                  {b === 0 ? "₹0 Free" : `₹${b.toLocaleString("en-IN")}`}
                </Chip>
              ))}
            </div>
          </div>
        </Glass>

        {/* Right: Rule-Based Simulation Output */}
        <div className="space-y-6">
          <Glass className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <ProgressRing
                  value={sim.compatibilityScore}
                  size={88}
                  stroke={8}
                  label={
                    <span className="font-display text-xl font-semibold tabular-nums">
                      {sim.compatibilityScore}%
                    </span>
                  }
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyTone}`}
                    >
                      {sim.transitionDifficulty} Transition
                    </span>
                    <span className="text-xs text-muted-foreground">(Rule-Based Estimate)</span>
                  </div>
                  <h2 className="mt-1.5 font-display text-xl font-semibold">
                    {sim.currentLabel} → {sim.targetCareer.name}
                  </h2>
                  <p className="text-xs text-text-2">
                    {sim.targetCareer.industry} · {sim.targetCareer.environment}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={handleGenerateRoadmap}
                  disabled={creatingRoadmap}
                >
                  <Rocket className="size-4" />
                  {creatingRoadmap ? "Generating…" : "Generate My Transition Roadmap"}
                </Button>
                <Button variant="outline" onClick={handleSaveAnalysis} disabled={savingSim}>
                  <Save className="size-4" />
                  {savingSim ? "Saving…" : "Save Analysis"}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="glass-soft p-3.5">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5 text-cyan" /> Estimated Transition Time
                </p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                  {sim.estimatedWeeks} weeks
                </p>
                <p className="text-xs text-text-2">
                  ~{sim.estimatedTotalHours} study hrs at {weeklyHours} h/wk
                </p>
              </div>
              <div className="glass-soft p-3.5">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="size-3.5 text-lavender-bright" /> Estimated Learning Spend
                </p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                  {formatAmountFromInr(sim.estimatedExpensesInr.totalRecommended, "INR")}
                </p>
                <p className="text-xs text-text-2">
                  {budgetInr === 0
                    ? "100% free open track"
                    : `Within ₹${budgetInr.toLocaleString("en-IN")} cap`}
                </p>
              </div>
              <div className="glass-soft p-3.5">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 text-turquoise" /> Timeline Feasibility
                </p>
                <p className="mt-1 font-display text-xl font-semibold">
                  {sim.withinPreferredTimeline ? "On target" : "Needs extra pace"}
                </p>
                <p className="text-xs text-text-2">
                  {sim.withinPreferredTimeline
                    ? `Fits inside your ${preferredTimelineMonths}-month target`
                    : `Target is ${preferredTimelineMonths} mo; increase weekly hours or scope`}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="glass-soft space-y-2 p-4">
                <h3 className="text-sm font-medium text-turquoise">
                  Existing & Transferable Skills
                </h3>
                {sim.existingRelevantSkills.length === 0 && sim.transferableSkills.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add your current skills on the left to map direct overlaps.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {sim.existingRelevantSkills.map((sk) => (
                      <Chip key={sk} className="border-turquoise/40 bg-turquoise/10 text-xs">
                        ✓ {sk}
                      </Chip>
                    ))}
                    {sim.transferableSkills.map((sk) => (
                      <Chip key={sk} className="text-xs">
                        ↔ {sk}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-soft space-y-2 p-4">
                <h3 className="text-sm font-medium text-warning">
                  Missing Technical & Soft Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {sim.missingTechnicalSkills.map((sk) => (
                    <Chip key={sk} className="border-warning/35 bg-warning/10 text-xs">
                      {sk}
                    </Chip>
                  ))}
                  {sim.missingSoftSkills.map((sk) => (
                    <Chip key={sk} className="text-xs">
                      {sk} (soft)
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            {sim.missingQualifications.length > 0 && (
              <Notice tone="warn">
                <div className="flex items-start gap-2">
                  <GraduationCap className="mt-0.5 size-4 shrink-0" />
                  <div className="space-y-1 text-xs">
                    {sim.missingQualifications.map((mq) => (
                      <p key={mq}>{mq}</p>
                    ))}
                  </div>
                </div>
              </Notice>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="glass-soft space-y-2 p-4">
                <h3 className="text-sm font-medium text-cyan">Recommended Transition Sequence</h3>
                <ol className="space-y-2 text-xs text-text-2">
                  {sim.recommendedSequence.map((step) => (
                    <li key={step} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="glass-soft space-y-3 p-4">
                <div>
                  <h3 className="text-sm font-medium text-lavender-bright">
                    Recommended Projects & Starter Roles
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-xs text-text-2">
                    {sim.recommendedProjects.slice(0, 3).map((p) => (
                      <li key={p} className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-turquoise" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-glass-border pt-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Target entry-level titles
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {sim.entryLevelJobRoles.map((role) => (
                      <Chip key={role} className="px-2.5 py-0.5 text-xs">
                        {role}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {sim.estimatedExpensesInr.items.length > 0 && (
              <div className="glass-soft space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">
                    Optional Budget Breakdown ({sim.estimatedExpensesInr.freeTrackNote})
                  </h3>
                  <Link to="/planner" className="text-xs text-cyan hover:underline">
                    Customize in Budget Planner →
                  </Link>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {sim.estimatedExpensesInr.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.providerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-glass-border bg-secondary/70 p-2.5 text-xs transition hover:border-lavender/50"
                    >
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        ~₹{item.estimatedCostInr.toLocaleString("en-IN")} · {item.provider}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-glass-border pt-3 text-xs text-muted-foreground">
              <span>{sim.disclaimer}</span>
              <Link
                to="/careers/$id"
                params={{ id: sim.targetCareer.id }}
                className="inline-flex items-center gap-1 text-cyan hover:underline"
              >
                Explore full {sim.targetCareer.name} guide <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Glass>

          {/* Saved Transition History */}
          {s.transitions.length > 0 && (
            <Glass className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Saved Transition Analyses</h2>
                <Link
                  to="/roadmap"
                  className="inline-flex items-center gap-1 text-xs text-cyan hover:underline"
                >
                  <Map className="size-3.5" /> View Roadmaps
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {s.transitions.map((tr) => (
                  <div
                    key={tr.id}
                    className="glass-soft flex items-start justify-between gap-3 p-3.5"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium">
                        {tr.currentRole} → {tr.targetCareerName}
                      </p>
                      <p className="text-xs text-text-2 tabular-nums">
                        {tr.compatibilityScore}% fit · {tr.estimatedWeeks} wks · {tr.weeklyHours}{" "}
                        h/wk ·{" "}
                        {(tr.budgetInr ?? 0) === 0
                          ? "₹0 free"
                          : `₹${(tr.budgetInr ?? 0).toLocaleString("en-IN")}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void actions.removeTransition(tr.id)}
                      aria-label="Delete saved transition"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Glass>
          )}
        </div>
      </div>
    </AppShell>
  );
}
