import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Filter,
  Globe,
  Info,
  MapPin,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  Chip,
  EmptyState,
  Glass,
  Notice,
  PageHeader,
  btnClass,
  inputClass,
  selectClass,
} from "@/components/ui-kit";
import { INDUSTRIES, type Career } from "@/lib/careers";
import { useCareersCatalog } from "@/lib/careers-service";
import {
  OPPORTUNITIES_CATALOG,
  OPPORTUNITY_CATEGORIES,
  recommendOpportunities,
  type Opportunity,
  type OpportunityCategory,
  type OpportunityCost,
  type OpportunityDifficulty,
  type OpportunityMode,
} from "@/lib/opportunities";
import { actions, useApp, type OpportunityTrackStatus } from "@/lib/store";

export const Route = createFileRoute("/opportunities")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { category?: string | undefined; field?: string | undefined } => {
    const res: { category?: string | undefined; field?: string | undefined } = {};
    if (typeof search["category"] === "string") res.category = search["category"];
    if (typeof search["field"] === "string") res.field = search["field"];
    return res;
  },
  head: () => ({
    meta: [
      { title: "Opportunity Finder — Futuroute" },
      {
        name: "description",
        content:
          "Browse curated internships, free online courses, scholarships, hackathons, competitions, certifications, and entry-level job portals matched to your career roadmap.",
      },
      { property: "og:title", content: "Opportunity Finder — Futuroute" },
      {
        property: "og:description",
        content: "Verified ongoing portals & periodic cohorts personalized for students.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

const MODES: OpportunityMode[] = ["Online", "Remote", "Hybrid", "On-site"];
const COSTS: OpportunityCost[] = [
  "Free",
  "Free audit / Paid cert",
  "Paid / Stipend-backed",
  "Varies",
];
const DIFFICULTIES: OpportunityDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

const STATUS_LABELS: Record<OpportunityTrackStatus, string> = {
  saved: "Saved",
  planning: "Planning to apply",
  applied: "Applied",
};

function OpportunityCard({
  opp,
  savedEntry,
}: {
  opp: Opportunity;
  savedEntry?: { status: OpportunityTrackStatus } | undefined;
}) {
  const handleSave = (status: OpportunityTrackStatus = "saved") => {
    actions.saveOpportunity(opp.id, opp.title, opp.category, status);
    toast.success(
      savedEntry ? `Marked as "${STATUS_LABELS[status]}"` : `Saved "${opp.title}" to tracker`,
    );
  };

  return (
    <Glass className="flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-lavender/40 bg-lavender/15 px-2.5 py-0.5 text-[11px] font-medium text-lavender-bright">
              {opp.category}
            </span>
            <span className="rounded-full border border-cyan/35 bg-cyan/10 px-2.5 py-0.5 text-[11px] text-cyan">
              {opp.listingType}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Verified {opp.lastVerified}</span>
        </div>

        <div>
          <h3 className="font-display text-lg font-semibold leading-snug">{opp.title}</h3>
          <p className="mt-0.5 text-xs font-medium text-cyan">{opp.provider}</p>
        </div>

        <p className="text-sm leading-relaxed text-text-2">{opp.description}</p>

        <div className="grid gap-1.5 rounded-xl border border-glass-border bg-secondary/60 p-3 text-xs text-text-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-cyan" /> {opp.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe className="size-3.5 text-lavender-bright" /> {opp.mode}
            </span>
            <span
              className={
                opp.cost === "Free" ? "font-medium text-turquoise" : "font-medium text-foreground"
              }
            >
              {opp.cost}
            </span>
            <span>Level: {opp.difficulty}</span>
          </div>
          <p>
            <span className="text-muted-foreground">Eligibility:</span> {opp.eligibility}
          </p>
          <p>
            <span className="text-muted-foreground">Schedule / Cycle:</span> {opp.scheduleNote}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {opp.requiredSkills.map((sk) => (
            <Chip key={sk} className="px-2.5 py-0.5 text-xs">
              {sk}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-glass-border pt-3">
        <a
          href={opp.url}
          target="_blank"
          rel="noreferrer"
          className={btnClass("primary", "h-9 min-h-9 px-3.5 text-xs")}
        >
          Visit Official Portal <ExternalLink className="size-3.5" />
        </a>

        {savedEntry ? (
          <div className="flex items-center gap-1.5">
            <select
              aria-label={`Application status for ${opp.title}`}
              value={savedEntry.status}
              onChange={(e) => handleSave(e.target.value as OpportunityTrackStatus)}
              className={selectClass("h-9 w-auto py-1 text-xs")}
            >
              <option value="saved">Saved</option>
              <option value="planning">Planning to apply</option>
              <option value="applied">Applied</option>
            </select>
            <button
              type="button"
              onClick={() => {
                actions.removeOpportunity(opp.id);
                toast.info("Removed from saved opportunities");
              }}
              aria-label="Remove opportunity"
              className="grid size-9 place-items-center rounded-xl border border-glass-border bg-secondary text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleSave("saved")}
            className={btnClass("outline", "h-9 min-h-9 px-3 text-xs")}
          >
            <Bookmark className="size-3.5" /> Save & Track
          </button>
        )}
      </div>
    </Glass>
  );
}

function OpportunitiesPage() {
  const s = useApp();
  const { careers } = useCareersCatalog();
  const search = Route.useSearch();

  const [tab, setTab] = useState<"all" | "tracked">("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | OpportunityCategory>(() =>
    OPPORTUNITY_CATEGORIES.includes(search.category as OpportunityCategory)
      ? (search.category as OpportunityCategory)
      : "ALL",
  );
  const [field, setField] = useState<string>(() => search.field || "ALL");
  const [mode, setMode] = useState<"ALL" | OpportunityMode>("ALL");
  const [cost, setCost] = useState<"ALL" | OpportunityCost>("ALL");
  const [difficulty, setDifficulty] = useState<"ALL" | OpportunityDifficulty>("ALL");
  const [freeOnly, setFreeOnly] = useState(false);

  const savedCareersList = useMemo(
    () =>
      s.saved.map((id) => careers.find((c) => c.id === id)).filter((c): c is Career => Boolean(c)),
    [s.saved, careers],
  );

  const recommended = useMemo(
    () =>
      recommendOpportunities(
        OPPORTUNITIES_CATALOG,
        s.profile,
        savedCareersList,
        s.roadmap,
        careers,
      ).slice(0, 3),
    [s.profile, savedCareersList, s.roadmap, careers],
  );

  const savedMap = useMemo(() => {
    const m = new Map<string, { status: OpportunityTrackStatus }>();
    for (const item of s.savedOpportunities) m.set(item.opportunityId, { status: item.status });
    return m;
  }, [s.savedOpportunities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OPPORTUNITIES_CATALOG.filter((o) => {
      if (tab === "tracked" && !savedMap.has(o.id)) return false;
      if (category !== "ALL" && o.category !== category) return false;
      if (field !== "ALL" && !o.fields.includes(field as Career["industry"])) return false;
      if (mode !== "ALL" && o.mode !== mode) return false;
      if (cost !== "ALL" && o.cost !== cost) return false;
      if (difficulty !== "ALL" && o.difficulty !== difficulty) return false;
      if (freeOnly && o.cost !== "Free") return false;
      if (q) {
        const hay =
          `${o.title} ${o.provider} ${o.description} ${o.category} ${o.fields.join(" ")} ${o.requiredSkills.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tab, savedMap, category, field, mode, cost, difficulty, freeOnly, query]);

  const resetFilters = () => {
    setQuery("");
    setCategory("ALL");
    setField("ALL");
    setMode("ALL");
    setCost("ALL");
    setDifficulty("ALL");
    setFreeOnly(false);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Opportunity Finder"
        title="Real portals & programs matched to your path"
        text="Discover internships, free online courses, government scholarships, hackathons, certifications, projects, and fresher job gateways across 10 curated categories."
      >
        <div className="flex flex-wrap gap-2">
          <Chip active={tab === "all"} onClick={() => setTab("all")}>
            All Portals ({OPPORTUNITIES_CATALOG.length})
          </Chip>
          <Chip active={tab === "tracked"} onClick={() => setTab("tracked")}>
            <CheckCircle2 className="size-3.5" /> Saved & Tracked ({s.savedOpportunities.length})
          </Chip>
        </div>
      </PageHeader>

      <div className="mb-6">
        <Notice tone="info">
          <div className="flex items-start gap-2.5 text-xs">
            <Info className="mt-0.5 size-4 shrink-0 text-cyan" />
            <span>
              <strong className="text-foreground">Verification & Schedule Notice:</strong> All
              listings below link directly to official, verified ongoing portals or periodic
              academic cohorts (Last verified: Nov 2026). Futuroute never fabricates fake company
              openings or synthetic deadlines — always confirm active registration dates on each
              provider’s official portal.
            </span>
          </div>
        </Notice>
      </div>

      {/* Personalized Recommendations */}
      {tab === "all" && recommended.length > 0 && (
        <section className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                <Sparkles className="size-5 text-cyan" /> Recommended for your path
              </h2>
              <p className="text-xs text-muted-foreground">
                Prioritized from your{" "}
                {s.roadmap
                  ? `active roadmap (${s.roadmap.title})`
                  : savedCareersList.length > 0
                    ? `saved careers (${savedCareersList
                        .map((c) => c.name)
                        .slice(0, 2)
                        .join(", ")})`
                    : "profile interests & budget"}
                .
              </p>
            </div>
            {!s.profile && (
              <Link to="/profile" className="text-xs text-cyan hover:underline">
                Complete Profile to refine recommendations →
              </Link>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {recommended.map((opp) => (
              <OpportunityCard key={`rec-${opp.id}`} opp={opp} savedEntry={savedMap.get(opp.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Categories & Filters */}
      <Glass className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Filter className="size-4 text-lavender-bright" /> Filter by Category & Requirements
          </p>
          <div className="flex items-center gap-2">
            <Chip active={freeOnly} onClick={() => setFreeOnly(!freeOnly)} className="text-xs">
              Free Only
            </Chip>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-text-2 underline-offset-4 hover:text-foreground hover:underline"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip active={category === "ALL"} onClick={() => setCategory("ALL")} className="text-xs">
            All Categories
          </Chip>
          {OPPORTUNITY_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
              className="text-xs"
            >
              {cat}
            </Chip>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills, providers (SWAYAM, AICTE, Devpost)…"
              className={inputClass("pl-9")}
            />
          </div>
          <select
            aria-label="Filter by career field"
            value={field}
            onChange={(e) => setField(e.target.value)}
            className={selectClass()}
          >
            <option value="ALL">All Career Fields</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as "ALL" | OpportunityMode)}
            className={selectClass()}
          >
            <option value="ALL">All Modes</option>
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Filter by cost"
              value={cost}
              onChange={(e) => setCost(e.target.value as "ALL" | OpportunityCost)}
              className={selectClass("px-2 text-xs")}
            >
              <option value="ALL">Any Cost</option>
              {COSTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "ALL" | OpportunityDifficulty)}
              className={selectClass("px-2 text-xs")}
            >
              <option value="ALL">Any Level</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Glass>

      {/* Opportunity Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-5" />}
          title={
            tab === "tracked"
              ? "No saved or tracked opportunities yet"
              : "No opportunities match your active filters"
          }
          text={
            tab === "tracked"
              ? "Click “Save & Track” on any portal in the All Portals tab to track your applications here."
              : "Try widening your category, mode, or field selection."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} savedEntry={savedMap.get(opp.id)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
