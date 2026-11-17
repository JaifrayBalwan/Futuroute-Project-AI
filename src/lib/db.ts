import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";

export type SavedFolder = "top" | "alternative" | "explore_later";

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  email?: string | undefined;
  ageRange?: string | undefined;
  educationLevel?: string | undefined;
  stream?: string | undefined;
  academicYear?: string | undefined;
  subjects: string[];
  interests: string[];
  capabilities: string[];
  currentSkills?: string[] | undefined;
  weaknesses?: string[] | undefined;
  environment?: string | undefined;
  budget: number;
  weeklyHours: number;
  learningPreferences: string[];
  shortGoal?: string | undefined;
  longGoal?: string | undefined;
  expectedStartingSalaryInr?: number | undefined;
  desiredLongTermSalaryInr?: number | undefined;
  preferredWorkLocation?: "India" | "Abroad" | "Both" | undefined;
  willingToInvestEducation?: "Yes" | "Limited / Free-first" | "No" | undefined;
  educationBudgetInr?: number | undefined;
  willingHigherEducation?: "Yes" | "Maybe" | "No" | undefined;
  onboarded: boolean;
  createdAt?: Timestamp | unknown;
  updatedAt?: Timestamp | unknown;
}

export interface SavedCareerRecord {
  userId: string;
  careerId: string;
  folder: SavedFolder;
  note?: string | undefined;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ComparisonRecord {
  id: string;
  userId: string;
  careerIds: string[];
  title: string;
  note?: string | undefined;
  createdAtMs: number;
}

export interface AssessmentRecord {
  id: string;
  userId: string;
  answers: Record<string, unknown>;
  groups: Record<string, unknown>;
  source: "gemini" | "deterministic";
  createdAtMs: number;
}

export interface RoadmapRecord {
  id: string;
  userId: string;
  careerId: string;
  title: string;
  level: "beginner" | "some" | "comfortable";
  hours: number;
  budget: number;
  format?: string | undefined;
  project?: string | undefined;
  weeks?: number | undefined;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface RoadmapTaskRecord {
  id: string;
  userId: string;
  roadmapId: string;
  phase: number;
  week?: number | undefined;
  position: number;
  title: string;
  desc?: string | undefined;
  effort?: string | undefined;
  objectives?: string[] | undefined;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | undefined;
  practicalTask?: string | undefined;
  freeAlternative?: { name: string; url: string } | null | undefined;
  note?: string | undefined;
  resource?: { name: string; url: string } | null;
  done: boolean;
}

export interface LearningPlanRecord {
  id: string;
  userId: string;
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
}

export interface ChallengeRecord {
  userId: string;
  challengeId: string;
  answer?: string | undefined;
  correct: boolean;
  enjoy?: "enjoyed" | "okay" | "not" | undefined;
  reflection?: string | undefined;
}

export type OpportunityTrackStatus = "saved" | "planning" | "applied";

export interface SavedOpportunityRecord {
  userId: string;
  opportunityId: string;
  title: string;
  category: string;
  status: OpportunityTrackStatus;
  savedAtMs: number;
  updatedAtMs: number;
}

export interface CareerTransitionRecord {
  id: string;
  userId: string;
  currentRole: string;
  targetCareerId: string;
  targetCareerName: string;
  existingSkills: string[];
  missingSkills: string[];
  compatibilityScore: number;
  estimatedWeeks: number;
  budgetInr?: number | undefined;
  weeklyHours?: number | undefined;
  createdAtMs: number;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  text: string;
  kind:
    | "save"
    | "compare"
    | "task"
    | "challenge"
    | "roadmap"
    | "discover"
    | "transition"
    | "opportunity";
  createdAtMs: number;
}

const cleanStr = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const cleanList = (arr: unknown, maxItems: number, maxLen = 80): string[] => {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item === "string" && item.trim()) {
      out.push(item.trim().slice(0, maxLen));
      if (out.length >= maxItems) break;
    }
  }
  return out;
};

const toMs = (t: unknown): number => {
  if (
    t &&
    typeof t === "object" &&
    "toMillis" in t &&
    typeof (t as Timestamp).toMillis === "function"
  ) {
    return (t as Timestamp).toMillis();
  }
  return Date.now();
};

export const safeId = (raw: string): string =>
  raw.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 128) || "item";

