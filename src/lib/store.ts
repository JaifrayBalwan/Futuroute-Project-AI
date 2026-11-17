import { useEffect, useSyncExternalStore } from "react";
import type { User } from "firebase/auth";
import {
  addCustomTaskToRoadmap,
  canWriteFirestore,
  createRoadmapWithTasks,
  deleteComparison,
  deleteLearningPlan,
  deleteRoadmapWithTasks,
  deleteTransitionRecord,
  getUserProfile,
  listAssessments,
  listChallengeAttempts,
  listComparisons,
  listLearningPlans,
  listRoadmapsWithTasks,
  listSavedCareers,
  listSavedOpportunities,
  listTransitions,
  listUserActivity,
  logUserActivity,
  removeSavedCareer,
  removeSavedOpportunityRecord,
  resetRoadmapTasksInDb,
  saveAssessment,
  saveCareerToFolder,
  saveChallengeAttempt,
  saveComparison,
  saveLearningPlan,
  saveOpportunityRecord,
  saveTransitionRecord,
  toggleRoadmapTaskInDb,
  updateRoadmapHoursInDb,
  updateRoadmapTaskNoteInDb,
  updateRoadmapTitleInDb,
  type CareerTransitionRecord,
  type OpportunityTrackStatus,
  type SavedFolder,
  type SavedOpportunityRecord,
  type UserProfileRecord,
} from "./db";
import { auth } from "./firebase";

export type { SavedFolder, OpportunityTrackStatus };

export type Task = {
  id: string;
  phase: number;
  week?: number | undefined;
  title: string;
  desc: string;
  effort: string;
  objectives?: string[] | undefined;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | undefined;
  practicalTask?: string | undefined;
  freeAlternative?: { name: string; url: string } | undefined;
  note?: string | undefined;
  resource?: { name: string; url: string } | undefined;
  done: boolean;
};

export type Roadmap = {
  id: string;
  careerId: string;
  title: string;
  level: string;
  hours: number;
  budget: number;
  format: string;
  project: string;
  weeks?: number | undefined;
  createdAt: number;
  tasks: Task[];
};

export type SavedLearningPlan = {
  id: string;
  careerId: string;
  careerName: string;
  level: "beginner" | "some" | "comfortable";
  budget: number;
  recommendedSpend: number;
  hours: number;
  device: string;
  format: string;
  outcome: string;
  weeks: number;
  itemIds: string[];
  aiSummary?: string | undefined;
  createdAtMs: number;
};

export type ChallengeResult = {
  correct: boolean;
  answer: string;
  enjoy?: "enjoyed" | "okay" | "not" | undefined;
  reflection?: string | undefined;
  at: number;
};

export type Activity = {
  id: string;
  text: string;
  at: number;
  kind:
    | "save"
    | "compare"
    | "task"
    | "challenge"
    | "roadmap"
    | "discover"
    | "transition"
    | "opportunity";
};

export type DiscoveryAnswers = Record<string, string | string[] | number>;

export type SavedComparisonItem = {
  id: string;
  careerIds: string[];
  title: string;
  note?: string | undefined;
  createdAtMs: number;
};

export type SavedOpportunityItem = {
  opportunityId: string;
  title: string;
  category: string;
  status: OpportunityTrackStatus;
  savedAtMs: number;
  updatedAtMs: number;
};

export type SavedTransitionItem = Omit<CareerTransitionRecord, "userId">;

export type AppState = {
  saved: string[];
  savedFolders: Record<string, SavedFolder>;
  savedNotes: Record<string, string>;
  compare: string[];
  savedComparisons: SavedComparisonItem[];
  savedPlans: SavedLearningPlan[];
  savedOpportunities: SavedOpportunityItem[];
  transitions: SavedTransitionItem[];
  recent: string[];
  comparedCount: number;
  activity: Activity[];
  discovery?:
    | {
        answers: DiscoveryAnswers;
        results: string[];
        groups?: Record<string, unknown> | undefined;
        source?: "gemini" | "deterministic" | undefined;
        at: number;
      }
    | undefined;
  challenges: Record<string, ChallengeResult>;
  roadmap?: Roadmap | undefined;
  roadmaps: Roadmap[];
  activeRoadmapId?: string | undefined;
  profile?: UserProfileRecord | null | undefined;
};

