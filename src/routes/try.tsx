import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Glass, Chip, Button, PageHeader, Notice, textareaClass } from "@/components/ui-kit";
import { actions, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Ch = {
  id: string;
  label: string;
  title: string;
  instructions: string;
  visual?: "ui" | "chart" | "code" | "pitch" | "finance" | "lab";
  options: string[];
  correct: number | null;
  explain: string;
  skills: string[];
  reflection: string;
};

const CHALLENGES: Ch[] = [
  {
    id: "software",
    label: "Software Development",
    title: "Trace the loop",
    visual: "code",
    instructions: "Read the code below. What value does total have at the end?",
    options: ["10", "15", "5", "20"],
    correct: 1,
    explain:
      "The loop adds 1 + 2 + 3 + 4 + 5, so total ends at 15. Following code step by step like this is something developers do every day.",
    skills: ["Logical thinking", "Reading code", "Attention to detail"],
    reflection: "Did you work it out in your head, on paper, or by guessing?",
  },
  {
    id: "uiux",
    label: "UI/UX Design",
    title: "Spot the usability problem",
    visual: "ui",
    instructions: "Look at the sample sign-up form. What is the biggest usability problem?",
    options: [
      "The colours are too bright",
      "No labels, so users forget what each field is for",
      "The button is too big",
      "There are too few fields",
    ],
    correct: 1,
    explain:
      "Placeholder-only fields disappear when you start typing, so people forget what goes where. The text is also low-contrast. Designers look for problems like these to help users.",
    skills: ["Empathy", "Observation", "Accessibility awareness"],
    reflection: "What other improvement would you make to this form?",
  },
  {
    id: "data",
    label: "Data Analytics",
    title: "Read the chart",
    visual: "chart",
    instructions:
      "This chart shows library visits each month at a sample college. What is the most reasonable conclusion?",
    options: [
      "Visits rise steadily all year",
      "Visits peak in the exam month (Apr) and drop in the holiday (May)",
      "Visits are random",
      "The library should close in May",
    ],
    correct: 1,
    explain:
      "The data shows a clear peak and a drop. Guessing at causes (exams, holidays) is reasonable, but closing the library goes beyond what the data shows. Analysts keep conclusions in line with the evidence.",
    skills: ["Interpreting data", "Careful reasoning", "Communication"],
    reflection: "What extra data would help you be more confident?",
  },
  {
    id: "cyber",
    label: "Cybersecurity",
    title: "The suspicious message",
    instructions:
      "You get an SMS: “Your bank account will be blocked today. Verify now: bank-secure-kyc.co/login”. What is the safest action?",
    options: [
      "Click the link and log in quickly",
      "Reply asking if it's real",
      "Ignore the link and contact the bank through its official app or number",
      "Forward it to friends to warn them",
    ],
    correct: 2,
    explain:
      "Urgency plus an unofficial link is a classic phishing sign. Checking through an official channel avoids the trap. Security analysts spot these patterns and teach others to stay safe.",
    skills: ["Threat recognition", "Calm decision-making", "Digital safety"],
    reflection: "Which detail made the message look suspicious to you?",
  },
  {
    id: "marketing",
    label: "Digital Marketing",
    title: "Pitch a campaign",
    instructions:
      "A local café wants more students on weekday afternoons. Choose an audience, then write a one-line campaign idea.",
    options: ["College students nearby", "Office workers", "Families with kids", "Tourists"],
    correct: null,
    explain:
      "There's no single right answer. Marketers match a message to an audience and then test it. For students, ideas like study-friendly Wi-Fi or a student-ID discount usually fit well.",
    skills: ["Audience thinking", "Copywriting", "Creativity"],
    reflection: "How would you measure whether your idea worked?",
  },
  {
    id: "football",
    label: "Sports & Football Analysis",
    title: "Read the halftime stats",
    visual: "pitch",
    instructions:
      "Your team has 64% possession and 11 shots, but 9 shots were taken from outside the box and you conceded 2 counter-attacks. What tactical adjustment makes the most sense?",
    options: [
      "Shoot even more often from 30 yards",
      "Work closer combinations into the box and keep one midfielder deeper for counter-press cover",
      "Tell defenders to join every corner kick with no cover",
      "Sub off the goalkeeper immediately",
    ],
    correct: 1,
    explain:
      "High shot volume from long range usually yields low expected goals (xG), while leaving space behind exposes transitions. Football coaches and performance analysts pair stats with video to refine positioning.",
    skills: ["Tactical awareness", "Performance analysis", "Decision-making"],
    reflection: "Do you prefer breaking down match numbers or leading training on the pitch?",
  },
  {
    id: "business",
    label: "Business & Entrepreneurship",
    title: "Validate a student product",
    visual: "finance",
    instructions:
      "Before building a campus laundry-pickup app for 3 months, what is the smartest way to test whether students actually want it?",
    options: [
      "Spend ₹50,000 on flyers and a custom logo first",
      "Offer manual pickup slots via a simple form to 20 hostel students this weekend and observe repeat usage",
      "Wait until the app has 25 extra features",
      "Assume friends saying 'nice idea' guarantees paid orders",
    ],
    correct: 1,
    explain:
      "Founders and product managers test core demand early using lightweight experiments before investing heavy time or capital.",
    skills: ["Customer discovery", "Resourcefulness", "Prioritisation"],
    reflection: "What question would you ask those first 20 students afterward?",
  },
  {
    id: "science",
    label: "Science & Research",
    title: "Check the study claim",
    visual: "lab",
    instructions:
      "A headline claims 'Drinking green tea doubles exam scores' based on a 12-person survey with no control group. How should a researcher respond?",
    options: [
      "Accept the headline as proven medical fact",
      "Point out the tiny sample size, lack of control group, and confusion between correlation and causation",
      "Claim green tea has zero biological compounds",
      "Share it immediately as advice",
    ],
    correct: 1,
    explain:
      "Critical evaluation of sample size, study design, and confounding variables is the foundation of scientific, healthcare, and policy research.",
    skills: ["Critical thinking", "Scientific method", "Evidence evaluation"],
    reflection: "How would you design a fairer test with a control group?",
  },
];

export const Route = createFileRoute("/try")({
  validateSearch: (s: Record<string, unknown>) =>
    (typeof s["c"] === "string" ? { c: s["c"] } : {}) as { c?: string },
  head: () => ({
    meta: [
      { title: "Try Before You Choose — Futuroute" },
      {
        name: "description",
        content:
          "Short interactive challenges across 8 career domains to feel what real work involves.",
      },
      { property: "og:title", content: "Try Before You Choose — Futuroute" },
      {
        property: "og:description",
        content: "Mini career challenges with instant feedback and reflection.",
      },
    ],
  }),
  component: TryPage,
});

function Visual({ v }: { v?: Ch["visual"] }) {
  if (v === "code")
    return (
      <pre className="glass-soft overflow-x-auto p-4 font-mono text-sm text-turquoise">{`let total = 0;\nfor (let i = 1; i <= 5; i++) {\n  total = total + i;\n}`}</pre>
    );
  if (v === "ui")
    return (
      <div
        className="mx-auto max-w-xs rounded-2xl bg-muted p-5"
        aria-label="Sample sign-up form with placeholder-only fields and low-contrast text"
      >
        <p className="mb-3 text-center text-sm text-muted-foreground/60">sign up</p>
        {["name", "email", "pass"].map((p) => (
          <div
            key={p}
            className="mb-2 rounded-md border border-glass-border px-3 py-2 text-xs text-muted-foreground/50"
          >
            {p}
          </div>
        ))}
        <div className="mt-3 rounded-md bg-secondary py-2 text-center text-xs text-muted-foreground/60">
          go
        </div>
      </div>
    );
  if (v === "chart") {
    const d = [
      ["Jan", 40],
      ["Feb", 45],
      ["Mar", 60],
      ["Apr", 90],
      ["May", 20],
      ["Jun", 35],
    ] as const;
    return (
      <div
        className="glass-soft flex h-44 items-end gap-3 p-4"
        role="img"
        aria-label="Bar chart: Jan 40, Feb 45, Mar 60, Apr 90, May 20, Jun 35"
      >
        {d.map(([m, n]) => (
          <div key={m} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs text-text-2">{n}</span>
            <div className="w-full rounded-t-md bg-brand" style={{ height: `${n}%` }} />
            <span className="text-xs text-muted-foreground">{m}</span>
          </div>
        ))}
      </div>
    );
  }
  if (v === "pitch") {
    return (
      <div className="glass-soft grid grid-cols-3 gap-3 p-4 text-center text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Possession</p>
          <p className="font-display text-xl text-cyan">64%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Long-range shots</p>
          <p className="font-display text-xl text-warning">9 / 11</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Counters conceded</p>
          <p className="font-display text-xl text-pink">2 goals</p>
        </div>
      </div>
    );
  }
  return null;
}

function TryPage() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const { challenges } = useApp();
  const ch = CHALLENGES.find((c) => c.id === search.c) ?? CHALLENGES[0]!;
  const saved = challenges[ch.id];
  const [pick, setPick] = useState<number | null>(null);
  const [idea, setIdea] = useState("");
  const [err, setErr] = useState("");
  const [refl, setRefl] = useState("");
  const submitted = !!saved?.answer;

  const submit = () => {
    if (pick === null) return setErr("Choose an answer first.");
    if (ch.correct === null && idea.trim().length < 5)
      return setErr("Write a short campaign idea (at least a few words).");
    setErr("");
    const answer =
      ch.correct === null ? `${ch.options[pick]}: ${idea.trim()}` : (ch.options[pick] ?? "");
    actions.setChallenge(
      ch.id,
      { answer, correct: ch.correct === null || pick === ch.correct, at: Date.now() },
      `Completed the ${ch.label} challenge`,
    );
  };

  const select = (id: string) => {
    setPick(null);
    setIdea("");
    setErr("");
    setRefl("");
    nav({ to: "/try", search: { c: id } });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Mini challenges"
        title="Try Before You Choose"
        text="Five-minute tasks across 8 fields that give you a feel for real work. Notice what engages your curiosity."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {CHALLENGES.map((c) => (
          <Chip key={c.id} active={c.id === ch.id} onClick={() => select(c.id)}>
            {challenges[c.id]?.answer ? "✓ " : ""}
            {c.label}
          </Chip>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Glass>
          <p className="text-xs uppercase tracking-wider text-cyan">{ch.label}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{ch.title}</h2>
          <p className="mt-2 text-text-2">{ch.instructions}</p>
          {ch.visual && (
            <div className="mt-5">
              <Visual v={ch.visual} />
            </div>
          )}
          {submitted ? (
            <div className="mt-6 space-y-3">
              <Notice tone={saved.correct ? "success" : "warn"}>
                <span className="flex items-start gap-2">
                  {saved.correct ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <XCircle className="size-4 shrink-0" />
                  )}
                  <span>
                    Your answer: {saved.answer}.{" "}
                    {ch.correct !== null &&
                      !saved.correct &&
                      `A better answer: ${ch.options[ch.correct]}.`}
                  </span>
                </span>
              </Notice>
              <p className="text-sm text-text-2">{ch.explain}</p>
              <Button
                variant="ghost"
                onClick={() => {
                  actions.setChallenge(ch.id, { answer: "", correct: false });
                  setPick(null);
                }}
              >
                Try again
              </Button>
            </div>
          ) : (
            <fieldset className="mt-6">
              <legend className="sr-only">Answer options</legend>
              <div className="grid gap-2">
                {ch.options.map((o, i) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={pick === i}
                    onClick={() => setPick(i)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm transition",
                      pick === i
                        ? "border-lavender/60 bg-lavender/20"
                        : "border-glass-border bg-secondary hover:bg-accent",
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {ch.correct === null && (
                <div className="mt-4">
                  <label htmlFor="idea" className="mb-1.5 block text-sm text-text-2">
                    Your campaign idea
                  </label>
                  <textarea
                    id="idea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={3}
                    maxLength={300}
                    className={textareaClass()}
                    placeholder="e.g. “Study Hour: free refills 2–5pm with student ID”"
                  />
                </div>
              )}
              {err && (
                <div className="mt-3">
                  <Notice tone="warn">{err}</Notice>
                </div>
              )}
              <Button className="mt-4" onClick={submit}>
                Submit answer
              </Button>
            </fieldset>
          )}
        </Glass>
        <div className="space-y-6">
          <Glass>
            <h3 className="font-display text-lg font-semibold">Skills involved</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {ch.skills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </Glass>
          {submitted && (
            <Glass>
              <h3 className="font-display text-lg font-semibold">Did you enjoy this activity?</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["enjoyed", "Enjoyed it"],
                    ["okay", "It was okay"],
                    ["not", "Not for me"],
                  ] as const
                ).map(([v, l]) => (
                  <Chip
                    key={v}
                    active={saved.enjoy === v}
                    onClick={() => actions.setChallenge(ch.id, { enjoy: v })}
                  >
                    {l}
                  </Chip>
                ))}
              </div>
              <label htmlFor="refl" className="mt-5 block text-sm text-text-2">
                Optional reflection: {ch.reflection}
              </label>
              <textarea
                id="refl"
                rows={3}
                maxLength={500}
                value={refl || saved.reflection || ""}
                onChange={(e) => setRefl(e.target.value)}
                className={textareaClass("mt-2")}
              />
              <Button
                variant="soft"
                className="mt-2"
                onClick={() => actions.setChallenge(ch.id, { reflection: refl.trim() })}
                disabled={!refl.trim()}
              >
                Save reflection
              </Button>
              {saved.reflection && <p className="mt-2 text-xs text-success">Reflection saved.</p>}
            </Glass>
          )}
        </div>
      </div>
    </AppShell>
  );
}
