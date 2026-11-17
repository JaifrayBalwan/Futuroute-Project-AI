import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Glass, Chip, Button, Notice, selectClass } from "@/components/ui-kit";
import {
  CAPABILITIES,
  INTERESTS,
  LEARNING_PREFERENCES,
  SUBJECTS,
  friendlyAuthError,
  resendVerificationEmail,
} from "@/lib/auth";
import { getUserProfile, upsertUserProfile, type UserProfileRecord } from "@/lib/db";
import { actions, useApp } from "@/lib/store";

const AGE = ["Under 15", "15–17", "18–21", "22–25", "26+"];
const EDU = [
  "Class 8–10",
  "Class 11–12",
  "Diploma",
  "Undergraduate",
  "Postgraduate",
  "Working / gap year",
];
const STREAM = [
  "Science (PCM)",
  "Science (PCB)",
  "Commerce",
  "Humanities / Arts",
  "Vocational",
  "Not decided / not applicable",
];
const YEAR = ["Year 1", "Year 2", "Year 3", "Year 4+", "Board exam year", "Graduated / gap year"];
const ENV = [
  "Office / desk",
  "Outdoors / on the move",
  "Lab or studio",
  "Remote / from home",
  "With people (schools, clinics, events)",
  "No preference",
];
const BUDGET = [0, 500, 1000, 5000];
const sel = selectClass();

export interface ProfileData {
  displayName: string;
  ageRange: string;
  educationLevel: string;
  stream: string;
  academicYear: string;
  subjects: string[];
  interests: string[];
  capabilities: string[];
  currentSkills: string[];
  weaknesses: string[];
  environment: string;
  budget: number;
  weeklyHours: number;
  learningPreferences: string[];
  shortGoal: string;
  longGoal: string;
  expectedStartingSalaryInr: number | "";
  desiredLongTermSalaryInr: number | "";
  preferredWorkLocation: "India" | "Abroad" | "Both" | "";
  willingToInvestEducation: "Yes" | "Limited / Free-first" | "No" | "";
  educationBudgetInr: number | "";
  willingHigherEducation: "Yes" | "Maybe" | "No" | "";
}

const COMMON_SKILLS = [
  "Python",
  "Excel / Spreadsheets",
  "HTML / CSS",
  "JavaScript",
  "SQL",
  "Figma / Design",
  "Public speaking",
  "Writing & editing",
  "Data analysis",
  "Video editing",
  "Accounting basics",
  "Project planning",
];

const COMMON_WEAKNESSES = [
  "Math-heavy theory",
  "Stage / public speaking",
  "Coding syntax",
  "Time consistency",
  "Long reading sessions",
  "Working under strict deadlines",
];

const EMPTY: ProfileData = {
  displayName: "",
  ageRange: "",
  educationLevel: "",
  stream: "",
  academicYear: "",
  subjects: [],
  interests: [],
  capabilities: [],
  currentSkills: [],
  weaknesses: [],
  environment: "",
  budget: 0,
  weeklyHours: 5,
  learningPreferences: [],
  shortGoal: "",
  longGoal: "",
  expectedStartingSalaryInr: "",
  desiredLongTermSalaryInr: "",
  preferredWorkLocation: "",
  willingToInvestEducation: "",
  educationBudgetInr: "",
  willingHigherEducation: "",
};

const WIZARD_STEPS = [
  {
    key: "personal",
    title: "Personal Information",
    help: "Tell us where you are in school or college. Only your name is required.",
  },
  {
    key: "interests",
    title: "Your Interests",
    help: "Pick everything that sparks curiosity — sports, tech, arts, science, or society.",
  },
  {
    key: "capabilities",
    title: "Skills, Strengths & Subjects",
    help: "Select strengths, current skills, and favourite school or college subjects.",
  },
  {
    key: "preferences",
    title: "Time, Budget & Ambitions",
    help: "Optional preferences so roadmaps and learning plans fit your real life.",
  },
  {
    key: "financial",
    title: "Financial Expectations (Optional)",
    help: "Optional — share salary expectations and study willingness to calibrate compatibility scores.",
  },
] as const;