const KEY = "futuroute:v2";
const DEFAULT: AppState = {
  saved: [],
  savedFolders: {},
  savedNotes: {},
  compare: ["software-developer", "ui-ux-designer"],
  savedComparisons: [],
  savedPlans: [],
  savedOpportunities: [],
  transitions: [],
  recent: [],
  comparedCount: 0,
  activity: [],
  challenges: {},
  roadmaps: [],
  profile: null,
};

let state: AppState = DEFAULT;
let loaded = false;
let activeUid: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function storageKeyFor(uid: string | null): string {
  return uid ? `${KEY}:user:${uid}` : KEY;
}

function persistLocal() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKeyFor(activeUid), JSON.stringify(state));
  } catch {
    // storage full or blocked
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(storageKeyFor(activeUid));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      const roadmaps = Array.isArray(parsed.roadmaps)
        ? parsed.roadmaps
        : parsed.roadmap
          ? [
              {
                ...parsed.roadmap,
                id: parsed.roadmap.id ?? "rm-local",
                title: parsed.roadmap.title ?? "My Roadmap",
              },
            ]
          : [];
      const activeId = parsed.activeRoadmapId ?? roadmaps[0]?.id;
      state = {
        ...DEFAULT,
        ...parsed,
        roadmaps,
        activeRoadmapId: activeId,
        roadmap: roadmaps.find((r) => r.id === activeId) ?? roadmaps[0],
      };
    }
  } catch {
    state = DEFAULT;
  }
}

export function setState(fn: (s: AppState) => AppState) {
  load();
  const next = fn(state);
  const active = next.roadmaps.find((r) => r.id === next.activeRoadmapId) ?? next.roadmaps[0];
  state = { ...next, activeRoadmapId: active?.id, roadmap: active };
  persistLocal();
  notify();
}

export function useApp(): AppState {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      queueMicrotask(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => DEFAULT,
  );
}

const uidGen = () => Math.random().toString(36).slice(2, 10);

export const log = (s: AppState, text: string, kind: Activity["kind"]): AppState => ({
  ...s,
  activity: [{ id: uidGen(), text, at: Date.now(), kind }, ...s.activity].slice(0, 30),
});

function syncCloudActivity(text: string, kind: Activity["kind"]) {
  const u = auth.currentUser;
  if (u && canWriteFirestore()) {
    void logUserActivity(u.uid, text, kind).catch(() => {});
  }
}