export function canWriteFirestore(): boolean {
  return Boolean(auth.currentUser && auth.currentUser.emailVerified);
}

export async function getUserProfile(uid: string): Promise<UserProfileRecord | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: String(d["uid"] ?? uid),
      displayName: String(d["displayName"] ?? ""),
      email: typeof d["email"] === "string" ? d["email"] : undefined,
      ageRange: typeof d["ageRange"] === "string" ? d["ageRange"] : undefined,
      educationLevel: typeof d["educationLevel"] === "string" ? d["educationLevel"] : undefined,
      stream: typeof d["stream"] === "string" ? d["stream"] : undefined,
      academicYear: typeof d["academicYear"] === "string" ? d["academicYear"] : undefined,
      subjects: Array.isArray(d["subjects"]) ? (d["subjects"] as string[]) : [],
      interests: Array.isArray(d["interests"]) ? (d["interests"] as string[]) : [],
      capabilities: Array.isArray(d["capabilities"]) ? (d["capabilities"] as string[]) : [],
      currentSkills: Array.isArray(d["currentSkills"]) ? (d["currentSkills"] as string[]) : [],
      weaknesses: Array.isArray(d["weaknesses"]) ? (d["weaknesses"] as string[]) : [],
      environment: typeof d["environment"] === "string" ? d["environment"] : undefined,
      budget: typeof d["budget"] === "number" ? d["budget"] : 0,
      weeklyHours: typeof d["weeklyHours"] === "number" ? d["weeklyHours"] : 5,
      learningPreferences: Array.isArray(d["learningPreferences"])
        ? (d["learningPreferences"] as string[])
        : [],
      shortGoal: typeof d["shortGoal"] === "string" ? d["shortGoal"] : undefined,
      longGoal: typeof d["longGoal"] === "string" ? d["longGoal"] : undefined,
      expectedStartingSalaryInr:
        typeof d["expectedStartingSalaryInr"] === "number"
          ? d["expectedStartingSalaryInr"]
          : undefined,
      desiredLongTermSalaryInr:
        typeof d["desiredLongTermSalaryInr"] === "number"
          ? d["desiredLongTermSalaryInr"]
          : undefined,
      preferredWorkLocation:
        d["preferredWorkLocation"] === "India" ||
        d["preferredWorkLocation"] === "Abroad" ||
        d["preferredWorkLocation"] === "Both"
          ? d["preferredWorkLocation"]
          : undefined,
      willingToInvestEducation:
        d["willingToInvestEducation"] === "Yes" ||
        d["willingToInvestEducation"] === "Limited / Free-first" ||
        d["willingToInvestEducation"] === "No"
          ? d["willingToInvestEducation"]
          : undefined,
      educationBudgetInr:
        typeof d["educationBudgetInr"] === "number" ? d["educationBudgetInr"] : undefined,
      willingHigherEducation:
        d["willingHigherEducation"] === "Yes" ||
        d["willingHigherEducation"] === "Maybe" ||
        d["willingHigherEducation"] === "No"
          ? d["willingHigherEducation"]
          : undefined,
      onboarded: Boolean(d["onboarded"]),
      createdAt: d["createdAt"],
      updatedAt: d["updatedAt"],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertUserProfile(
  uid: string,
  input: Omit<UserProfileRecord, "uid" | "createdAt" | "updatedAt">,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const path = `users/${uid}`;
  const ref = doc(db, "users", uid);
  try {
    const existing = await getDoc(ref);
    const payload: Record<string, unknown> = {
      uid,
      displayName: cleanStr(input.displayName, 100) || "Student",
      subjects: cleanList(input.subjects, 20),
      interests: cleanList(input.interests, 25),
      capabilities: cleanList(input.capabilities, 20),
      currentSkills: cleanList(input.currentSkills ?? [], 25),
      weaknesses: cleanList(input.weaknesses ?? [], 15),
      budget: Math.max(0, Math.min(10_000_000, Math.round(Number(input.budget) || 0))),
      weeklyHours: Math.max(1, Math.min(60, Math.round(Number(input.weeklyHours) || 5))),
      learningPreferences: cleanList(input.learningPreferences, 10),
      onboarded: Boolean(input.onboarded),
      updatedAt: serverTimestamp(),
    };
    if (input.email) payload["email"] = cleanStr(input.email, 200);
    if (input.ageRange) payload["ageRange"] = cleanStr(input.ageRange, 40);
    if (input.educationLevel) payload["educationLevel"] = cleanStr(input.educationLevel, 80);
    if (input.stream) payload["stream"] = cleanStr(input.stream, 80);
    if (input.academicYear) payload["academicYear"] = cleanStr(input.academicYear, 60);
    if (input.environment) payload["environment"] = cleanStr(input.environment, 100);
    if (input.shortGoal) payload["shortGoal"] = cleanStr(input.shortGoal, 240);
    if (input.longGoal) payload["longGoal"] = cleanStr(input.longGoal, 240);
    if (
      typeof input.expectedStartingSalaryInr === "number" &&
      input.expectedStartingSalaryInr >= 0
    ) {
      payload["expectedStartingSalaryInr"] = Math.min(
        100_000_000,
        Math.round(input.expectedStartingSalaryInr),
      );
    }
    if (typeof input.desiredLongTermSalaryInr === "number" && input.desiredLongTermSalaryInr >= 0) {
      payload["desiredLongTermSalaryInr"] = Math.min(
        500_000_000,
        Math.round(input.desiredLongTermSalaryInr),
      );
    }
    if (input.preferredWorkLocation) {
      payload["preferredWorkLocation"] = input.preferredWorkLocation;
    }
    if (input.willingToInvestEducation) {
      payload["willingToInvestEducation"] = input.willingToInvestEducation;
    }
    if (typeof input.educationBudgetInr === "number" && input.educationBudgetInr >= 0) {
      payload["educationBudgetInr"] = Math.min(50_000_000, Math.round(input.educationBudgetInr));
    }
    if (input.willingHigherEducation) {
      payload["willingHigherEducation"] = input.willingHigherEducation;
    }

    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function logUserActivity(
  uid: string,
  text: string,
  kind: ActivityRecord["kind"],
): Promise<void> {
  if (!canWriteFirestore()) return;
  const id = `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const path = `users/${uid}/activity/${id}`;
  try {
    await setDoc(doc(db, "users", uid, "activity", id), {
      userId: uid,
      text: cleanStr(text, 240) || "Updated exploration",
      kind,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listUserActivity(uid: string): Promise<ActivityRecord[]> {
  const path = `users/${uid}/activity`;
  try {
    const q = query(
      collection(db, "users", uid, "activity"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: String(data["userId"] ?? uid),
        text: String(data["text"] ?? ""),
        kind: (data["kind"] as ActivityRecord["kind"]) ?? "discover",
        createdAtMs: toMs(data["createdAt"]),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listSavedCareers(uid: string): Promise<SavedCareerRecord[]> {
  const path = `users/${uid}/saved_careers`;
  try {
    const q = query(collection(db, "users", uid, "saved_careers"), where("userId", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        userId: String(data["userId"] ?? uid),
        careerId: String(data["careerId"] ?? d.id),
        folder: (data["folder"] as SavedFolder) ?? "top",
        note: typeof data["note"] === "string" ? data["note"] : undefined,
        createdAt: data["createdAt"],
        updatedAt: data["updatedAt"],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCareerToFolder(
  uid: string,
  careerId: string,
  folder: SavedFolder = "top",
  note?: string,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const cid = safeId(careerId);
  const path = `users/${uid}/saved_careers/${cid}`;
  const ref = doc(db, "users", uid, "saved_careers", cid);
  try {
    const existing = await getDoc(ref);
    const payload: Record<string, unknown> = {
      userId: uid,
      careerId: cid,
      folder,
      updatedAt: serverTimestamp(),
    };
    if (note !== undefined) payload["note"] = cleanStr(note, 400);
    if (existing.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeSavedCareer(uid: string, careerId: string): Promise<void> {
  if (!canWriteFirestore()) return;
  const cid = safeId(careerId);
  const path = `users/${uid}/saved_careers/${cid}`;
  try {
    await deleteDoc(doc(db, "users", uid, "saved_careers", cid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveComparison(
  uid: string,
  careerIds: string[],
  title: string,
  note?: string,
): Promise<string> {
  const id = `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  if (!canWriteFirestore()) return id;
  const path = `users/${uid}/comparisons/${id}`;
  try {
    const payload: Record<string, unknown> = {
      userId: uid,
      careerIds: cleanList(careerIds, 3, 128),
      title: cleanStr(title, 180) || "Career Comparison",
      createdAt: serverTimestamp(),
    };
    if (note) payload["note"] = cleanStr(note, 500);
    await setDoc(doc(db, "users", uid, "comparisons", id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listComparisons(uid: string): Promise<ComparisonRecord[]> {
  const path = `users/${uid}/comparisons`;
  try {
    const q = query(
      collection(db, "users", uid, "comparisons"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: String(data["userId"] ?? uid),
        careerIds: Array.isArray(data["careerIds"]) ? (data["careerIds"] as string[]) : [],
        title: String(data["title"] ?? "Comparison"),
        note: typeof data["note"] === "string" ? data["note"] : undefined,
        createdAtMs: toMs(data["createdAt"]),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteComparison(uid: string, comparisonId: string): Promise<void> {
  if (!canWriteFirestore()) return;
  const id = safeId(comparisonId);
  const path = `users/${uid}/comparisons/${id}`;
  try {
    await deleteDoc(doc(db, "users", uid, "comparisons", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAssessment(
  uid: string,
  answers: Record<string, unknown>,
  groups: Record<string, unknown>,
  source: "gemini" | "deterministic",
): Promise<string> {
  const id = `asm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  if (!canWriteFirestore()) return id;
  const path = `users/${uid}/assessments/${id}`;
  try {
    // Bound answers map keys to stay well below Firestore rules limit (<=30 keys)
    const boundedAnswers: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(answers).slice(0, 25)) {
      boundedAnswers[k] = v;
    }
    const boundedGroups: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(groups).slice(0, 6)) {
      boundedGroups[k] = v;
    }
    await setDoc(doc(db, "users", uid, "assessments", id), {
      userId: uid,
      answers: boundedAnswers,
      groups: boundedGroups,
      source,
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listAssessments(uid: string): Promise<AssessmentRecord[]> {
  const path = `users/${uid}/assessments`;
  try {
    const q = query(
      collection(db, "users", uid, "assessments"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: String(data["userId"] ?? uid),
        answers: (data["answers"] as Record<string, unknown>) ?? {},
        groups: (data["groups"] as Record<string, unknown>) ?? {},
        source: data["source"] === "gemini" ? "gemini" : "deterministic",
        createdAtMs: toMs(data["createdAt"]),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createRoadmapWithTasks(
  uid: string,
  roadmap: Omit<RoadmapRecord, "id" | "userId" | "createdAtMs" | "updatedAtMs">,
  tasks: Array<Omit<RoadmapTaskRecord, "userId" | "roadmapId">>,
): Promise<string> {
  const roadmapId = `rm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  if (!canWriteFirestore()) return roadmapId;
  const roadmapPath = `users/${uid}/roadmaps/${roadmapId}`;
  try {
    const rmRef = doc(db, "users", uid, "roadmaps", roadmapId);
    await setDoc(rmRef, {
      userId: uid,
      careerId: safeId(roadmap.careerId),
      title: cleanStr(roadmap.title, 160) || "Learning Roadmap",
      level: roadmap.level,
      hours: Math.max(1, Math.min(60, Math.round(roadmap.hours))),
      budget: Math.max(0, Math.min(10_000_000, Math.round(roadmap.budget))),
      format: cleanStr(roadmap.format ?? "mixed", 40),
      project: cleanStr(roadmap.project ?? "", 300),
      weeks: Math.max(1, Math.min(260, Math.round(roadmap.weeks ?? 8))),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const batch = writeBatch(db);
    tasks.slice(0, 60).forEach((t, idx) => {
      const tid = safeId(t.id || `task-${idx + 1}`);
      const tRef = doc(db, "users", uid, "roadmaps", roadmapId, "tasks", tid);
      const taskDoc: Record<string, unknown> = {
        userId: uid,
        roadmapId,
        phase: Math.max(1, Math.min(5, Math.round(t.phase))),
        week: Math.max(1, Math.min(260, Math.round(t.week ?? idx + 1))),
        position: idx,
        title: cleanStr(t.title, 200) || `Task ${idx + 1}`,
        desc: cleanStr(t.desc ?? "", 600),
        effort: cleanStr(t.effort ?? "", 80),
        resource:
          t.resource && t.resource.name && t.resource.url
            ? { name: cleanStr(t.resource.name, 160), url: cleanStr(t.resource.url, 400) }
            : null,
        freeAlternative:
          t.freeAlternative && t.freeAlternative.name && t.freeAlternative.url
            ? {
                name: cleanStr(t.freeAlternative.name, 160),
                url: cleanStr(t.freeAlternative.url, 400),
              }
            : null,
        done: Boolean(t.done),
        updatedAt: serverTimestamp(),
      };
      if (t.objectives?.length) taskDoc["objectives"] = cleanList(t.objectives, 8, 180);
      if (t.difficulty) taskDoc["difficulty"] = t.difficulty;
      if (t.practicalTask) taskDoc["practicalTask"] = cleanStr(t.practicalTask, 400);
      batch.set(tRef, taskDoc);
    });
    await batch.commit();
    return roadmapId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, roadmapPath);
  }
}

export async function listRoadmapsWithTasks(
  uid: string,
): Promise<Array<RoadmapRecord & { tasks: RoadmapTaskRecord[] }>> {
  const path = `users/${uid}/roadmaps`;
  try {
    const q = query(
      collection(db, "users", uid, "roadmaps"),
      where("userId", "==", uid),
      orderBy("updatedAt", "desc"),
      limit(20),
    );
    const snap = await getDocs(q);
    const out: Array<RoadmapRecord & { tasks: RoadmapTaskRecord[] }> = [];
    for (const d of snap.docs) {
      const data = d.data();
      const tasksPath = `users/${uid}/roadmaps/${d.id}/tasks`;
      let tasks: RoadmapTaskRecord[] = [];
      try {
        const tq = query(
          collection(db, "users", uid, "roadmaps", d.id, "tasks"),
          where("userId", "==", uid),
          orderBy("position", "asc"),
        );
        const tSnap = await getDocs(tq);
        tasks = tSnap.docs.map((td) => {
          const tdData = td.data();
          const diff = tdData["difficulty"];
          return {
            id: td.id,
            userId: String(tdData["userId"] ?? uid),
            roadmapId: d.id,
            phase: Number(tdData["phase"] ?? 1),
            week: typeof tdData["week"] === "number" ? tdData["week"] : undefined,
            position: Number(tdData["position"] ?? 0),
            title: String(tdData["title"] ?? ""),
            desc: typeof tdData["desc"] === "string" ? tdData["desc"] : undefined,
            effort: typeof tdData["effort"] === "string" ? tdData["effort"] : undefined,
            objectives: Array.isArray(tdData["objectives"])
              ? (tdData["objectives"] as string[])
              : undefined,
            difficulty:
              diff === "Beginner" || diff === "Intermediate" || diff === "Advanced"
                ? diff
                : undefined,
            practicalTask:
              typeof tdData["practicalTask"] === "string" ? tdData["practicalTask"] : undefined,
            freeAlternative:
              (tdData["freeAlternative"] as { name: string; url: string } | null) ?? null,
            note: typeof tdData["note"] === "string" ? tdData["note"] : undefined,
            resource: (tdData["resource"] as { name: string; url: string } | null) ?? null,
            done: Boolean(tdData["done"]),
          };
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, tasksPath);
      }

      out.push({
        id: d.id,
        userId: String(data["userId"] ?? uid),
        careerId: String(data["careerId"] ?? ""),
        title: String(data["title"] ?? "Roadmap"),
        level: (data["level"] as RoadmapRecord["level"]) ?? "beginner",
        hours: Number(data["hours"] ?? 5),
        budget: Number(data["budget"] ?? 0),
        format: typeof data["format"] === "string" ? data["format"] : undefined,
        project: typeof data["project"] === "string" ? data["project"] : undefined,
        weeks: typeof data["weeks"] === "number" ? data["weeks"] : undefined,
        createdAtMs: toMs(data["createdAt"]),
        updatedAtMs: toMs(data["updatedAt"]),
        tasks,
      });
    }
    return out;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function toggleRoadmapTaskInDb(
  uid: string,
  roadmapId: string,
  taskId: string,
  done: boolean,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const path = `users/${uid}/roadmaps/${roadmapId}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, "users", uid, "roadmaps", roadmapId, "tasks", taskId), {
      done,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "users", uid, "roadmaps", roadmapId), {
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateRoadmapTaskNoteInDb(
  uid: string,
  roadmapId: string,
  taskId: string,
  note: string,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const path = `users/${uid}/roadmaps/${roadmapId}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, "users", uid, "roadmaps", roadmapId, "tasks", taskId), {
      note: cleanStr(note, 400),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "users", uid, "roadmaps", roadmapId), {
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addCustomTaskToRoadmap(
  uid: string,
  roadmapId: string,
  task: Omit<RoadmapTaskRecord, "userId" | "roadmapId">,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const tid = safeId(task.id);
  const path = `users/${uid}/roadmaps/${roadmapId}/tasks/${tid}`;
  try {
    const taskDoc: Record<string, unknown> = {
      userId: uid,
      roadmapId,
      phase: Math.max(1, Math.min(5, Math.round(task.phase))),
      week: Math.max(1, Math.min(260, Math.round(task.week ?? 1))),
      position: Math.max(0, Math.min(500, Math.round(task.position))),
      title: cleanStr(task.title, 200),
      desc: cleanStr(task.desc ?? "", 600),
      effort: cleanStr(task.effort ?? "", 80),
      resource: task.resource ?? null,
      done: Boolean(task.done),
      updatedAt: serverTimestamp(),
    };
    if (task.objectives?.length) taskDoc["objectives"] = cleanList(task.objectives, 8, 180);
    if (task.difficulty) taskDoc["difficulty"] = task.difficulty;
    if (task.practicalTask) taskDoc["practicalTask"] = cleanStr(task.practicalTask, 400);
    await setDoc(doc(db, "users", uid, "roadmaps", roadmapId, "tasks", tid), taskDoc);
    await updateDoc(doc(db, "users", uid, "roadmaps", roadmapId), {
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resetRoadmapTasksInDb(
  uid: string,
  roadmapId: string,
  taskIds: string[],
): Promise<void> {
  if (!canWriteFirestore() || taskIds.length === 0) return;
  const path = `users/${uid}/roadmaps/${roadmapId}/tasks`;
  try {
    const batch = writeBatch(db);
    for (const tid of taskIds.slice(0, 60)) {
      batch.update(doc(db, "users", uid, "roadmaps", roadmapId, "tasks", tid), {
        done: false,
        updatedAt: serverTimestamp(),
      });
    }
    batch.update(doc(db, "users", uid, "roadmaps", roadmapId), {
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateRoadmapHoursInDb(
  uid: string,
  roadmapId: string,
  hours: number,
  weeks: number,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const path = `users/${uid}/roadmaps/${roadmapId}`;
  try {
    await updateDoc(doc(db, "users", uid, "roadmaps", roadmapId), {
      hours: Math.max(1, Math.min(60, Math.round(hours))),
      weeks: Math.max(1, Math.min(260, Math.round(weeks))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateRoadmapTitleInDb(
  uid: string,
  roadmapId: string,
  title: string,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const path = `users/${uid}/roadmaps/${roadmapId}`;
  try {
    await updateDoc(doc(db, "users", uid, "roadmaps", roadmapId), {
      title: cleanStr(title, 160) || "Learning Roadmap",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRoadmapWithTasks(uid: string, roadmapId: string): Promise<void> {
  if (!canWriteFirestore()) return;
  const path = `users/${uid}/roadmaps/${roadmapId}`;
  try {
    const tSnap = await getDocs(
      query(
        collection(db, "users", uid, "roadmaps", roadmapId, "tasks"),
        where("userId", "==", uid),
      ),
    );
    const batch = writeBatch(db);
    tSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "users", uid, "roadmaps", roadmapId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveChallengeAttempt(
  uid: string,
  challengeId: string,
  payload: Omit<ChallengeRecord, "userId" | "challengeId">,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const cid = safeId(challengeId);
  const path = `users/${uid}/challenges/${cid}`;
  try {
    const ref = doc(db, "users", uid, "challenges", cid);
    const existing = await getDoc(ref);
    const docData: Record<string, unknown> = {
      userId: uid,
      challengeId: cid,
      correct: Boolean(payload.correct),
      updatedAt: serverTimestamp(),
    };
    if (payload.answer !== undefined) docData["answer"] = cleanStr(payload.answer, 500);
    if (payload.enjoy !== undefined) docData["enjoy"] = payload.enjoy;
    if (payload.reflection !== undefined) docData["reflection"] = cleanStr(payload.reflection, 600);
    if (existing.exists()) {
      await updateDoc(ref, docData);
    } else {
      await setDoc(ref, docData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function listChallengeAttempts(uid: string): Promise<Record<string, ChallengeRecord>> {
  const path = `users/${uid}/challenges`;
  try {
    const q = query(collection(db, "users", uid, "challenges"), where("userId", "==", uid));
    const snap = await getDocs(q);
    const map: Record<string, ChallengeRecord> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      map[d.id] = {
        userId: String(data["userId"] ?? uid),
        challengeId: d.id,
        answer: typeof data["answer"] === "string" ? data["answer"] : undefined,
        correct: Boolean(data["correct"]),
        enjoy: data["enjoy"] as ChallengeRecord["enjoy"] | undefined,
        reflection: typeof data["reflection"] === "string" ? data["reflection"] : undefined,
      };
    });
    return map;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveLearningPlan(
  uid: string,
  input: Omit<LearningPlanRecord, "id" | "userId" | "createdAtMs">,
): Promise<string> {
  const id = `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  if (!canWriteFirestore()) return id;
  const path = `users/${uid}/learning_plans/${id}`;
  try {
    const budget = Math.max(0, Math.min(10_000_000, Math.round(input.budget)));
    const recommendedSpend = Math.max(0, Math.min(budget, Math.round(input.recommendedSpend)));
    const payload: Record<string, unknown> = {
      userId: uid,
      careerId: safeId(input.careerId),
      careerName: cleanStr(input.careerName, 120) || "Career Plan",
      level: input.level,
      budget,
      recommendedSpend,
      hours: Math.max(1, Math.min(60, Math.round(input.hours))),
      device: cleanStr(input.device, 40) || "laptop",
      format: cleanStr(input.format, 40) || "mixed",
      outcome: cleanStr(input.outcome, 40) || "fundamentals",
      weeks: Math.max(1, Math.min(260, Math.round(input.weeks))),
      itemIds: cleanList(input.itemIds, 20, 80),
      createdAt: serverTimestamp(),
    };
    if (input.aiSummary) payload["aiSummary"] = cleanStr(input.aiSummary, 600);
    await setDoc(doc(db, "users", uid, "learning_plans", id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listLearningPlans(uid: string): Promise<LearningPlanRecord[]> {
  const path = `users/${uid}/learning_plans`;
  try {
    const q = query(
      collection(db, "users", uid, "learning_plans"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: String(data["userId"] ?? uid),
        careerId: String(data["careerId"] ?? ""),
        careerName: String(data["careerName"] ?? "Career Plan"),
        level: (data["level"] as LearningPlanRecord["level"]) ?? "beginner",
        budget: Number(data["budget"] ?? 0),
        recommendedSpend: Number(data["recommendedSpend"] ?? 0),
        hours: Number(data["hours"] ?? 5),
        device: typeof data["device"] === "string" ? data["device"] : "laptop",
        format: typeof data["format"] === "string" ? data["format"] : "mixed",
        outcome: typeof data["outcome"] === "string" ? data["outcome"] : "fundamentals",
        weeks: typeof data["weeks"] === "number" ? data["weeks"] : 6,
        itemIds: Array.isArray(data["itemIds"]) ? (data["itemIds"] as string[]) : [],
        aiSummary: typeof data["aiSummary"] === "string" ? data["aiSummary"] : undefined,
        createdAtMs: toMs(data["createdAt"]),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteLearningPlan(uid: string, planId: string): Promise<void> {
  if (!canWriteFirestore()) return;
  const id = safeId(planId);
  const path = `users/${uid}/learning_plans/${id}`;
  try {
    await deleteDoc(doc(db, "users", uid, "learning_plans", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listSavedOpportunities(uid: string): Promise<SavedOpportunityRecord[]> {
  const path = `users/${uid}/saved_opportunities`;
  try {
    const q = query(
      collection(db, "users", uid, "saved_opportunities"),
      where("userId", "==", uid),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const rawStatus = data["status"];
      const status: OpportunityTrackStatus =
        rawStatus === "planning" || rawStatus === "applied" ? rawStatus : "saved";
      return {
        userId: String(data["userId"] ?? uid),
        opportunityId: String(data["opportunityId"] ?? d.id),
        title: String(data["title"] ?? "Opportunity"),
        category: String(data["category"] ?? "Internships"),
        status,
        savedAtMs: toMs(data["savedAt"]),
        updatedAtMs: toMs(data["updatedAt"]),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveOpportunityRecord(
  uid: string,
  opportunityId: string,
  title: string,
  category: string,
  status: OpportunityTrackStatus = "saved",
): Promise<void> {
  if (!canWriteFirestore()) return;
  const oid = safeId(opportunityId);
  const path = `users/${uid}/saved_opportunities/${oid}`;
  const ref = doc(db, "users", uid, "saved_opportunities", oid);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, { status, updatedAt: serverTimestamp() });
    } else {
      await setDoc(ref, {
        userId: uid,
        opportunityId: oid,
        title: cleanStr(title, 180) || "Opportunity",
        category: cleanStr(category, 60) || "Internships",
        status,
        savedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeSavedOpportunityRecord(
  uid: string,
  opportunityId: string,
): Promise<void> {
  if (!canWriteFirestore()) return;
  const oid = safeId(opportunityId);
  const path = `users/${uid}/saved_opportunities/${oid}`;
  try {
    await deleteDoc(doc(db, "users", uid, "saved_opportunities", oid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listTransitions(uid: string): Promise<CareerTransitionRecord[]> {
  const path = `users/${uid}/career_transitions`;
  try {
    const q = query(
      collection(db, "users", uid, "career_transitions"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(15),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: String(data["userId"] ?? uid),
        currentRole: String(data["currentRole"] ?? "Beginner"),
        targetCareerId: String(data["targetCareerId"] ?? ""),
        targetCareerName: String(data["targetCareerName"] ?? ""),
        existingSkills: Array.isArray(data["existingSkills"])
          ? (data["existingSkills"] as string[])
          : [],
        missingSkills: Array.isArray(data["missingSkills"])
          ? (data["missingSkills"] as string[])
          : [],
        compatibilityScore: Number(data["compatibilityScore"] ?? 50),
        estimatedWeeks: Number(data["estimatedWeeks"] ?? 12),
        budgetInr: typeof data["budgetInr"] === "number" ? data["budgetInr"] : undefined,
        weeklyHours: typeof data["weeklyHours"] === "number" ? data["weeklyHours"] : undefined,
        createdAtMs: toMs(data["createdAt"]),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveTransitionRecord(
  uid: string,
  input: Omit<CareerTransitionRecord, "id" | "userId" | "createdAtMs">,
): Promise<string> {
  const id = `trn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  if (!canWriteFirestore()) return id;
  const path = `users/${uid}/career_transitions/${id}`;
  try {
    const payload: Record<string, unknown> = {
      userId: uid,
      currentRole: cleanStr(input.currentRole, 120) || "Beginner",
      targetCareerId: safeId(input.targetCareerId),
      targetCareerName: cleanStr(input.targetCareerName, 120) || "Target Career",
      existingSkills: cleanList(input.existingSkills, 25, 80),
      missingSkills: cleanList(input.missingSkills, 25, 80),
      compatibilityScore: Math.max(0, Math.min(100, Math.round(input.compatibilityScore))),
      estimatedWeeks: Math.max(1, Math.min(260, Math.round(input.estimatedWeeks))),
      createdAt: serverTimestamp(),
    };
    if (typeof input.budgetInr === "number") {
      payload["budgetInr"] = Math.max(0, Math.min(10_000_000, Math.round(input.budgetInr)));
    }
    if (typeof input.weeklyHours === "number") {
      payload["weeklyHours"] = Math.max(1, Math.min(60, Math.round(input.weeklyHours)));
    }
    await setDoc(doc(db, "users", uid, "career_transitions", id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteTransitionRecord(uid: string, transitionId: string): Promise<void> {
  if (!canWriteFirestore()) return;
  const id = safeId(transitionId);
  const path = `users/${uid}/career_transitions/${id}`;
  try {
    await deleteDoc(doc(db, "users", uid, "career_transitions", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
