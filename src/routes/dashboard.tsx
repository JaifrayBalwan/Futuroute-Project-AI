import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Activity as ActIcon,
  ArrowLeftRight,
  ArrowRight,
  Bookmark,
  Briefcase,
  Compass,
  Database,
  Gauge,
  GitCompareArrows,
  IndianRupee,
  LogIn,
  Map,
  Plus,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CompatibilityBadge } from "@/components/CompatibilityCard";
import { RouteMap, SaveButton } from "@/components/CareerParts";
import {
  Button,
  Chip,
  EmptyState,
  Glass,
  Notice,
  ProgressRing,
  btnClass,
  inputClass,
  selectClass,
} from "@/components/ui-kit";
import { friendlyAuthError, isUserAdmin, resendVerificationEmail, useUser } from "@/lib/auth";
import { formatAmountFromInr, formatRangeFromInr, getCareerInsight } from "@/lib/career-insights";
import { INDUSTRIES, getCareer, type Career, type Industry } from "@/lib/careers";
import {
  saveSingleCareerToFirestore,
  seedAllCareersToFirestore,
  useCareersCatalog,
} from "@/lib/careers-service";
import { computeCompatibility } from "@/lib/compatibility";
import { roadmapProgress, useApp } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Futuroute" },
      {
        name: "description",
        content:
          "Your personalised profile summary, saved career folders, comparisons, roadmaps and challenges.",
      },
      { property: "og:title", content: "My Dashboard — Futuroute" },
      { property: "og:description", content: "Track your career exploration progress." },
    ],
  }),
  component: Dashboard,
});

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1
    ? "just now"
    : m < 60
      ? `${m} min ago`
      : m < 1440
        ? `${Math.round(m / 60)} h ago`
        : `${Math.round(m / 1440)} d ago`;
};

function AdminCatalogPanel({
  totalCount,
  onUpdated,
}: {
  totalCount: number;
  onUpdated: () => Promise<void>;
}) {
  const [seeding, setSeeding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<Industry>("Technology & IT");
  const [subcategory, setSubcategory] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [skillsRaw, setSkillsRaw] = useState("");

  const handleSeedAll = async () => {
    setSeeding(true);
    try {
      const count = await seedAllCareersToFirestore();
      await onUpdated();
      toast.success(`Synced ${count} careers across 20 industries to Cloud Firestore`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to seed career catalog");
    } finally {
      setSeeding(false);
    }
  };

  const handleAddCareer = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortDesc.trim()) return;
    setSaving(true);
    const id = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const customCareer: Career = {
      id,
      name: name.trim(),
      industry,
      subcategory: subcategory.trim() || industry,
      short: shortDesc.trim(),
      hue: "cyan",
      day: shortDesc.trim(),
      responsibilities: [
        `Deliver core ${subcategory.trim() || industry} outcomes`,
        "Collaborate with peers and domain mentors",
        "Review work quality and gather user or stakeholder feedback",
      ],
      skills: skills.length ? skills : ["Problem-solving", "Communication", "Domain research"],
      capabilities: ["problem_solving", "communication", "analytical"],
      interests: ["technology"],
      subjects: ["English", "Mathematics"],
      pathways: [
        "Relevant undergraduate or diploma pathway",
        "Self-directed portfolio + verified open courses",
      ],
      altRoutes: ["Skill portfolio, internships, and mentorship"],
      projects: [`Starter ${name.trim()} mini-case study`],
      commitment: "Consistent weekly practice builds foundational confidence.",
      commitmentLevel: 3,
      estimatedCostNote: "Can begin free online; optional exam or workshop fees vary.",
      progression: [`Junior ${name.trim()}`, name.trim(), `Senior ${name.trim()}`],
      freelanceOpportunity:
        "Independent consulting and project-based work available with portfolio experience.",
      entrepreneurshipOpportunity:
        "Strong potential to launch a specialist studio or service after industry experience.",
      entryLevelOpportunities: "Junior trainee, intern, and coordinator openings.",
      pros: ["Growing real-world applicability", "Clear starter skill path"],
      cons: ["Requires ongoing curiosity and practice", "Competition for top roles"],
      resources: [
        {
          name: "SWAYAM India",
          url: "https://swayam.gov.in/",
          cost: "Free",
          note: "National open MOOC curriculum across disciplines",
        },
      ],
      trial: `Spend 20 minutes researching one real problem solved by a ${name.trim()} and outline a first step.`,
      challengeId: "software",
      emerging: true,
      environment: "Hybrid / collaborative",
      minEducation: "Class 12",
      budgetTier: 0,
      tags: [industry.toLowerCase(), ...skills.map((s) => s.toLowerCase())],
    };

    try {
      await saveSingleCareerToFirestore(customCareer);
      await onUpdated();
      toast.success(`Saved "${customCareer.name}" to Firestore /careers`);
      setName("");
      setSubcategory("");
      setShortDesc("");
      setSkillsRaw("");
      setShowAdd(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save custom career");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Glass className="mb-6 border-cyan/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan/15 text-cyan">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Admin Career Catalog Manager</h2>
            <p className="text-xs text-muted-foreground">
              {totalCount} careers active across 20 industries · Authorized admin access
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSeedAll} disabled={seeding}>
            <Database className="size-4" />{" "}
            {seeding ? "Syncing 260 careers…" : "Seed / Sync 260 Careers to Firestore"}
          </Button>
          <Button variant="soft" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="size-4" /> {showAdd ? "Close form" : "Add / Update Career"}
          </Button>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddCareer}
          className="mt-4 grid gap-3 border-t border-glass-border pt-4 sm:grid-cols-2"
        >
          <label className="grid gap-1 text-xs">
            Career Name *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Drone Cinematographer"
              className={inputClass("h-10")}
              required
            />
          </label>
          <label className="grid gap-1 text-xs">
            Industry *
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as Industry)}
              className={selectClass("h-10")}
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            Subcategory
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Aerial Media"
              className={inputClass("h-10")}
            />
          </label>
          <label className="grid gap-1 text-xs">
            Key Skills (comma-separated)
            <input
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
              placeholder="e.g. Flight planning, Framing, Safety"
              className={inputClass("h-10")}
            />
          </label>
          <label className="grid gap-1 text-xs sm:col-span-2">
            Short Description *
            <input
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Clear 1-sentence summary of what the career does."
              className={inputClass("h-10")}
              required
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Career to Firestore"}
            </Button>
          </div>
        </form>
      )}
    </Glass>
  );
}