export function useFirebaseStoreSync(user: User | null) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const uid = user?.uid ?? null;
    if (activeUid !== uid) {
      activeUid = uid;
      loaded = false;
      state = DEFAULT;
      load();
      notify();
    }
    if (!user || !user.emailVerified) return;

    let cancelled = false;
    (async () => {
      try {
        const [
          profile,
          savedList,
          comparisons,
          assessments,
          roadmaps,
          challenges,
          activity,
          learningPlans,
          savedOpportunities,
          transitions,
        ] = await Promise.all([
          getUserProfile(user.uid).catch(() => null),
          listSavedCareers(user.uid).catch(() => []),
          listComparisons(user.uid).catch(() => []),
          listAssessments(user.uid).catch(() => []),
          listRoadmapsWithTasks(user.uid).catch(() => []),
          listChallengeAttempts(user.uid).catch(() => ({})),
          listUserActivity(user.uid).catch(() => []),
          listLearningPlans(user.uid).catch(() => []),
          listSavedOpportunities(user.uid).catch(() => [] as SavedOpportunityRecord[]),
          listTransitions(user.uid).catch(() => [] as CareerTransitionRecord[]),
        ]);
        if (cancelled) return;

        setState((cur) => {
          const savedIds = savedList.length ? savedList.map((s) => s.careerId) : cur.saved;
          const savedFolders: Record<string, SavedFolder> = { ...cur.savedFolders };
          const savedNotes: Record<string, string> = { ...cur.savedNotes };
          for (const item of savedList) {
            savedFolders[item.careerId] = item.folder;
            if (item.note) savedNotes[item.careerId] = item.note;
          }

          const mappedRoadmaps: Roadmap[] = roadmaps.length
            ? roadmaps.map((r) => ({
                id: r.id,
                careerId: r.careerId,
                title: r.title,
                level: r.level,
                hours: r.hours,
                budget: r.budget,
                format: r.format ?? "mixed",
                project: r.project ?? "",
                weeks: r.weeks,
                createdAt: r.createdAtMs,
                tasks: r.tasks.map((t) => ({
                  id: t.id,
                  phase: t.phase,
                  week: t.week,
                  title: t.title,
                  desc: t.desc ?? "",
                  effort: t.effort ?? "",
                  objectives: t.objectives,
                  difficulty: t.difficulty,
                  practicalTask: t.practicalTask,
                  freeAlternative: t.freeAlternative ?? undefined,
                  note: t.note,
                  resource: t.resource ?? undefined,
                  done: t.done,
                })),
              }))
            : cur.roadmaps;

          const latestAsm = assessments[0];
          const mappedDiscovery = latestAsm
            ? {
                answers: latestAsm.answers as DiscoveryAnswers,
                results: Array.isArray(
                  (latestAsm.groups as { strongMatches?: Array<{ career?: { id?: string } }> })
                    ?.strongMatches,
                )
                  ? (
                      latestAsm.groups as { strongMatches: Array<{ career?: { id?: string } }> }
                    ).strongMatches
                      .map((x) => x.career?.id)
                      .filter((x): x is string => Boolean(x))
                  : (cur.discovery?.results ?? []),
                groups: latestAsm.groups,
                source: latestAsm.source,
                at: latestAsm.createdAtMs,
              }
            : cur.discovery;

          const mappedChallenges: Record<string, ChallengeResult> = { ...cur.challenges };
          for (const [cid, c] of Object.entries(challenges)) {
            mappedChallenges[cid] = {
              answer: c.answer ?? "",
              correct: c.correct,
              enjoy: c.enjoy,
              reflection: c.reflection,
              at: Date.now(),
            };
          }

          const mappedActivity: Activity[] = activity.length
            ? activity.map((a) => ({ id: a.id, text: a.text, kind: a.kind, at: a.createdAtMs }))
            : cur.activity;

          const mappedOpps: SavedOpportunityItem[] = savedOpportunities.length
            ? savedOpportunities.map((o) => ({
                opportunityId: o.opportunityId,
                title: o.title,
                category: o.category,
                status: o.status,
                savedAtMs: o.savedAtMs,
                updatedAtMs: o.updatedAtMs,
              }))
            : cur.savedOpportunities;

          const mappedTransitions: SavedTransitionItem[] = transitions.length
            ? transitions.map((tr) => ({
                id: tr.id,
                currentRole: tr.currentRole,
                targetCareerId: tr.targetCareerId,
                targetCareerName: tr.targetCareerName,
                existingSkills: tr.existingSkills,
                missingSkills: tr.missingSkills,
                compatibilityScore: tr.compatibilityScore,
                estimatedWeeks: tr.estimatedWeeks,
                budgetInr: tr.budgetInr,
                weeklyHours: tr.weeklyHours,
                createdAtMs: tr.createdAtMs,
              }))
            : cur.transitions;

          return {
            ...cur,
            profile: profile ?? cur.profile,
            saved: savedIds,
            savedFolders,
            savedNotes,
            savedComparisons: comparisons.length ? comparisons : cur.savedComparisons,
            savedPlans: learningPlans.length ? learningPlans : cur.savedPlans,
            savedOpportunities: mappedOpps,
            transitions: mappedTransitions,
            comparedCount: Math.max(cur.comparedCount, comparisons.length),
            discovery: mappedDiscovery,
            roadmaps: mappedRoadmaps,
            activeRoadmapId:
              cur.activeRoadmapId && mappedRoadmaps.some((r) => r.id === cur.activeRoadmapId)
                ? cur.activeRoadmapId
                : mappedRoadmaps[0]?.id,
            challenges: mappedChallenges,
            activity: mappedActivity,
          };
        });
      } catch {
        // Fallback smoothly to cached local state
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, user?.emailVerified]);
}

