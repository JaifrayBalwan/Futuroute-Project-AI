import { collection, doc, getDocs, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { CAREERS, type Career, type Industry } from "./careers";
import { db, handleFirestoreError, OperationType } from "./firebase";

let cachedCatalog: Career[] | null = null;
let loadPromise: Promise<Career[]> | null = null;

function mergeCareers(remote: Career[]): Career[] {
  const byId = new Map<string, Career>(CAREERS.map((c) => [c.id, c]));
  for (const r of remote) {
    if (r && r.id && r.name && r.industry) {
      byId.set(r.id, r);
    }
  }
  return Array.from(byId.values());
}

export async function fetchCareersCatalog(force = false): Promise<Career[]> {
  if (!force && cachedCatalog) return cachedCatalog;
  if (!force && loadPromise) return loadPromise;

  loadPromise = (async () => {
    const path = "careers";
    try {
      const snap = await getDocs(collection(db, "careers"));
      if (snap.empty) {
        cachedCatalog = CAREERS;
        return CAREERS;
      }
      const remote: Career[] = snap.docs.map((d) => {
        const data = d.data();
        const fallback = CAREERS.find((x) => x.id === d.id);
        return {
          ...(fallback ?? CAREERS[0]!),
          id: String(data["id"] ?? d.id),
          name: String(data["name"] ?? fallback?.name ?? d.id),
          industry: (data["industry"] as Industry) ?? fallback?.industry ?? "Technology & IT",
          subcategory: String(data["subcategory"] ?? fallback?.subcategory ?? "General"),
          short: String(data["short"] ?? fallback?.short ?? ""),
          day: String(data["day"] ?? fallback?.day ?? ""),
          hue: (data["hue"] as Career["hue"]) ?? fallback?.hue ?? "lavender",
          responsibilities: Array.isArray(data["responsibilities"])
            ? (data["responsibilities"] as string[])
            : (fallback?.responsibilities ?? []),
          skills: Array.isArray(data["skills"])
            ? (data["skills"] as string[])
            : (fallback?.skills ?? []),
          capabilities: Array.isArray(data["capabilities"])
            ? (data["capabilities"] as string[])
            : (fallback?.capabilities ?? []),
          interests: Array.isArray(data["interests"])
            ? (data["interests"] as string[])
            : (fallback?.interests ?? []),
          subjects: Array.isArray(data["subjects"])
            ? (data["subjects"] as string[])
            : (fallback?.subjects ?? []),
          pathways: Array.isArray(data["pathways"])
            ? (data["pathways"] as string[])
            : (fallback?.pathways ?? []),
          altRoutes: Array.isArray(data["altRoutes"])
            ? (data["altRoutes"] as string[])
            : (fallback?.altRoutes ?? []),
          projects: Array.isArray(data["projects"])
            ? (data["projects"] as string[])
            : (fallback?.projects ?? []),
          commitment: String(data["commitment"] ?? fallback?.commitment ?? ""),
          commitmentLevel: Number(data["commitmentLevel"] ?? fallback?.commitmentLevel ?? 3),
          estimatedCostNote: String(data["estimatedCostNote"] ?? fallback?.estimatedCostNote ?? ""),
          progression: Array.isArray(data["progression"])
            ? (data["progression"] as string[])
            : (fallback?.progression ?? []),
          freelanceOpportunity: String(
            data["freelanceOpportunity"] ?? fallback?.freelanceOpportunity ?? "",
          ),
          entrepreneurshipOpportunity: String(
            data["entrepreneurshipOpportunity"] ?? fallback?.entrepreneurshipOpportunity ?? "",
          ),
          entryLevelOpportunities: String(
            data["entryLevelOpportunities"] ?? fallback?.entryLevelOpportunities ?? "",
          ),
          pros: Array.isArray(data["pros"]) ? (data["pros"] as string[]) : (fallback?.pros ?? []),
          cons: Array.isArray(data["cons"]) ? (data["cons"] as string[]) : (fallback?.cons ?? []),
          resources: Array.isArray(data["resources"])
            ? (data["resources"] as Career["resources"])
            : (fallback?.resources ?? []),
          trial: String(data["trial"] ?? fallback?.trial ?? ""),
          challengeId: String(data["challengeId"] ?? fallback?.challengeId ?? "software"),
          emerging: Boolean(data["emerging"] ?? fallback?.emerging ?? false),
          environment: String(data["environment"] ?? fallback?.environment ?? "Office / desk"),
          minEducation: String(data["minEducation"] ?? fallback?.minEducation ?? "Class 12"),
          budgetTier: Number(data["budgetTier"] ?? fallback?.budgetTier ?? 0),
          tags: Array.isArray(data["tags"]) ? (data["tags"] as string[]) : (fallback?.tags ?? []),
        };
      });
      cachedCatalog = mergeCareers(remote);
      return cachedCatalog;
    } catch {
      cachedCatalog = CAREERS;
      return CAREERS;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function useCareersCatalog(): {
  careers: Career[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [careers, setCareers] = useState<Career[]>(cachedCatalog ?? CAREERS);
  const [loading, setLoading] = useState(!cachedCatalog);

  const refresh = async () => {
    setLoading(true);
    const list = await fetchCareersCatalog(true);
    setCareers(list);
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    let alive = true;
    fetchCareersCatalog().then((list) => {
      if (alive) {
        setCareers(list);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return { careers, loading, refresh };
}

function toFirestoreCareerPayload(c: Career) {
  return {
    id: c.id,
    name: c.name.slice(0, 120),
    industry: c.industry.slice(0, 80),
    subcategory: c.subcategory.slice(0, 80),
    short: c.short.slice(0, 300),
    day: c.day.slice(0, 1000),
    hue: c.hue,
    responsibilities: c.responsibilities.slice(0, 15),
    skills: c.skills.slice(0, 20),
    capabilities: c.capabilities.slice(0, 20),
    interests: c.interests.slice(0, 20),
    subjects: c.subjects.slice(0, 15),
    pathways: c.pathways.slice(0, 12),
    altRoutes: c.altRoutes.slice(0, 12),
    projects: c.projects.slice(0, 12),
    commitment: c.commitment.slice(0, 300),
    commitmentLevel: Math.max(1, Math.min(5, Math.round(c.commitmentLevel))),
    estimatedCostNote: c.estimatedCostNote.slice(0, 400),
    progression: c.progression.slice(0, 10),
    freelanceOpportunity: c.freelanceOpportunity.slice(0, 300),
    entrepreneurshipOpportunity: c.entrepreneurshipOpportunity.slice(0, 300),
    entryLevelOpportunities: c.entryLevelOpportunities.slice(0, 300),
    pros: c.pros.slice(0, 10),
    cons: c.cons.slice(0, 10),
    resources: c.resources.slice(0, 12),
    trial: c.trial.slice(0, 400),
    challengeId: c.challengeId.slice(0, 64),
    emerging: Boolean(c.emerging),
    environment: c.environment.slice(0, 100),
    minEducation: c.minEducation.slice(0, 80),
    budgetTier: Math.max(0, Math.min(1_000_000, Math.round(c.budgetTier))),
    tags: c.tags.slice(0, 30),
    updatedAt: serverTimestamp(),
  };
}

export async function seedAllCareersToFirestore(): Promise<number> {
  const path = "careers";
  try {
    // Batch writes max 500 ops; use chunks of 100 for reliable commits
    const chunkSize = 100;
    for (let i = 0; i < CAREERS.length; i += chunkSize) {
      const batch = writeBatch(db);
      for (const career of CAREERS.slice(i, i + chunkSize)) {
        batch.set(doc(db, "careers", career.id), toFirestoreCareerPayload(career));
      }
      await batch.commit();
    }
    cachedCatalog = CAREERS;
    return CAREERS.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveSingleCareerToFirestore(career: Career): Promise<void> {
  const cleanId = career.id
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 128);
  const path = `careers/${cleanId}`;
  try {
    const normalized: Career = { ...career, id: cleanId };
    await setDoc(doc(db, "careers", cleanId), toFirestoreCareerPayload(normalized));
    cachedCatalog = mergeCareers([normalized]);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