export function ProfileForm({
  userId,
  email,
  defaultName,
  emailVerified = true,
  onRefreshAuth,
  submitLabel,
  wizard = false,
  onSaved,
}: {
  userId: string;
  email?: string | undefined;
  defaultName?: string | undefined;
  emailVerified?: boolean | undefined;
  onRefreshAuth?: (() => Promise<unknown>) | undefined;
  submitLabel: string;
  wizard?: boolean | undefined;
  onSaved?: (() => void) | undefined;
}) {
  const { profile } = useApp();
  const [d, setD] = useState<ProfileData>({ ...EMPTY, displayName: defaultName ?? "" });
  const [customSkillDraft, setCustomSkillDraft] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setD((x) => ({ ...x, [k]: v }));
  const toggle = (
    k:
      | "subjects"
      | "interests"
      | "capabilities"
      | "learningPreferences"
      | "currentSkills"
      | "weaknesses",
    v: string,
  ) => setD((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const remote = await getUserProfile(userId).catch(() => null);
        const source = remote ?? profile;
        if (!alive) return;
        if (source) {
          setD({
            displayName: source.displayName || defaultName || "",
            ageRange: source.ageRange ?? "",
            educationLevel: source.educationLevel ?? "",
            stream: source.stream ?? "",
            academicYear: source.academicYear ?? "",
            subjects: source.subjects ?? [],
            interests: source.interests ?? [],
            capabilities: source.capabilities ?? [],
            currentSkills: source.currentSkills ?? [],
            weaknesses: source.weaknesses ?? [],
            environment: source.environment ?? "",
            budget: source.budget ?? 0,
            weeklyHours: source.weeklyHours ?? 5,
            learningPreferences: source.learningPreferences ?? [],
            shortGoal: source.shortGoal ?? "",
            longGoal: source.longGoal ?? "",
            expectedStartingSalaryInr:
              typeof source.expectedStartingSalaryInr === "number"
                ? source.expectedStartingSalaryInr
                : "",
            desiredLongTermSalaryInr:
              typeof source.desiredLongTermSalaryInr === "number"
                ? source.desiredLongTermSalaryInr
                : "",
            preferredWorkLocation: source.preferredWorkLocation ?? "",
            willingToInvestEducation: source.willingToInvestEducation ?? "",
            educationBudgetInr:
              typeof source.educationBudgetInr === "number" ? source.educationBudgetInr : "",
            willingHigherEducation: source.willingHigherEducation ?? "",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addCustomSkill = () => {
    const clean = customSkillDraft.trim();
    if (!clean) return;
    if (!d.currentSkills.includes(clean)) {
      set("currentSkills", [...d.currentSkills, clean]);
    }
    setCustomSkillDraft("");
  };

  async function save(allowEmptyInterests = false) {
    setErr("");
    setInfo("");
    if (!d.displayName.trim()) {
      return setErr("Please add your name.");
    }
    if (!allowEmptyInterests && (d.interests.length === 0 || d.capabilities.length === 0)) {
      return setErr(
        "Pick at least one interest and one capability (or adjust them anytime later).",
      );
    }

    setBusy(true);
    const localRecord: UserProfileRecord = {
      uid: userId,
      displayName: d.displayName.trim(),
      email: email || undefined,
      ageRange: d.ageRange || undefined,
      educationLevel: d.educationLevel || undefined,
      stream: d.stream || undefined,
      academicYear: d.academicYear || undefined,
      subjects: d.subjects,
      interests: d.interests,
      capabilities: d.capabilities,
      currentSkills: d.currentSkills,
      weaknesses: d.weaknesses,
      environment: d.environment || undefined,
      budget: Math.max(0, Math.round(d.budget)),
      weeklyHours: Math.max(1, Math.min(40, Math.round(d.weeklyHours))),
      learningPreferences: d.learningPreferences,
      shortGoal: d.shortGoal.trim() || undefined,
      longGoal: d.longGoal.trim() || undefined,
      expectedStartingSalaryInr:
        d.expectedStartingSalaryInr !== ""
          ? Math.max(0, Number(d.expectedStartingSalaryInr))
          : undefined,
      desiredLongTermSalaryInr:
        d.desiredLongTermSalaryInr !== ""
          ? Math.max(0, Number(d.desiredLongTermSalaryInr))
          : undefined,
      preferredWorkLocation: d.preferredWorkLocation || undefined,
      willingToInvestEducation: d.willingToInvestEducation || undefined,
      educationBudgetInr:
        d.educationBudgetInr !== "" ? Math.max(0, Number(d.educationBudgetInr)) : undefined,
      willingHigherEducation: d.willingHigherEducation || undefined,
      onboarded: true,
    };

    try {
      actions.setProfile(localRecord);
      if (emailVerified) {
        await upsertUserProfile(userId, localRecord);
        toast.success("Profile saved to your account");
      } else {
        toast.success("Profile saved locally — verify your email to sync across devices");
      }
      onSaved?.();
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Couldn't save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    try {
      await resendVerificationEmail();
      setInfo("Verification email sent. Click the link, then refresh your status.");
    } catch (x) {
      setErr(friendlyAuthError(x));
    }
  }

  if (loading) {
    return (
      <Glass>
        <p className="text-sm text-text-2">Loading your profile…</p>
      </Glass>
    );
  }

  const Sel = ({
    k,
    opts,
    label,
  }: {
    k: "ageRange" | "educationLevel" | "stream" | "academicYear" | "environment";
    opts: string[];
    label: string;
  }) => (
    <label className="grid gap-1 text-sm">
      {label}
      <select className={sel} value={d[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">Choose… (optional)</option>
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );

  const personalSection = (
    <Glass>
      <h2 className="font-display text-lg font-semibold">1 · Personal Information</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm sm:col-span-2">
          Your Name *
          <input
            className={sel}
            value={d.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="e.g. Riya Verma"
          />
        </label>
        <Sel k="ageRange" opts={AGE} label="Age range" />
        <Sel k="educationLevel" opts={EDU} label="Education level" />
        <Sel k="stream" opts={STREAM} label="Academic stream" />
        <Sel k="academicYear" opts={YEAR} label="Current academic year" />
      </div>
    </Glass>
  );

  const interestsSection = (
    <Glass>
      <h2 className="font-display text-lg font-semibold">
        2 · Interests ({d.interests.length} selected)
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Select as many as apply.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {INTERESTS.map(([id, l]) => (
          <Chip key={id} active={d.interests.includes(id)} onClick={() => toggle("interests", id)}>
            {l}
          </Chip>
        ))}
      </div>
    </Glass>
  );

  const capabilitiesSection = (
    <div className="grid gap-5">
      <Glass>
        <h2 className="font-display text-lg font-semibold">
          3 · Capabilities & Strengths ({d.capabilities.length} selected)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick skills and qualities you feel comfortable using or want to grow.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CAPABILITIES.map(([id, l]) => (
            <Chip
              key={id}
              active={d.capabilities.includes(id)}
              onClick={() => toggle("capabilities", id)}
            >
              {l}
            </Chip>
          ))}
        </div>
      </Glass>
      <Glass>
        <h2 className="font-display text-lg font-semibold">
          Current Skills & Growth Areas (optional)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Helps Career Compatibility & Simulator identify skills you already hold vs gaps to learn.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMMON_SKILLS.map((sk) => (
            <Chip
              key={sk}
              active={d.currentSkills.includes(sk)}
              onClick={() => toggle("currentSkills", sk)}
            >
              {sk}
            </Chip>
          ))}
          {d.currentSkills
            .filter((sk) => !COMMON_SKILLS.includes(sk))
            .map((sk) => (
              <Chip key={sk} active onClick={() => toggle("currentSkills", sk)}>
                {sk} ×
              </Chip>
            ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={customSkillDraft}
            onChange={(e) => setCustomSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSkill();
              }
            }}
            placeholder="Add another skill (e.g. Canva, CAD, Tally)…"
            className={`${sel} max-w-xs`}
          />
          <Button variant="outline" onClick={addCustomSkill}>
            Add skill
          </Button>
        </div>
        <p className="mt-4 text-xs font-medium text-text-2">
          Areas you find challenging (optional — helps flag honest trade-offs):
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMON_WEAKNESSES.map((wk) => (
            <Chip
              key={wk}
              active={d.weaknesses.includes(wk)}
              onClick={() => toggle("weaknesses", wk)}
            >
              {wk}
            </Chip>
          ))}
        </div>
      </Glass>
      <Glass>
        <h2 className="font-display text-lg font-semibold">Favourite Subjects (optional)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <Chip key={s} active={d.subjects.includes(s)} onClick={() => toggle("subjects", s)}>
              {s}
            </Chip>
          ))}
        </div>
      </Glass>
    </div>
  );

  const preferencesSection = (
    <Glass>
      <h2 className="font-display text-lg font-semibold">4 · Preferences, Time & Goals</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Sel k="environment" opts={ENV} label="Preferred working environment" />
        <label className="grid gap-1 text-sm">
          Weekly available time:{" "}
          <span className="font-medium text-cyan">{d.weeklyHours} hours/week</span>
          <input
            type="range"
            min={1}
            max={35}
            value={d.weeklyHours}
            onChange={(e) => set("weeklyHours", Number(e.target.value))}
            className="mt-2 accent-[var(--cyan)]"
          />
        </label>
        <div className="grid gap-1 text-sm sm:col-span-2">
          Available learning budget (INR)
          <div className="flex flex-wrap items-center gap-2">
            {BUDGET.map((b) => (
              <Chip key={b} active={d.budget === b} onClick={() => set("budget", b)}>
                ₹{b.toLocaleString("en-IN")}
              </Chip>
            ))}
            <label className="flex items-center gap-2 text-xs text-text-2">
              Custom ₹
              <input
                type="number"
                min={0}
                className={`${sel} w-28`}
                value={d.budget}
                onChange={(e) => set("budget", Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
          </div>
        </div>
        <div className="grid gap-2 text-sm sm:col-span-2">
          <span>Learning preferences (multiple allowed)</span>
          <div className="flex flex-wrap gap-2">
            {LEARNING_PREFERENCES.map((lp) => (
              <Chip
                key={lp}
                active={d.learningPreferences.includes(lp)}
                onClick={() => toggle("learningPreferences", lp)}
              >
                {lp}
              </Chip>
            ))}
          </div>
        </div>
        <label className="grid gap-1 text-sm">
          Short-term career ambition
          <input
            className={sel}
            value={d.shortGoal}
            onChange={(e) => set("shortGoal", e.target.value)}
            placeholder="e.g. Build my first analytics project"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Long-term career ambition
          <input
            className={sel}
            value={d.longGoal}
            onChange={(e) => set("longGoal", e.target.value)}
            placeholder="e.g. Work in sports performance or AI"
          />
        </label>
      </div>
    </Glass>
  );

  const financialSection = (
    <Glass>
      <h2 className="font-display text-lg font-semibold">
        5 · Financial Expectations & Study Investment (Optional)
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Completely optional and skippable. Helps Futuroute compare indicative market ranges against
        your goals.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Expected annual starting salary (INR)
          <select
            className={sel}
            value={d.expectedStartingSalaryInr}
            onChange={(e) =>
              set("expectedStartingSalaryInr", e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">Choose or skip…</option>
            <option value={300000}>₹3,00,000 / yr (₹3 LPA)</option>
            <option value={500000}>₹5,00,000 / yr (₹5 LPA)</option>
            <option value={800000}>₹8,00,000 / yr (₹8 LPA)</option>
            <option value={1200000}>₹12,00,000 / yr (₹12 LPA)</option>
            <option value={1800000}>₹18,00,000 / yr (₹18 LPA)</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Desired long-term annual salary (INR, 8+ yrs)
          <select
            className={sel}
            value={d.desiredLongTermSalaryInr}
            onChange={(e) =>
              set("desiredLongTermSalaryInr", e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">Choose or skip…</option>
            <option value={1000000}>₹10,00,000 / yr (₹10 LPA)</option>
            <option value={1800000}>₹18,00,000 / yr (₹18 LPA)</option>
            <option value={2500000}>₹25,00,000 / yr (₹25 LPA)</option>
            <option value={4000000}>₹40,00,000 / yr (₹40 LPA)</option>
            <option value={6000000}>₹60,00,000+ / yr (₹60+ LPA)</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Preferred work location
          <select
            className={sel}
            value={d.preferredWorkLocation}
            onChange={(e) =>
              set("preferredWorkLocation", e.target.value as ProfileData["preferredWorkLocation"])
            }
          >
            <option value="">Choose or skip…</option>
            <option value="India">India</option>
            <option value="Abroad">Abroad</option>
            <option value="Both">Both India & Abroad</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Willingness to invest in paid education / courses
          <select
            className={sel}
            value={d.willingToInvestEducation}
            onChange={(e) =>
              set(
                "willingToInvestEducation",
                e.target.value as ProfileData["willingToInvestEducation"],
              )
            }
          >
            <option value="">Choose or skip…</option>
            <option value="Yes">Yes (degrees, bootcamps & certificates)</option>
            <option value="Limited / Free-first">Limited / Free-first resources preferred</option>
            <option value="No">No (₹0 free resources only)</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Preferred multi-year education budget (INR, optional)
          <input
            type="number"
            min={0}
            className={sel}
            value={d.educationBudgetInr}
            onChange={(e) =>
              set(
                "educationBudgetInr",
                e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0),
              )
            }
            placeholder="e.g. 50000 or 0"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Willingness for higher education (Master&apos;s / PG / Licensing)
          <select
            className={sel}
            value={d.willingHigherEducation}
            onChange={(e) =>
              set("willingHigherEducation", e.target.value as ProfileData["willingHigherEducation"])
            }
          >
            <option value="">Choose or skip…</option>
            <option value="Yes">Yes</option>
            <option value="Maybe">Maybe, depending on career fit</option>
            <option value="No">No — prefer entering workforce sooner</option>
          </select>
        </label>
      </div>
    </Glass>
  );

  const verificationBanner = !emailVerified && (
    <Notice tone="warn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>Your email is not yet verified. Cloud Firestore saves will sync once verified.</span>
        <div className="flex gap-2">
          <Button variant="outline" className="h-8 min-h-8 px-2.5 text-xs" onClick={handleResend}>
            Resend email
          </Button>
          {onRefreshAuth && (
            <Button
              variant="soft"
              className="h-8 min-h-8 px-2.5 text-xs"
              onClick={() => void onRefreshAuth()}
            >
              Refresh status
            </Button>
          )}
        </div>
      </div>
    </Notice>
  );

  if (wizard) {
    const cur = WIZARD_STEPS[step]!;
    const handleWizardNext = () => {
      setErr("");
      if (step === 0 && !d.displayName.trim()) {
        return setErr("Please enter your name before continuing.");
      }
      if (step < WIZARD_STEPS.length - 1) {
        setStep(step + 1);
      } else {
        void save(true);
      }
    };

    return (
      <div className="grid gap-5">
        {verificationBanner}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-2">
            <span>
              Step {step + 1} of {WIZARD_STEPS.length} — {cur.title}
            </span>
            <span>{Math.round(((step + 1) / WIZARD_STEPS.length) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{cur.help}</p>
        </div>

        {step === 0 && personalSection}
        {step === 1 && interestsSection}
        {step === 2 && capabilitiesSection}
        {step === 3 && preferencesSection}
        {step === 4 && financialSection}

        {err && <Notice tone="warn">{err}</Notice>}
        {info && <Notice tone="success">{info}</Notice>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => {
              setErr("");
              setStep(Math.max(0, step - 1));
            }}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div className="flex flex-wrap gap-2">
            {step > 0 && step < WIZARD_STEPS.length - 1 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setErr("");
                  setStep(step + 1);
                }}
              >
                Skip step
              </Button>
            )}
            <Button onClick={handleWizardNext} disabled={busy}>
              {busy ? (
                "Saving…"
              ) : step === WIZARD_STEPS.length - 1 ? (
                <>
                  <Check className="size-4" /> {submitLabel}
                </>
              ) : (
                <>
                  Next <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {verificationBanner}
      {personalSection}
      {interestsSection}
      {capabilitiesSection}
      {preferencesSection}
      {financialSection}
      {err && <Notice tone="warn">{err}</Notice>}
      {info && <Notice tone="success">{info}</Notice>}
      <div>
        <Button onClick={() => void save(false)} disabled={busy} className="h-11 px-6">
          {busy ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