export const actions = {
  setProfile(profile: UserProfileRecord | null) {
    setState((s) => ({ ...s, profile }));
  },

  toggleSave(id: string, name: string, folder: SavedFolder = "top") {
    const u = auth.currentUser;
    const isRemoving = state.saved.includes(id);
    setState((s) => {
      if (isRemoving) {
        const nextFolders = { ...s.savedFolders };
        delete nextFolders[id];
        return log(
          { ...s, saved: s.saved.filter((x) => x !== id), savedFolders: nextFolders },
          `Removed ${name} from saved careers`,
          "save",
        );
      }
      return log(
        {
          ...s,
          saved: [...s.saved, id],
          savedFolders: { ...s.savedFolders, [id]: folder },
        },
        `Saved ${name}`,
        "save",
      );
    });
    if (u && canWriteFirestore()) {
      if (isRemoving) {
        void removeSavedCareer(u.uid, id).catch(() => {});
        syncCloudActivity(`Removed ${name} from saved careers`, "save");
      } else {
        void saveCareerToFolder(u.uid, id, folder, state.savedNotes[id]).catch(() => {});
        syncCloudActivity(`Saved ${name}`, "save");
      }
    }
  },

  setSavedFolder(id: string, name: string, folder: SavedFolder) {
    const u = auth.currentUser;
    setState((s) => {
      const saved = s.saved.includes(id) ? s.saved : [...s.saved, id];
      return log(
        { ...s, saved, savedFolders: { ...s.savedFolders, [id]: folder } },
        `Moved ${name} to ${folder === "top" ? "Top Career Choices" : folder === "alternative" ? "Alternative Careers" : "Explore Later"}`,
        "save",
      );
    });
    if (u && canWriteFirestore()) {
      void saveCareerToFolder(u.uid, id, folder, state.savedNotes[id]).catch(() => {});
    }
  },

  setSavedNote(id: string, note: string) {
    const u = auth.currentUser;
    const folder = state.savedFolders[id] ?? "top";
    setState((s) => ({ ...s, savedNotes: { ...s.savedNotes, [id]: note } }));
    if (u && canWriteFirestore()) {
      void saveCareerToFolder(u.uid, id, folder, note).catch(() => {});
    }
  },

  visit(id: string) {
    setState((s) => ({ ...s, recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 8) }));
  },

  setCompare(ids: string[]) {
    setState((s) => ({ ...s, compare: ids.slice(0, 3) }));
  },

  markCompared(names: string[]) {
    setState((s) =>
      log(
        { ...s, comparedCount: s.comparedCount + 1 },
        `Compared ${names.join(" vs ")}`,
        "compare",
      ),
    );
  },

  async saveComparisonRecord(careerIds: string[], title: string, note?: string): Promise<string> {
    const u = auth.currentUser;
    let id = `cmp-${Date.now().toString(36)}`;
    if (u && canWriteFirestore()) {
      id = await saveComparison(u.uid, careerIds, title, note);
      syncCloudActivity(`Saved comparison: ${title}`, "compare");
    }
    const item: SavedComparisonItem = { id, careerIds, title, note, createdAtMs: Date.now() };
    setState((s) =>
      log(
        { ...s, savedComparisons: [item, ...s.savedComparisons].slice(0, 20) },
        `Saved comparison: ${title}`,
        "compare",
      ),
    );
    return id;
  },

  async removeComparisonRecord(comparisonId: string) {
    const u = auth.currentUser;
    if (u && canWriteFirestore()) {
      await deleteComparison(u.uid, comparisonId).catch(() => {});
    }
    setState((s) => ({
      ...s,
      savedComparisons: s.savedComparisons.filter((c) => c.id !== comparisonId),
    }));
  },

  setDiscovery(
    answers: DiscoveryAnswers,
    results: string[],
    groups?: Record<string, unknown>,
    source: "gemini" | "deterministic" = "deterministic",
  ) {
    const u = auth.currentUser;
    setState((s) =>
      log(
        { ...s, discovery: { answers, results, groups, source, at: Date.now() } },
        "Completed career discovery",
        "discover",
      ),
    );
    if (u && canWriteFirestore()) {
      void saveAssessment(u.uid, answers, groups ?? { results }, source).catch(() => {});
      syncCloudActivity("Completed career discovery", "discover");
    }
  },

  setChallenge(id: string, r: Partial<ChallengeResult>, label?: string) {
    const u = auth.currentUser;
    setState((s) => {
      const merged = {
        ...(s.challenges[id] ?? { correct: false, answer: "", at: Date.now() }),
        ...r,
      };
      const next = { ...s, challenges: { ...s.challenges, [id]: merged } };
      return label ? log(next, label, "challenge") : next;
    });
    if (u && canWriteFirestore()) {
      const cur = state.challenges[id];
      void saveChallengeAttempt(u.uid, id, {
        answer: cur?.answer,
        correct: Boolean(cur?.correct),
        enjoy: cur?.enjoy,
        reflection: cur?.reflection,
      }).catch(() => {});
      if (label) syncCloudActivity(label, "challenge");
    }
  },

  async addRoadmap(r: Roadmap, name: string): Promise<string> {
    const u = auth.currentUser;
    let roadmapId = r.id || `rm-${Date.now().toString(36)}`;
    if (u && canWriteFirestore()) {
      roadmapId = await createRoadmapWithTasks(
        u.uid,
        {
          careerId: r.careerId,
          title: r.title || `${name} Roadmap`,
          level: (r.level as "beginner" | "some" | "comfortable") ?? "beginner",
          hours: r.hours,
          budget: r.budget,
          format: r.format,
          project: r.project,
          weeks: r.weeks,
        },
        r.tasks.map((t, idx) => ({
          id: t.id,
          phase: t.phase,
          week: t.week ?? idx + 1,
          position: idx,
          title: t.title,
          desc: t.desc,
          effort: t.effort,
          objectives: t.objectives,
          difficulty: t.difficulty,
          practicalTask: t.practicalTask,
          freeAlternative: t.freeAlternative ?? null,
          resource: t.resource ?? null,
          done: t.done,
        })),
      );
      syncCloudActivity(`Created a roadmap for ${name}`, "roadmap");
    }
    const created: Roadmap = { ...r, id: roadmapId, title: r.title || `${name} Roadmap` };
    setState((s) =>
      log(
        {
          ...s,
          roadmaps: [created, ...s.roadmaps.filter((x) => x.id !== roadmapId)],
          activeRoadmapId: roadmapId,
        },
        `Created a roadmap for ${name}`,
        "roadmap",
      ),
    );
    return roadmapId;
  },

  setRoadmap(r: Roadmap, name: string) {
    void this.addRoadmap(r, name);
  },

  selectRoadmap(roadmapId: string) {
    setState((s) => ({ ...s, activeRoadmapId: roadmapId }));
  },

  renameRoadmap(roadmapId: string, title: string) {
    const u = auth.currentUser;
    setState((s) => ({
      ...s,
      roadmaps: s.roadmaps.map((rm) => (rm.id === roadmapId ? { ...rm, title } : rm)),
    }));
    if (u && canWriteFirestore()) {
      void updateRoadmapTitleInDb(u.uid, roadmapId, title).catch(() => {});
    }
  },

  async deleteRoadmap(roadmapId: string) {
    const u = auth.currentUser;
    if (u && canWriteFirestore()) {
      await deleteRoadmapWithTasks(u.uid, roadmapId).catch(() => {});
    }
    setState((s) => {
      const remaining = s.roadmaps.filter((r) => r.id !== roadmapId);
      const nextActive = s.activeRoadmapId === roadmapId ? remaining[0]?.id : s.activeRoadmapId;
      return log(
        { ...s, roadmaps: remaining, activeRoadmapId: nextActive },
        "Removed a roadmap",
        "roadmap",
      );
    });
  },

  addTaskToRoadmap(roadmapId: string, task: Task) {
    const u = auth.currentUser;
    const targetRm = state.roadmaps.find((r) => r.id === roadmapId);
    const pos = targetRm ? targetRm.tasks.length : 0;
    setState((s) => ({
      ...s,
      roadmaps: s.roadmaps.map((rm) =>
        rm.id === roadmapId ? { ...rm, tasks: [...rm.tasks, task] } : rm,
      ),
    }));
    if (u && canWriteFirestore()) {
      void addCustomTaskToRoadmap(u.uid, roadmapId, {
        id: task.id,
        phase: task.phase,
        week: task.week ?? pos + 1,
        position: pos,
        title: task.title,
        desc: task.desc,
        effort: task.effort,
        resource: task.resource ?? null,
        done: task.done,
      }).catch(() => {});
    }
  },

  toggleTask(taskId: string, roadmapId?: string) {
    const u = auth.currentUser;
    const targetId = roadmapId ?? state.activeRoadmapId ?? state.roadmap?.id;
    if (!targetId) return;
    let toggledTitle = "";
    let toggledDone = false;

    setState((s) => {
      const nextRoadmaps = s.roadmaps.map((rm) => {
        if (rm.id !== targetId) return rm;
        const tasks = rm.tasks.map((t) => {
          if (t.id !== taskId) return t;
          toggledDone = !t.done;
          toggledTitle = t.title;
          return { ...t, done: toggledDone };
        });
        return { ...rm, tasks };
      });
      if (!toggledTitle) return s;
      return log(
        { ...s, roadmaps: nextRoadmaps },
        `${toggledDone ? "Completed" : "Reopened"} task: ${toggledTitle}`,
        "task",
      );
    });

    if (toggledTitle && u && canWriteFirestore()) {
      void toggleRoadmapTaskInDb(u.uid, targetId, taskId, toggledDone).catch(() => {});
      syncCloudActivity(`${toggledDone ? "Completed" : "Reopened"} task: ${toggledTitle}`, "task");
    }
  },

  setTaskNote(taskId: string, note: string, roadmapId?: string) {
    const u = auth.currentUser;
    const targetId = roadmapId ?? state.activeRoadmapId ?? state.roadmap?.id;
    if (!targetId) return;
    const cleaned = note.trim().slice(0, 400);
    setState((s) => ({
      ...s,
      roadmaps: s.roadmaps.map((rm) =>
        rm.id === targetId
          ? {
              ...rm,
              tasks: rm.tasks.map((t) => (t.id === taskId ? { ...t, note: cleaned } : t)),
            }
          : rm,
      ),
    }));
    if (u && canWriteFirestore()) {
      void updateRoadmapTaskNoteInDb(u.uid, targetId, taskId, cleaned).catch(() => {});
    }
  },

  async saveBudgetPlan(
    input: Omit<SavedLearningPlan, "id" | "createdAtMs">,
  ): Promise<SavedLearningPlan> {
    const u = auth.currentUser;
    let id = `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    if (u && canWriteFirestore()) {
      id = await saveLearningPlan(u.uid, input);
      syncCloudActivity(`Saved budget plan for ${input.careerName}`, "roadmap");
    }
    const created: SavedLearningPlan = { ...input, id, createdAtMs: Date.now() };
    setState((s) =>
      log(
        {
          ...s,
          savedPlans: [created, ...s.savedPlans.filter((p) => p.id !== id)].slice(0, 20),
        },
        `Saved ₹${input.budget.toLocaleString("en-IN")} learning plan for ${input.careerName}`,
        "roadmap",
      ),
    );
    return created;
  },

  async removeBudgetPlan(planId: string) {
    const u = auth.currentUser;
    if (u && canWriteFirestore()) {
      await deleteLearningPlan(u.uid, planId).catch(() => {});
    }
    setState((s) => ({
      ...s,
      savedPlans: s.savedPlans.filter((p) => p.id !== planId),
    }));
  },

  resetRoadmapProgress(roadmapId: string) {
    const u = auth.currentUser;
    const target = state.roadmaps.find((r) => r.id === roadmapId);
    if (!target) return;
    setState((s) =>
      log(
        {
          ...s,
          roadmaps: s.roadmaps.map((rm) =>
            rm.id === roadmapId
              ? { ...rm, tasks: rm.tasks.map((t) => ({ ...t, done: false })) }
              : rm,
          ),
        },
        `Reset progress on ${target.title}`,
        "roadmap",
      ),
    );
    if (u && canWriteFirestore()) {
      void resetRoadmapTasksInDb(
        u.uid,
        roadmapId,
        target.tasks.map((t) => t.id),
      ).catch(() => {});
    }
  },

  retuneRoadmapHours(roadmapId: string, nextHours: number) {
    const u = auth.currentUser;
    const hrs = Math.max(1, Math.min(50, Math.round(nextHours)));
    const target = state.roadmaps.find((r) => r.id === roadmapId);
    if (!target) return;
    let totalHours = 0;
    for (const t of target.tasks) {
      const m = t.effort.match(/(\d+)\s*h/);
      totalHours += m ? Number(m[1]) : 4;
    }
    const nextWeeks = Math.max(2, Math.ceil(totalHours / hrs));
    setState((s) => ({
      ...s,
      roadmaps: s.roadmaps.map((rm) => {
        if (rm.id !== roadmapId) return rm;
        let cum = 0;
        return {
          ...rm,
          hours: hrs,
          weeks: nextWeeks,
          tasks: rm.tasks.map((t) => {
            const m = t.effort.match(/(\d+)\s*h/);
            const h = m ? Number(m[1]) : 4;
            cum += h;
            return {
              ...t,
              week: Math.max(1, Math.ceil(cum / hrs)),
              effort: `${h} h · ~${Math.max(1, Math.ceil(h / hrs))} wk`,
            };
          }),
        };
      }),
    }));
    if (u && canWriteFirestore()) {
      void updateRoadmapHoursInDb(u.uid, roadmapId, hrs, nextWeeks).catch(() => {});
    }
  },

  saveOpportunity(
    opportunityId: string,
    title: string,
    category: string,
    status: OpportunityTrackStatus = "saved",
  ) {
    const u = auth.currentUser;
    const now = Date.now();
    setState((s) => {
      const exists = s.savedOpportunities.some((o) => o.opportunityId === opportunityId);
      const next = exists
        ? s.savedOpportunities.map((o) =>
            o.opportunityId === opportunityId ? { ...o, status, updatedAtMs: now } : o,
          )
        : [
            { opportunityId, title, category, status, savedAtMs: now, updatedAtMs: now },
            ...s.savedOpportunities,
          ];
      return log(
        { ...s, savedOpportunities: next },
        `${exists ? "Updated" : "Saved"} opportunity: ${title}`,
        "opportunity",
      );
    });
    if (u && canWriteFirestore()) {
      void saveOpportunityRecord(u.uid, opportunityId, title, category, status).catch(() => {});
      syncCloudActivity(`Saved opportunity: ${title}`, "opportunity");
    }
  },

  removeOpportunity(opportunityId: string) {
    const u = auth.currentUser;
    setState((s) => ({
      ...s,
      savedOpportunities: s.savedOpportunities.filter((o) => o.opportunityId !== opportunityId),
    }));
    if (u && canWriteFirestore()) {
      void removeSavedOpportunityRecord(u.uid, opportunityId).catch(() => {});
    }
  },

  async addTransition(
    input: Omit<SavedTransitionItem, "id" | "createdAtMs">,
  ): Promise<SavedTransitionItem> {
    const u = auth.currentUser;
    let id = `trn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    if (u && canWriteFirestore()) {
      id = await saveTransitionRecord(u.uid, input);
      syncCloudActivity(`Simulated transition to ${input.targetCareerName}`, "transition");
    }
    const created: SavedTransitionItem = { ...input, id, createdAtMs: Date.now() };
    setState((s) =>
      log(
        { ...s, transitions: [created, ...s.transitions].slice(0, 15) },
        `Simulated transition: ${input.currentRole} → ${input.targetCareerName}`,
        "transition",
      ),
    );
    return created;
  },

  async removeTransition(transitionId: string) {
    const u = auth.currentUser;
    if (u && canWriteFirestore()) {
      await deleteTransitionRecord(u.uid, transitionId).catch(() => {});
    }
    setState((s) => ({
      ...s,
      transitions: s.transitions.filter((t) => t.id !== transitionId),
    }));
  },

  reset() {
    setState(() => DEFAULT);
  },
};

export function roadmapProgress(r?: Roadmap) {
  if (!r || r.tasks.length === 0) return { done: 0, total: 0, pct: 0, phase: 0 };
  const done = r.tasks.filter((t) => t.done).length;
  const next = r.tasks.find((t) => !t.done);
  return {
    done,
    total: r.tasks.length,
    pct: Math.round((done / r.tasks.length) * 100),
    phase: next ? next.phase : 5,
  };
}
