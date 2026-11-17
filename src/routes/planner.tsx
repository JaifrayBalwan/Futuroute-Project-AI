import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Award,
  BookmarkPlus,
  ExternalLink,
  FolderKanban,
  Loader2,
  MapPlus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Chip,
  Glass,
  Notice,
  PageHeader,
  inputClass,
  selectClass,
} from "@/components/ui-kit";
import { useUser } from "@/lib/auth";
import {
  BUDGET_CATEGORY_LABEL,
  type BudgetCatalogItem,
  type BudgetItemCategory,
} from "@/lib/budget-catalog";
import { INDUSTRIES, getCareer } from "@/lib/careers";
import { useCareersCatalog } from "@/lib/careers-service";
import {
  buildPlan,
  buildRoadmap,
  recomputePlanWithItems,
  type Plan,
  type PlanInput,
} from "@/lib/engine";
import { actions, useApp, type SavedLearningPlan } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  validateSearch: (s: Record<string, unknown>) =>
    (typeof s["career"] === "string" ? { career: s["career"] } : {}) as { career?: string },
  head: () => ({
    meta: [
      { title: "Budget-to-Skill Planner — Futuroute" },
      {
        name: "description",
        content:
          "Plan how to start learning any of 260+ careers within your real budget in INR and weekly hours.",
      },
      { property: "og:title", content: "Budget-to-Skill Planner — Futuroute" },
      {
        property: "og:description",
        content: "Realistic INR spending and free-first learning plans tailored to your budget.",
      },
    ],
  }),
  component: Planner,
});

const PRESETS = [
  { v: 0, l: "₹0 — Free only" },
  { v: 500, l: "₹500" },
  { v: 1000, l: "₹1,000" },
  { v: 2000, l: "₹2,000" },
  { v: 5000, l: "₹5,000" },
  { v: 10000, l: "₹10,000" },
];

const CATEGORY_ORDER: BudgetItemCategory[] = [
  "paid_course",
  "paid_tool",
  "certification",
  "project_expense",
];

function formatInr(value: number): string {
  return `₹${Math.max(0, Math.round(value)).toLocaleString("en-IN")}`;
}

