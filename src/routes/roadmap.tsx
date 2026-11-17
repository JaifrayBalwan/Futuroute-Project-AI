import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  LogIn,
  Map,
  NotebookPen,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Chip,
  EmptyState,
  Glass,
  PageHeader,
  ProgressRing,
  btnClass,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/ui-kit";
import { useUser } from "@/lib/auth";
import { getCareer } from "@/lib/careers";
import { useCareersCatalog } from "@/lib/careers-service";
import { buildRoadmap } from "@/lib/engine";
import { actions, roadmapProgress, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "My Career Roadmap — Futuroute" },
      {
        name: "description",
        content:
          "Manage 5-phase personalised career roadmaps with learning objectives, free alternatives, weekly hours pacing, personal notes, and Cloud Firestore progress tracking.",
      },
      { property: "og:title", content: "My Career Roadmap — Futuroute" },
      {
        property: "og:description",
        content: "5-phase interactive learning roadmaps tailored to your career target and pace.",
      },
    ],
  }),
  component: RoadmapPage,
});

const PHASES = [
  "Foundations",
  "Core Technical & Domain Skills",
  "Core Knowledge & Mastery",
  "Practical Projects & Portfolio",
  "Career Preparation & Applications",
];

function parseTaskHours(effort: string): number {
  const m = effort.match(/(\d+)\s*h/);
  return m ? Number(m[1]) : 4;
}