function Dashboard() {
  const { user, loading, refreshUser } = useUser();
  const s = useApp();
  const { careers, refresh } = useCareersCatalog();

  if (!loading && !user) {
    return (
      <AppShell greeting>
        <Glass className="mx-auto max-w-2xl space-y-5">
          <h2 className="font-display text-2xl font-semibold">
            Sign in for your personal dashboard
          </h2>
          <p className="text-text-2">
            Sign in with Google or email to unlock your protected workspace — saved career folders,
            discovery reports, side-by-side comparisons, and multi-phase roadmaps synced to Cloud
            Firestore.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/auth" search={{ next: "/dashboard" }} className={btnClass("primary")}>
              <LogIn className="size-4" /> Sign in / Create account
            </Link>
            <Link to="/discover" className={btnClass("outline")}>
              <Compass className="size-4" /> Browse 260+ Careers as Guest
            </Link>
          </div>
        </Glass>
      </AppShell>
    );
  }

  const p = roadmapProgress(s.roadmap);
  const challenges = Object.values(s.challenges).filter((c) => c.answer);
  const reflections = Object.entries(s.challenges).filter(([, c]) => c.enjoy || c.reflection);
  const firstVisit =
    s.saved.length === 0 &&
    !s.roadmap &&
    challenges.length === 0 &&
    s.comparedCount === 0 &&
    !s.discovery &&
    s.savedOpportunities.length === 0;
  const next = s.roadmap?.tasks.find((t) => !t.done);
  const roadCareer = s.roadmap ? getCareer(s.roadmap.careerId, careers) : undefined;

  // Compute Top Career Matches & Average Compatibility from discovery/saved/profile
  const candidatePool: Career[] = (() => {
    const ids = new Set<string>([
      ...(s.discovery?.results ?? []),
      ...s.saved,
      ...(roadCareer ? [roadCareer.id] : []),
    ]);
    const matched = Array.from(ids)
      .map((id) => getCareer(id, careers))
      .filter((c): c is Career => Boolean(c));
    if (matched.length >= 3) return matched;
    const extras = careers.filter((c) => !ids.has(c.id)).slice(0, Math.max(6, 12 - matched.length));
    return [...matched, ...extras];
  })();

  const scoredCandidates = candidatePool
    .map((career) => ({
      career,
      compat: computeCompatibility(career, s.profile, s.discovery?.answers),
    }))
    .sort((a, b) => b.compat.score - a.compat.score);

  const topMatches = scoredCandidates.slice(0, 3);
  const avgCompatibility =
    topMatches.length > 0
      ? Math.round(topMatches.reduce((acc, item) => acc + item.compat.score, 0) / topMatches.length)
      : 0;

  const appliedCount = s.savedOpportunities.filter((o) => o.status === "applied").length;
  const planningCount = s.savedOpportunities.filter((o) => o.status === "planning").length;

  const primaryFocusCareer = roadCareer ?? topMatches[0]?.career;
  const primaryInsight = primaryFocusCareer ? getCareerInsight(primaryFocusCareer) : undefined;

  const handleResend = async () => {
    try {
      await resendVerificationEmail();
      toast.success("Verification email sent");
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  };

  return (
    <AppShell greeting>
      {user && !user.emailVerified && (
        <div className="mb-6">
          <Notice tone="warn">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Please verify your email (
                <span className="font-medium text-foreground">{user.email}</span>) to enable Cloud
                Firestore saving across devices.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-8 min-h-8 px-2.5 text-xs"
                  onClick={handleResend}
                >
                  Resend verification email
                </Button>
                <Button
                  variant="soft"
                  className="h-8 min-h-8 px-2.5 text-xs"
                  onClick={() => void refreshUser()}
                >
                  I’ve verified — refresh
                </Button>
              </div>
            </div>
          </Notice>
        </div>
      )}

      {isUserAdmin(user) && <AdminCatalogPanel totalCount={careers.length} onUpdated={refresh} />}

      {firstVisit && (
        <Glass className="mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Welcome to Futuroute 👋</h2>
              <p className="mt-1 text-text-2">
                Pick a starting point — complete your onboarding profile, run guided career
                discovery, or explore 260+ careers across 20 industries.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/onboarding" className={btnClass("primary")}>
                <UserCheck className="size-4" /> Complete profile setup
              </Link>
              <Link to="/discover" className={btnClass("outline")}>
                <Compass className="size-4" /> Start career discovery
              </Link>
              <Link to="/simulator" className={btnClass("outline")}>
                <ArrowLeftRight className="size-4" /> Simulate career switch
              </Link>
              <Link to="/opportunities" className={btnClass("outline")}>
                <Briefcase className="size-4" /> Opportunity finder
              </Link>
            </div>
          </div>
        </Glass>
      )}

      {s.profile && (
        <Glass className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-cyan">
                Personalised Profile
              </p>
              <h2 className="font-display text-xl font-semibold">
                {s.profile.displayName || user?.displayName || "Explorer"}
                {s.profile.educationLevel ? ` · ${s.profile.educationLevel}` : ""}
              </h2>
              <p className="text-sm text-text-2">
                Budget ₹{s.profile.budget.toLocaleString("en-IN")} · {s.profile.weeklyHours} h/week
                {s.profile.environment ? ` · ${s.profile.environment}` : ""}
                {s.profile.preferredWorkLocation ? ` · ${s.profile.preferredWorkLocation}` : ""}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.profile.interests.slice(0, 8).map((intId) => (
                  <Chip key={intId} className="px-2.5 py-0.5 text-xs">
                    {intId}
                  </Chip>
                ))}
              </div>
            </div>
            <Link to="/profile" className={btnClass("outline", "text-xs")}>
              Edit profile & preferences
            </Link>
          </div>
        </Glass>
      )}

      {/* 6 Integrated Summary & Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* 1. Top Career Matches */}
        <Glass className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-2">Top Career Matches</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-lavender-bright">
                <Compass className="size-4" />
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {topMatches.map(({ career }) => (
                <Link
                  key={career.id}
                  to="/careers/$id"
                  params={{ id: career.id }}
                  className="flex items-center justify-between gap-2 rounded-xl border border-glass-border bg-secondary/60 px-3 py-2 text-xs transition hover:border-lavender/50"
                >
                  <span className="truncate font-medium text-foreground">{career.name}</span>
                  <CompatibilityBadge
                    career={career}
                    profile={s.profile}
                    fallbackAnswers={s.discovery?.answers}
                  />
                </Link>
              ))}
            </div>
          </div>
          <Link
            to="/discover"
            className="mt-3 inline-flex items-center gap-1 text-xs text-cyan hover:underline"
          >
            {s.discovery ? "Refine career discovery" : "Take full discovery questionnaire"}{" "}
            <ArrowRight className="size-3.5" />
          </Link>
        </Glass>

        {/* 2. Average Career Compatibility */}
        <Glass className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-2">Average Career Compatibility</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-cyan">
                <Gauge className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
              {avgCompatibility}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Rule-based estimate across your top {topMatches.length} matches & profile fields.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link to="/profile" className="text-cyan hover:underline">
              Update profile inputs →
            </Link>
            <Link to="/simulator" className="text-lavender-bright hover:underline">
              Simulate switch →
            </Link>
          </div>
        </Glass>

        {/* 3. Active Career Roadmap */}
        <Glass className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-2">Active Career Roadmap</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-lavender-bright">
                <Map className="size-4" />
              </span>
            </div>
            <p className="mt-3 truncate font-display text-xl font-semibold">
              {s.roadmap ? roadCareer?.name || s.roadmap.title : "No roadmap active yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.roadmap
                ? `Phase ${p.phase} of 5 · ${s.roadmaps.length} roadmap${s.roadmaps.length === 1 ? "" : "s"} saved`
                : "Build a personalized 5-phase career path from any career or simulator."}
            </p>
          </div>
          <Link
            to="/roadmap"
            className="mt-3 inline-flex items-center gap-1 text-xs text-cyan hover:underline"
          >
            {s.roadmap ? "Open 5-Phase Roadmap" : "Create roadmap"}{" "}
            <ArrowRight className="size-3.5" />
          </Link>
        </Glass>

        {/* 4. Learning Progress */}
        <Glass className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-2">Learning Progress</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-turquoise">
                <TrendingUp className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{p.pct}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.roadmap
                ? `${p.done} of ${p.total} milestones done · ${s.roadmap.hours} h/wk pace`
                : `${s.saved.length} careers saved · ${challenges.length}/8 challenges tried`}
            </p>
          </div>
          <Link
            to={s.roadmap ? "/roadmap" : "/planner"}
            className="mt-3 inline-flex items-center gap-1 text-xs text-cyan hover:underline"
          >
            {s.roadmap ? "Tick next milestone" : "Build budget-to-skill plan"}{" "}
            <ArrowRight className="size-3.5" />
          </Link>
        </Glass>

        {/* 5. Saved Opportunities */}
        <Glass className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-2">Saved Opportunities</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-cyan">
                <Briefcase className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
              {s.savedOpportunities.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.savedOpportunities.length > 0
                ? `${planningCount} planning · ${appliedCount} applied across verified portals`
                : "Browse internships, scholarships, free courses, and hackathons."}
            </p>
          </div>
          <Link
            to="/opportunities"
            className="mt-3 inline-flex items-center gap-1 text-xs text-cyan hover:underline"
          >
            Explore Opportunity Finder <ArrowRight className="size-3.5" />
          </Link>
        </Glass>

        {/* 6. Financial Expectation Overview */}
        <Glass className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-2">Financial Expectation Overview</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-lavender-bright">
                <IndianRupee className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold tabular-nums">
              {s.profile?.expectedStartingSalaryInr
                ? `${formatAmountFromInr(s.profile.expectedStartingSalaryInr, "INR")} target`
                : primaryInsight
                  ? formatRangeFromInr(primaryInsight.indiaEntryInr, "INR")
                  : "Set goal"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {primaryFocusCareer && primaryInsight
                ? `${primaryFocusCareer.name} India entry benchmark: ${formatRangeFromInr(primaryInsight.indiaEntryInr, "INR")} · Edu ~₹${Math.round(primaryInsight.educationCostInr[0] / 1000)}k–₹${Math.round(primaryInsight.educationCostInr[1] / 1000)}k`
                : "Add optional starting salary expectations in Profile to compare against career bands."}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link to="/profile" className="text-cyan hover:underline">
              Set financial goal →
            </Link>
            <Link to="/compare" className="text-lavender-bright hover:underline">
              Compare salaries →
            </Link>
          </div>
        </Glass>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Glass>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">My Career Exploration</h2>
              <p className="text-sm text-muted-foreground">
                Interactive route map anchored to your saved shortlist.
              </p>
            </div>
            <Link to="/compare" className={btnClass("soft")}>
              <GitCompareArrows className="size-4" /> Compare careers
            </Link>
          </div>
          <RouteMap className="mt-4 max-h-[340px]" />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-turquoise" /> Saved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-cyan" /> Recently explored
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-lavender" /> Suggested next
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-2">Saved career shortlist</h3>
                <Link to="/saved" className="text-xs text-cyan hover:underline">
                  Manage folders →
                </Link>
              </div>
              {s.saved.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
              ) : (
                <ul className="space-y-2">
                  {s.saved.slice(0, 6).map((id) => {
                    const c = getCareer(id, careers);
                    return (
                      c && (
                        <li
                          key={id}
                          className="glass-soft flex items-center justify-between gap-2 px-3 py-2"
                        >
                          <Link
                            to="/careers/$id"
                            params={{ id }}
                            className="truncate text-sm hover:text-lavender-bright"
                          >
                            {c.name}
                          </Link>
                          <SaveButton career={c} compact />
                        </li>
                      )
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-text-2">Recently explored</h3>
              {s.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Open a career profile to see it here.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {s.recent.map((id) => {
                    const c = getCareer(id, careers);
                    return (
                      c && (
                        <Link key={id} to="/careers/$id" params={{ id }}>
                          <Chip>{c.name}</Chip>
                        </Link>
                      )
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Glass>

        <div className="flex flex-col gap-6">
          <Glass>
            <h2 className="font-display text-xl font-semibold">My Active Roadmap</h2>
            {s.roadmap ? (
              <>
                <div className="mt-4 flex items-center gap-5">
                  <ProgressRing value={p.pct} />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{roadCareer?.name || s.roadmap.title}</p>
                    <p className="text-text-2">Current phase: {p.phase}</p>
                    <p className="text-success">{p.done} completed</p>
                    <p className="text-muted-foreground">{p.total - p.done} remaining</p>
                  </div>
                </div>
                {next && (
                  <p className="mt-4 text-sm text-text-2">
                    Next: <span className="text-foreground">{next.title}</span>
                  </p>
                )}
                <Link to="/roadmap" className={btnClass("primary", "mt-4 w-full")}>
                  Continue Roadmap <ArrowRight className="size-4" />
                </Link>
              </>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={<Map className="size-5" />}
                  title="No roadmap yet"
                  text="Create a budget-aware plan and turn it into tasks you can tick off."
                  action={{ label: "Create a plan", to: "/planner" }}
                />
              </div>
            )}
          </Glass>

          <Glass>
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
            {s.activity.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<ActIcon className="size-5" />}
                  title="Your journey starts here"
                  text="Save a career, try a challenge, or tick off a roadmap milestone — it'll appear here."
                />
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {s.activity.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="flex items-start gap-2 text-text-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan" />
                      {a.text}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{ago(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Glass>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Glass>
          <h2 className="font-display text-lg font-semibold">Challenge reflections</h2>
          {reflections.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Complete a mini-challenge and share how it felt.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {reflections.map(([id, c]) => (
                <li key={id} className="glass-soft px-3 py-2 text-sm">
                  <span className="font-medium capitalize">{id}</span>
                  {c.enjoy && (
                    <span className="ml-2 text-xs text-cyan">
                      {{ enjoyed: "Enjoyed it", okay: "It was okay", not: "Not for me" }[c.enjoy]}
                    </span>
                  )}
                  {c.reflection && <p className="mt-1 text-text-2">“{c.reflection}”</p>}
                </li>
              ))}
            </ul>
          )}
        </Glass>
        <Glass>
          <h2 className="font-display text-lg font-semibold">Continue where you left off</h2>
          <div className="mt-3 flex flex-col gap-2">
            {next && (
              <Link to="/roadmap" className={btnClass("outline", "justify-between")}>
                Roadmap: {next.title}
                <ArrowRight className="size-4" />
              </Link>
            )}
            {s.compare.length >= 2 && (
              <Link to="/compare" className={btnClass("outline", "justify-between")}>
                Comparison shortlist:{" "}
                {s.compare
                  .map((id) => getCareer(id, careers)?.name)
                  .filter(Boolean)
                  .join(" vs ")}
                <ArrowRight className="size-4" />
              </Link>
            )}
            {s.discovery ? (
              <Link to="/discover" className={btnClass("outline", "justify-between")}>
                View your latest discovery report
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link to="/discover" className={btnClass("outline", "justify-between")}>
                Start guided career discovery
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </Glass>
      </div>
    </AppShell>
  );
}