function Planner() {
  const search = Route.useSearch();
  const { profile, savedPlans } = useApp();
  const { user } = useUser();
  const { careers } = useCareersCatalog();
  const nav = useNavigate();

  const initialCareerId =
    search.career && getCareer(search.career, careers) ? search.career : "software-developer";

  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [careerSearch, setCareerSearch] = useState("");
  const [f, setF] = useState<PlanInput>({
    careerId: initialCareerId,
    level: "beginner",
    budget: profile?.budget ?? 0,
    hours: profile?.weeklyHours ?? 5,
    device: "laptop",
    format: "mixed",
    outcome: "fundamentals",
  });
  const [custom, setCustom] = useState(
    profile?.budget !== undefined && !PRESETS.some((p) => p.v === profile.budget),
  );
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [addingRoadmap, setAddingRoadmap] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  const filteredCareers = useMemo(() => {
    const q = careerSearch.trim().toLowerCase();
    return careers.filter((c) => {
      if (industryFilter !== "ALL" && c.industry !== industryFilter) return false;
      if (q && !`${c.name} ${c.industry} ${c.skills.join(" ")}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [careers, industryFilter, careerSearch]);

  const set = <K extends keyof PlanInput>(k: K, v: PlanInput[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setPlan(null);
  };

  const generate = () => {
    if (!Number.isFinite(f.budget) || f.budget < 0) return setErr("Budget must be ₹0 or more.");
    if (f.budget > 1000000) return setErr("Please enter a budget below ₹10,00,000.");
    if (f.hours < 1 || f.hours > 40) return setErr("Hours per week must be between 1 and 40.");
    setErr("");
    setLoading(true);
    setTimeout(() => {
      setPlan(buildPlan(f, careers));
      setLoading(false);
    }, 180);
  };

  const removeAllocatedItem = (itemId: string) => {
    if (!plan) return;
    const next = plan.allocatedItems.filter((x) => x.id !== itemId);
    setPlan(recomputePlanWithItems(plan, next));
  };

  const replaceAllocatedItem = (oldItem: BudgetCatalogItem) => {
    if (!plan) return;
    const availableCap = plan.remainingBalance + oldItem.estimatedCostInr;
    const activeIds = new Set(plan.allocatedItems.map((x) => x.id));
    const candidates = plan.catalogRanked.filter(
      (x) => !activeIds.has(x.id) && x.estimatedCostInr <= availableCap,
    );
    const sameCategory = candidates.find((x) => x.category === oldItem.category);
    const replacement = sameCategory ?? candidates[0];
    if (!replacement) {
      toast.info("No alternative item fits within your remaining budget.");
      return;
    }
    const next = plan.allocatedItems.map((x) => (x.id === oldItem.id ? replacement : x));
    setPlan(recomputePlanWithItems(plan, next));
    toast.success(`Replaced with ${replacement.name}`);
  };

  const addCatalogItem = (item: BudgetCatalogItem) => {
    if (!plan) return;
    if (item.estimatedCostInr > plan.remainingBalance) {
      toast.error("This option exceeds your remaining balance.");
      return;
    }
    const next = [...plan.allocatedItems, item];
    setPlan(recomputePlanWithItems(plan, next));
    toast.success(`Added ${item.name}`);
  };

  const handleSavePlan = async () => {
    if (!plan) return;
    setSavingPlan(true);
    try {
      await actions.saveBudgetPlan({
        careerId: plan.career.id,
        careerName: plan.career.name,
        level: (f.level as "beginner" | "some" | "comfortable") ?? "beginner",
        budget: plan.budgetTotal,
        recommendedSpend: plan.recommendedSpend,
        hours: f.hours,
        device: f.device,
        format: f.format,
        outcome: f.outcome,
        weeks: plan.weeks,
        itemIds: plan.allocatedItems.map((i) => i.id),
      });
      toast.success(
        user?.emailVerified
          ? `Saved ${formatInr(plan.budgetTotal)} plan to your account`
          : `Saved ${formatInr(plan.budgetTotal)} plan locally`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save learning plan");
    } finally {
      setSavingPlan(false);
    }
  };

  const loadSavedPlan = (saved: SavedLearningPlan) => {
    const nextInput: PlanInput = {
      careerId: saved.careerId,
      level: saved.level,
      budget: saved.budget,
      hours: saved.hours,
      device: saved.device || f.device,
      format: saved.format || f.format,
      outcome: saved.outcome || f.outcome,
    };
    setF(nextInput);
    setCustom(!PRESETS.some((p) => p.v === saved.budget));
    const base = buildPlan(nextInput, careers);
    const chosenItems = saved.itemIds
      .map((itemId) => base.catalogRanked.find((c) => c.id === itemId))
      .filter((x): x is BudgetCatalogItem => Boolean(x));
    setPlan(recomputePlanWithItems(base, chosenItems));
    toast.success(`Loaded plan for ${saved.careerName}`);
  };

  const addToRoadmap = async () => {
    const chosen = getCareer(f.careerId, careers);
    if (!chosen) return;
    setAddingRoadmap(true);
    try {
      const rm = buildRoadmap({ ...f }, careers);
      await actions.addRoadmap(rm, chosen.name);
      toast.success(
        user?.emailVerified
          ? `Added ${chosen.name} to your cloud roadmaps`
          : `Added ${chosen.name} roadmap locally`,
      );
      nav({ to: "/roadmap" });
    } finally {
      setAddingRoadmap(false);
    }
  };

  const spendPct =
    plan && plan.budgetTotal > 0
      ? Math.min(100, Math.round((plan.recommendedSpend / plan.budgetTotal) * 100))
      : 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Signature feature"
        title="Budget-to-Skill Planner"
        text="Enter your real INR budget and weekly hours. Free verified courses always anchor your foundation, while budgets above ₹0 allocate targeted paid courses, tools, certifications, and project materials."
      />

      <div className="grid gap-6 xl:grid-cols-[410px_1fr]">
        <div className="space-y-5">
          <Glass className="h-fit space-y-4">
            <div className="grid gap-2">
              <label htmlFor="ind-filter" className="text-xs font-medium text-text-2">
                Filter career selector by industry or name
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  id="ind-filter"
                  className={selectClass("h-10 text-xs")}
                  value={industryFilter}
                  onChange={(e) => {
                    const nextInd = e.target.value;
                    setIndustryFilter(nextInd);
                    const first = careers.find((c) => nextInd === "ALL" || c.industry === nextInd);
                    if (first) set("careerId", first.id);
                  }}
                >
                  <option value="ALL">All 20 Industries</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    aria-label="Search career list"
                    value={careerSearch}
                    onChange={(e) => setCareerSearch(e.target.value)}
                    placeholder="Quick search…"
                    className={inputClass("h-10 pl-8 pr-2 text-xs")}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="career" className="mb-1.5 block text-sm font-medium text-text-2">
                Target career ({filteredCareers.length} options)
              </label>
              <select
                id="career"
                className={selectClass()}
                value={f.careerId}
                onChange={(e) => set("careerId", e.target.value)}
              >
                {(filteredCareers.length ? filteredCareers : careers).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-text-2">
                Current skill level
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["beginner", "Complete beginner"],
                    ["some", "Some basics"],
                    ["comfortable", "Fairly comfortable"],
                  ] as const
                ).map(([v, l]) => (
                  <Chip key={v} active={f.level === v} onClick={() => set("level", v)}>
                    {l}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-text-2">
                Available budget (INR)
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Chip
                    key={p.v}
                    active={!custom && f.budget === p.v}
                    onClick={() => {
                      setCustom(false);
                      set("budget", p.v);
                    }}
                  >
                    {p.l}
                  </Chip>
                ))}
                <Chip active={custom} onClick={() => setCustom(true)}>
                  Custom
                </Chip>
              </div>
              <label htmlFor="budget" className="sr-only">
                Budget in rupees
              </label>
              <input
                id="budget"
                type="number"
                min={0}
                inputMode="numeric"
                value={f.budget}
                onChange={(e) => {
                  setCustom(true);
                  set("budget", Number(e.target.value));
                }}
                placeholder="Enter budget in ₹"
                className={inputClass("mt-2.5")}
              />
            </div>

            <div>
              <label htmlFor="hrs" className="mb-1.5 block text-sm font-medium text-text-2">
                Hours per week: <span className="font-semibold text-foreground">{f.hours} h</span>
              </label>
              <input
                id="hrs"
                type="range"
                min={1}
                max={30}
                value={f.hours}
                onChange={(e) => set("hours", Number(e.target.value))}
                className="w-full accent-[var(--cyan)]"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="dev" className="mb-1.5 block text-sm font-medium text-text-2">
                  Device
                </label>
                <select
                  id="dev"
                  className={selectClass()}
                  value={f.device}
                  onChange={(e) => set("device", e.target.value)}
                >
                  <option value="phone">Phone</option>
                  <option value="laptop">Laptop</option>
                  <option value="desktop">Desktop</option>
                </select>
              </div>
              <div>
                <label htmlFor="fmt" className="mb-1.5 block text-sm font-medium text-text-2">
                  Format
                </label>
                <select
                  id="fmt"
                  className={selectClass()}
                  value={f.format}
                  onChange={(e) => set("format", e.target.value)}
                >
                  <option value="video">Videos</option>
                  <option value="reading">Reading</option>
                  <option value="interactive">Interactive</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="out" className="mb-1.5 block text-sm font-medium text-text-2">
                Desired outcome
              </label>
              <select
                id="out"
                className={selectClass()}
                value={f.outcome}
                onChange={(e) => set("outcome", e.target.value)}
              >
                <option value="fundamentals">Understand the fundamentals</option>
                <option value="project">Complete a beginner project</option>
                <option value="portfolio">Build a small portfolio</option>
              </select>
            </div>

            {err && <Notice tone="warn">{err}</Notice>}
            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Building plan…
                </>
              ) : (
                <>
                  <Wallet className="size-4" /> Generate my spending & skill plan
                </>
              )}
            </Button>
          </Glass>

          {savedPlans.length > 0 && (
            <Glass className="space-y-3">
              <h2 className="font-display text-base font-semibold">
                Saved learning plans ({savedPlans.length})
              </h2>
              <ul className="space-y-2">
                {savedPlans.map((sp) => (
                  <li
                    key={sp.id}
                    className="glass-soft flex items-center justify-between gap-2 px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => loadSavedPlan(sp)}
                      className="min-w-0 flex-1 text-left hover:text-cyan"
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {sp.careerName} · {formatInr(sp.budget)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Est. spend {formatInr(sp.recommendedSpend)} · {sp.hours} h/wk · ~{sp.weeks}{" "}
                        wks
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete saved plan for ${sp.careerName}`}
                      onClick={() => void actions.removeBudgetPlan(sp.id)}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-warning"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </Glass>
          )}
        </div>

        {!plan ? (
          <Glass className="grid place-items-center text-center">
            <div className="max-w-md py-16">
              <h2 className="font-display text-2xl font-semibold">Your budget plan appears here</h2>
              <p className="mt-2 text-sm text-text-2">
                Choose any career across 20 industries and select your INR budget on the left (from
                ₹0 free-only up to ₹10,000+). We combine free foundations with realistic paid
                courses, tools, certifications, and project costs that fit your budget.
              </p>
            </div>
          </Glass>
        ) : (
          <div className="min-w-0 space-y-5">
            {/* Budget Summary Strip */}
            <Glass className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-cyan">
                    {plan.career.industry} · Estimated budget summary
                  </p>
                  <h2 className="font-display text-2xl font-semibold">{plan.career.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSavePlan}
                    disabled={savingPlan}
                    className="text-xs"
                  >
                    <BookmarkPlus className="size-4" />
                    {savingPlan ? "Saving…" : "Save Plan"}
                  </Button>
                  <Button
                    variant="soft"
                    onClick={generate}
                    className="text-xs"
                    title="Reset items to default recommended allocation"
                  >
                    <RefreshCw className="size-4" /> Regenerate
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="glass-soft p-4">
                  <p className="text-xs text-muted-foreground">Total available budget</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-foreground">
                    {formatInr(plan.budgetTotal)}
                  </p>
                </div>
                <div className="glass-soft p-4">
                  <p className="text-xs text-muted-foreground">
                    Estimated recommended spend{" "}
                    <span className="ml-1 rounded bg-lavender/20 px-1.5 py-0.5 text-[10px] text-lavender-bright">
                      Estimated
                    </span>
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-cyan">
                    {formatInr(plan.recommendedSpend)}
                  </p>
                </div>
                <div className="glass-soft p-4">
                  <p className="text-xs text-muted-foreground">Remaining balance</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-success">
                    {formatInr(plan.remainingBalance)}
                  </p>
                </div>
              </div>

              {plan.budgetTotal > 0 && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Budget allocation ({spendPct}%)</span>
                    <span>Strictly within your {formatInr(plan.budgetTotal)} cap</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${spendPct}%` }}
                    />
                  </div>
                </div>
              )}

              <Notice tone={plan.withinBudget ? "success" : "warn"}>{plan.budgetNote}</Notice>
              {plan.warnings.map((w) => (
                <Notice key={w} tone="warn">
                  {w}
                </Notice>
              ))}
            </Glass>

            {/* Skills & Free Verified Resources */}
            <div className="grid gap-5 md:grid-cols-2">
              <Glass>
                <h2 className="font-display text-lg font-semibold">
                  1 · Skills & concepts to learn
                </h2>
                <ol className="mt-3 space-y-2 text-sm text-text-2">
                  {plan.learn.map((s, i) => (
                    <li key={s} className="flex gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs text-lavender-bright">
                        {i + 1}
                      </span>
                      <span className="min-w-0 break-words">{s}</span>
                    </li>
                  ))}
                </ol>
              </Glass>

              <Glass>
                <h2 className="font-display text-lg font-semibold">
                  2 · Core free verified resources (₹0)
                </h2>
                <ul className="mt-3 space-y-2">
                  {plan.free.map((r) => (
                    <li key={r.url}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="glass-soft flex items-center justify-between gap-2 px-3 py-2.5 text-sm hover:border-cyan/40"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">{r.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {r.cost} · {r.note}
                          </span>
                        </span>
                        <ExternalLink className="size-4 shrink-0 text-cyan" />
                      </a>
                    </li>
                  ))}
                </ul>
              </Glass>
            </div>

            {/* Allocated INR Spending Plan */}
            <Glass className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    3 · Tailored INR spending allocation
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Prices are marked Estimated in INR. Remove or swap any item to recalculate your
                    remaining balance instantly.
                  </p>
                </div>
                <Chip className="text-xs">
                  {plan.allocatedItems.length} item{plan.allocatedItems.length === 1 ? "" : "s"}{" "}
                  selected
                </Chip>
              </div>

              {plan.budgetTotal === 0 ? (
                <Notice tone="info">
                  At ₹0, your plan uses 100% free verified resources above. Increase your budget if
                  you want to allocate optional paid courses, kits, or exam certificates.
                </Notice>
              ) : plan.allocatedItems.length === 0 ? (
                <Notice tone="info">
                  No paid items currently allocated from your {formatInr(plan.budgetTotal)} budget.
                  Add any compatible option from Section 4 below, or start free right away.
                </Notice>
              ) : (
                <div className="space-y-4">
                  {CATEGORY_ORDER.map((cat) => {
                    const items = plan.allocatedItems.filter((x) => x.category === cat);
                    if (items.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-lavender-bright">
                          {BUDGET_CATEGORY_LABEL[cat]}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="glass-soft flex flex-col justify-between gap-3 p-4"
                            >
                              <div className="min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <h3 className="font-medium text-foreground">{item.name}</h3>
                                  <span className="shrink-0 rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-0.5 text-xs font-medium text-cyan">
                                    {formatInr(item.estimatedCostInr)} · Estimated
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.provider}</p>
                                <p className="text-sm text-text-2">{item.whyRecommended}</p>
                                <p className="text-xs text-muted-foreground">{item.priceNote}</p>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-glass-border pt-3">
                                <a
                                  href={item.providerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan hover:underline"
                                >
                                  Verify price <ExternalLink className="size-3" />
                                </a>
                                <div className="flex gap-1.5">
                                  <Button
                                    variant="outline"
                                    className="h-8 min-h-8 px-2.5 text-xs"
                                    onClick={() => replaceAllocatedItem(item)}
                                  >
                                    Replace
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="h-8 min-h-8 px-2.5 text-xs text-warning hover:text-warning"
                                    onClick={() => removeAllocatedItem(item.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {plan.overBudgetOptions.length > 0 && (
                <div className="border-t border-glass-border pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    4 · Optional upgrades & future items (never auto-added beyond budget)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {plan.overBudgetOptions.map((opt) => {
                      const canAfford = opt.estimatedCostInr <= plan.remainingBalance;
                      return (
                        <div
                          key={opt.id}
                          className="glass-soft flex flex-col justify-between gap-2 p-3.5 text-sm"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-foreground">{opt.name}</span>
                              <span className="shrink-0 text-xs font-medium text-lavender-bright">
                                {formatInr(opt.estimatedCostInr)} (Est.)
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-text-2">{opt.whyRecommended}</p>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-muted-foreground">
                              {BUDGET_CATEGORY_LABEL[opt.category]}
                            </span>
                            {canAfford ? (
                              <Button
                                variant="soft"
                                className="h-8 min-h-8 px-2.5 text-xs"
                                onClick={() => addCatalogItem(opt)}
                              >
                                <Plus className="size-3.5" /> Add ({formatInr(opt.estimatedCostInr)}
                                )
                              </Button>
                            ) : (
                              <span
                                className={cn(
                                  "rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[11px] text-warning",
                                )}
                              >
                                Exceeds remaining budget
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Glass>

            {/* Qualifications & Projects */}
            <div className="grid gap-5 md:grid-cols-2">
              <Glass>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Award className="size-4 text-cyan" /> 5 · Relevant qualifications &
                  certifications
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm text-text-2">
                  {plan.certifications.map((cert) => (
                    <li key={cert}>• {cert}</li>
                  ))}
                </ul>
              </Glass>
              <Glass>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <FolderKanban className="size-4 text-lavender-bright" /> 6 · Recommended starter
                  projects
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm text-text-2">
                  {plan.projects.map((proj) => (
                    <li key={proj}>• {proj}</li>
                  ))}
                </ul>
              </Glass>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Glass>
                <h2 className="font-display text-lg font-semibold">7 · Estimated duration</h2>
                <p className="mt-3 font-display text-3xl">~{plan.weeks} weeks</p>
                <p className="mt-1 text-sm text-text-2">{plan.schedule}</p>
              </Glass>
              <Glass className="flex flex-col justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    8 · Save as a trackable roadmap
                  </h2>
                  <p className="mt-1 text-sm text-text-2">
                    Creates a phased weekly checklist in My Roadmap without overwriting your
                    existing roadmaps.
                  </p>
                </div>
                <Button onClick={addToRoadmap} disabled={addingRoadmap}>
                  <MapPlus className="size-4" />
                  {addingRoadmap ? "Adding…" : "Add Plan to My Roadmap"}
                </Button>
              </Glass>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