function RoadmapPage() {
  const { user, loading } = useUser();
  const { roadmaps, roadmap, profile } = useApp();
  const { careers } = useCareersCatalog();
  const refs = useRef<Record<string, HTMLLIElement | null>>({});

  const [filterTab, setFilterTab] = useState<"all" | "pending" | "completed">("all");
  const [showBuilder, setShowBuilder] = useState(false);
  const [newCareerId, setNewCareerId] = useState("software-developer");
  const [newLevel, setNewLevel] = useState<"beginner" | "some" | "comfortable">("beginner");
  const [newHours, setNewHours] = useState(profile?.weeklyHours ?? 6);
  const [building, setBuilding] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPhase, setNewTaskPhase] = useState(1);
  const [newTaskEffort, setNewTaskEffort] = useState("3 h");
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<
    "Beginner" | "Intermediate" | "Advanced"
  >("Beginner");
  const [addingTask, setAddingTask] = useState(false);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const sortedCareerChoices = useMemo(
    () => [...careers].sort((a, b) => a.name.localeCompare(b.name)),
    [careers],
  );

  const handleGenerateNewRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = getCareer(newCareerId, careers);
    if (!target) return;
    setBuilding(true);
    try {
      const rm = buildRoadmap(
        {
          careerId: target.id,
          level: newLevel,
          budget: profile?.budget ?? 0,
          hours: newHours,
          device: "laptop",
          format: "mixed",
          outcome: "portfolio",
          currentSkills: profile?.currentSkills,
        },
        careers,
      );
      await actions.addRoadmap(rm, target.name);
      setShowBuilder(false);
      toast.success(`Generated 5-phase ${target.name} roadmap`);
    } finally {
      setBuilding(false);
    }
  };

  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="My Career Roadmap"
          title="My Career Roadmap"
          text="Sign in to save, manage, and track multiple 5-phase personal learning roadmaps across devices."
        />
        <Glass className="max-w-xl space-y-4">
          <h2 className="font-display text-xl font-semibold">
            Sign in to access your saved roadmaps
          </h2>
          <p className="text-sm text-text-2">
            You can browse careers and preview plans freely as a guest, or sign in to save multiple
            5-phase roadmaps, learning objectives, and progress.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/auth" search={{ next: "/roadmap" }} className={btnClass("primary")}>
              <LogIn className="size-4" /> Sign in / Create account
            </Link>
            <Link to="/planner" className={btnClass("outline")}>
              Preview Budget Planner
            </Link>
          </div>
        </Glass>
      </AppShell>
    );
  }

  const builderPanel = (
    <Glass className="mb-6">
      <h2 className="font-display text-lg font-semibold">
        Create / Switch Career Target Roadmap (5 Phases)
      </h2>
      <form
        onSubmit={handleGenerateNewRoadmap}
        className="mt-4 grid gap-3 sm:grid-cols-[1.5fr_1fr_110px_auto] sm:items-end"
      >
        <label className="grid gap-1 text-xs text-text-2">
          Target Career
          <select
            value={newCareerId}
            onChange={(e) => setNewCareerId(e.target.value)}
            className={selectClass("h-10")}
          >
            {sortedCareerChoices.map((career) => (
              <option key={career.id} value={career.id}>
                {career.name} ({career.industry})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-2">
          Starting Familiarity
          <select
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value as typeof newLevel)}
            className={selectClass("h-10")}
          >
            <option value="beginner">Complete beginner</option>
            <option value="some">Know some basics</option>
            <option value="comfortable">Fairly comfortable</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-text-2">
          Weekly hrs
          <input
            type="number"
            min={1}
            max={40}
            value={newHours}
            onChange={(e) => setNewHours(Math.max(1, Math.min(40, Number(e.target.value) || 5)))}
            className={inputClass("h-10")}
          />
        </label>
        <Button type="submit" disabled={building} className="h-10">
          {building ? "Creating…" : "Generate 5-Phase Roadmap"}
        </Button>
      </form>
    </Glass>
  );

  if (!roadmap) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="5-Phase Learning System"
          title="My Career Roadmap"
          text="Generate a 5-phase personalised roadmap directly here or customize spending inside the Budget Planner."
        />
        {builderPanel}
        <Glass>
          <EmptyState
            icon={<Map className="size-5" />}
            title="No active roadmap yet"
            text="Pick a target career above to generate a 5-phase roadmap, or open the Budget-to-Skill Planner first."
            action={{ label: "Open Budget Planner", to: "/planner" }}
          />
        </Glass>
      </AppShell>
    );
  }

  const c = getCareer(roadmap.careerId, careers);
  const p = roadmapProgress(roadmap);
  const next = roadmap.tasks.find((t) => !t.done);
  const remainingTasks = roadmap.tasks.filter((t) => !t.done);
  const remainingHours = remainingTasks.reduce((sum, t) => sum + parseTaskHours(t.effort), 0);
  const remainingWeeks = Math.max(
    remainingTasks.length ? 1 : 0,
    Math.ceil(remainingHours / Math.max(1, roadmap.hours)),
  );

  const goNext = () => {
    if (next) {
      const el = refs.current[next.id];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector("button")?.focus();
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    actions.addTaskToRoadmap(roadmap.id, {
      id: `custom-${Date.now().toString(36)}`,
      phase: newTaskPhase,
      week: Math.max(1, roadmap.tasks.length + 1),
      title,
      desc: "Personal milestone added to your roadmap.",
      effort: newTaskEffort.trim() || "3 h",
      difficulty: newTaskDifficulty,
      objectives: ["Complete milestone focus & record notes"],
      done: false,
    });
    setNewTaskTitle("");
    setAddingTask(false);
    toast.success("Custom milestone added");
  };

  const handleDelete = async (id: string) => {
    await actions.deleteRoadmap(id);
    toast.success("Roadmap removed");
  };

  const openNoteEditor = (taskId: string, existingNote?: string) => {
    if (editingNoteId === taskId) {
      setEditingNoteId(null);
      return;
    }
    setNoteDrafts((prev) => ({
      ...prev,
      [taskId]: prev[taskId] ?? existingNote ?? "",
    }));
    setEditingNoteId(taskId);
  };

  const saveTaskNote = (taskId: string) => {
    const text = noteDrafts[taskId] ?? "";
    actions.setTaskNote(taskId, text, roadmap.id);
    setEditingNoteId(null);
    toast.success(text.trim() ? "Milestone note saved" : "Milestone note cleared");
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="5-Phase Interactive Roadmap"
        title={roadmap.title || `${c?.name ?? "Career"} Roadmap`}
        text={`${roadmap.hours} h/week · ${
          roadmap.level === "beginner"
            ? "Beginner"
            : roadmap.level === "some"
              ? "Some basics"
              : "Fairly comfortable"
        } · budget ₹${roadmap.budget.toLocaleString("en-IN")}${roadmap.weeks ? ` · ~${roadmap.weeks} weeks` : ""}`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowBuilder(!showBuilder)}>
            {showBuilder ? "Hide career builder" : "Switch / add career roadmap"}
          </Button>
          <Button variant="soft" onClick={() => setAddingTask(!addingTask)}>
            <Plus className="size-4" /> Personal milestone
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              actions.resetRoadmapProgress(roadmap.id);
              toast.success("Roadmap progress reset");
            }}
          >
            <RotateCcw className="size-4" /> Reset progress
          </Button>
        </div>
      </PageHeader>

      {showBuilder && builderPanel}

      {roadmaps.length > 1 && (
        <Glass className="mb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your saved roadmaps ({roadmaps.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {roadmaps.map((rm) => {
              const prog = roadmapProgress(rm);
              const active = rm.id === roadmap.id;
              return (
                <div
                  key={rm.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                    active
                      ? "border-lavender/60 bg-lavender/20 glow"
                      : "border-glass-border bg-secondary",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => actions.selectRoadmap(rm.id)}
                    className="text-left font-medium hover:text-cyan"
                  >
                    {rm.title}{" "}
                    <span className="ml-1 text-xs text-cyan tabular-nums">{prog.pct}%</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${rm.title}`}
                    onClick={() => void handleDelete(rm.id)}
                    className="text-muted-foreground hover:text-warning"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </Glass>
      )}

      {addingTask && (
        <Glass className="mb-6">
          <form
            onSubmit={handleAddTask}
            className="grid gap-3 sm:grid-cols-[1.4fr_1fr_120px_100px_auto] sm:items-end"
          >
            <label className="grid gap-1 text-sm">
              Milestone title
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Build SQL sales mini-dashboard"
                className={inputClass("h-10")}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Phase
              <select
                value={newTaskPhase}
                onChange={(e) => setNewTaskPhase(Number(e.target.value))}
                className={selectClass("h-10 px-2.5")}
              >
                {PHASES.map((ph, idx) => (
                  <option key={ph} value={idx + 1}>
                    Phase {idx + 1}: {ph}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Difficulty
              <select
                value={newTaskDifficulty}
                onChange={(e) => setNewTaskDifficulty(e.target.value as typeof newTaskDifficulty)}
                className={selectClass("h-10 px-2.5")}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Effort
              <input
                value={newTaskEffort}
                onChange={(e) => setNewTaskEffort(e.target.value)}
                className={inputClass("h-10")}
              />
            </label>
            <Button type="submit" className="h-10">
              Add milestone
            </Button>
          </form>
        </Glass>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip active={filterTab === "all"} onClick={() => setFilterTab("all")}>
            All ({roadmap.tasks.length})
          </Chip>
          <Chip active={filterTab === "pending"} onClick={() => setFilterTab("pending")}>
            Pending ({roadmap.tasks.length - p.done})
          </Chip>
          <Chip active={filterTab === "completed"} onClick={() => setFilterTab("completed")}>
            Completed ({p.done})
          </Chip>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-2">
          <Clock className="size-3.5 text-cyan" />
          <span>Weekly study pace:</span>
          <select
            aria-label="Adjust weekly hours"
            value={roadmap.hours}
            onChange={(e) => actions.retuneRoadmapHours(roadmap.id, Number(e.target.value))}
            className={selectClass("h-8 w-28 px-2 text-xs")}
          >
            {[3, 5, 6, 8, 10, 12, 15, 20, 25].map((h) => (
              <option key={h} value={h}>
                {h} h/week
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {PHASES.map((name, i) => {
            const phaseTasks = roadmap.tasks.filter((t) => t.phase === i + 1);
            if (phaseTasks.length === 0) return null;
            const visibleTasks = phaseTasks.filter((t) =>
              filterTab === "pending" ? !t.done : filterTab === "completed" ? t.done : true,
            );
            const done = phaseTasks.filter((t) => t.done).length;
            return (
              <Glass key={name} as="section" className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">
                    Phase {i + 1}: {name}
                  </h2>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {done}/{phaseTasks.length}
                  </span>
                </div>
                {visibleTasks.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    No {filterTab} milestones in this phase.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {visibleTasks.map((t) => {
                      const isEditingNote = editingNoteId === t.id;
                      const draft = noteDrafts[t.id] ?? t.note ?? "";
                      const isNext = next?.id === t.id;
                      return (
                        <li
                          key={t.id}
                          ref={(el) => {
                            refs.current[t.id] = el;
                          }}
                          className={cn(
                            "glass-soft flex gap-4 p-4 transition",
                            t.done && "opacity-75",
                            isNext && "border-cyan/60 ring-1 ring-cyan/25",
                          )}
                        >
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={t.done}
                            aria-label={`Mark "${t.title}" ${t.done ? "incomplete" : "complete"}`}
                            onClick={() => actions.toggleTask(t.id, roadmap.id)}
                            className={cn(
                              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border transition",
                              t.done
                                ? "border-success bg-success text-primary-foreground"
                                : "border-glass-border hover:border-lavender",
                            )}
                          >
                            {t.done && <Check className="size-4" />}
                          </button>
                          <div className="min-w-0 flex-1 break-words">
                            <div className="flex flex-wrap items-center gap-2">
                              {t.week && (
                                <span className="rounded-md bg-lavender/20 px-2 py-0.5 text-[11px] font-medium text-lavender-bright tabular-nums">
                                  Week {t.week}
                                </span>
                              )}
                              {t.difficulty && (
                                <span className="rounded-md border border-glass-border bg-secondary px-2 py-0.5 text-[11px] text-text-2">
                                  {t.difficulty}
                                </span>
                              )}
                              {isNext && (
                                <span className="rounded-md bg-cyan/15 px-2 py-0.5 text-[11px] font-medium text-cyan">
                                  Up next
                                </span>
                              )}
                              <p className={cn("font-medium", t.done && "line-through")}>
                                {t.title}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-text-2">{t.desc}</p>

                            {t.objectives && t.objectives.length > 0 && (
                              <ul className="mt-2 space-y-0.5 text-xs text-text-2">
                                {t.objectives.map((obj) => (
                                  <li key={obj}>✓ {obj}</li>
                                ))}
                              </ul>
                            )}

                            {t.practicalTask && (
                              <p className="mt-2 rounded-lg border border-cyan/25 bg-cyan/5 px-3 py-1.5 text-xs text-text-2">
                                <span className="font-medium text-cyan">Practical task:</span>{" "}
                                {t.practicalTask}
                              </p>
                            )}

                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>Effort: {t.effort}</span>
                              {t.resource && (
                                <a
                                  href={t.resource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-cyan hover:underline"
                                >
                                  Primary: {t.resource.name}
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                              {t.freeAlternative && (
                                <a
                                  href={t.freeAlternative.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-turquoise hover:underline"
                                >
                                  Free alt: {t.freeAlternative.name}
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => openNoteEditor(t.id, t.note)}
                                className="inline-flex items-center gap-1 text-lavender-bright hover:underline"
                              >
                                <NotebookPen className="size-3" />
                                {t.note ? "Edit note" : "Add personal note"}
                              </button>
                            </div>

                            {t.note && !isEditingNote && (
                              <p className="mt-2.5 rounded-lg border border-glass-border bg-popover/70 px-3 py-2 text-xs text-text-2">
                                <span className="font-medium text-lavender-bright">Your note:</span>{" "}
                                {t.note}
                              </p>
                            )}

                            {isEditingNote && (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  rows={2}
                                  maxLength={400}
                                  value={draft}
                                  onChange={(e) =>
                                    setNoteDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                                  }
                                  placeholder="Write key takeaways, links you practiced, or questions to revisit…"
                                  className={textareaClass("text-xs")}
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="soft"
                                    className="h-8 min-h-8 px-3 text-xs"
                                    onClick={() => saveTaskNote(t.id)}
                                  >
                                    Save note
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="h-8 min-h-8 px-3 text-xs"
                                    onClick={() => setEditingNoteId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Glass>
            );
          })}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:h-fit">
          <Glass className="text-center">
            <ProgressRing value={p.pct} size={150} stroke={12} />
            <p className="mt-3 text-sm text-text-2 tabular-nums">
              {p.done} of {p.total} milestones complete
            </p>
            <p className="text-xs text-muted-foreground">
              Current phase: {PHASES[Math.max(0, Math.min(4, p.phase - 1))]}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-glass-border bg-secondary/40 p-2.5 text-xs tabular-nums">
              <div>
                <p className="text-muted-foreground">Remaining hrs</p>
                <p className="font-semibold text-foreground">{remainingHours} h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Est. weeks left</p>
                <p className="font-semibold text-cyan">{remainingWeeks} wks</p>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={goNext} disabled={!next}>
              {next ? (
                <>
                  Resume / Continue Learning
                  <ArrowRight className="size-4" />
                </>
              ) : (
                "All milestones complete 🎉"
              )}
            </Button>
          </Glass>
          <Glass>
            <h2 className="font-display text-base font-semibold">Next upcoming milestones</h2>
            {remainingTasks.length === 0 ? (
              <p className="mt-2 text-sm text-success">
                All milestones done — check Opportunity Finder to apply for projects & internships!
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm text-text-2">
                {remainingTasks.slice(0, 5).map((t) => (
                  <li key={t.id}>• {t.title}</li>
                ))}
              </ul>
            )}
          </Glass>
          <p className="text-xs text-muted-foreground">
            Effort & week estimates scale automatically with your weekly hours and familiarity
            level. Completing milestones builds skill fluency and does not guarantee job placement.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
