import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Glass, PageHeader, btnClass } from "@/components/ui-kit";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Futuroute — How it works" },
      {
        name: "description",
        content:
          "What Futuroute is, how verified career recommendations work, privacy and contact.",
      },
      { property: "og:title", content: "About Futuroute" },
      {
        property: "og:description",
        content: "Career exploration platform across 20 industries — university project.",
      },
    ],
  }),
  component: About,
});

const STATUS = [
  [
    "260+ Verified Careers across 20 Industries",
    "Curated real-world roles spanning Technology, AI, Sports (coaching, analytics, physio), Healthcare, Finance, Law, Science, Creative Arts, Design, Media, Education, Government, Defence, Environment, Hospitality, Engineering, Entrepreneurship, Agriculture, and Social Sciences.",
  ],
  [
    "Multi-Signal Career Matching Engine",
    "Futuroute scores your interests, capabilities, preferred subjects, working style, budget, and weekly study hours directly against our curated 260-career database for instant, honest, repeatable guidance.",
  ],
  [
    "Firebase Auth & Cloud Firestore Sync",
    "Guests can freely browse careers, compare paths, and preview plans. Signed-in users get persistent personalised onboarding profiles, shortlist folders, saved comparisons, and multi-roadmap tracking.",
  ],
];

function About() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="About"
        title="Your future isn't a single decision."
        text="It's a path you can explore. Discover career possibilities across 20 industries, compare trade-offs honestly, try practical mini-challenges, and build a budget-aware roadmap."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Glass>
          <h2 className="font-display text-xl font-semibold">How it works</h2>
          <ol className="mt-3 space-y-3 text-text-2">
            {[
              "Tell us about your interests, capabilities, budget, and study goals.",
              "Review strong matches, cross-industry alternatives, unexpected discoveries, and emerging careers.",
              "Compare 2–3 careers side by side across 13 real dimensions — without declaring a winner.",
              "Build a free-first learning plan and track weekly tasks in My Roadmap.",
            ].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm text-primary-foreground">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <Link to="/discover" className={btnClass("primary", "mt-5")}>
            Start exploring
          </Link>
        </Glass>

        <Glass>
          <h2 className="font-display text-xl font-semibold">Platform architecture & honesty</h2>
          <dl className="mt-3 space-y-3">
            {STATUS.map(([t, d]) => (
              <div key={t}>
                <dt className="font-medium text-cyan">{t}</dt>
                <dd className="text-sm text-text-2">{d}</dd>
              </div>
            ))}
          </dl>
        </Glass>

        <Glass>
          <h2 id="privacy" className="font-display text-xl font-semibold">
            Privacy & security
          </h2>
          <p className="mt-2 text-sm text-text-2">
            Futuroute never sells student data and never promises guaranteed jobs or salaries.
            Account authentication and private data (profiles, shortlist folders, comparisons,
            assessments, and roadmaps) are secured with Firebase Authentication and strict Cloud
            Firestore security rules scoped exclusively to your user ID.
          </p>
        </Glass>

        <Glass>
          <h2 id="contact" className="font-display text-xl font-semibold">
            Contact
          </h2>
          <p className="mt-2 text-sm text-text-2">
            Futuroute is a B.Tech Computer Science and Engineering project at The NorthCap
            University, Gurugram. For questions or feedback, reach out through the university
            project repository.
          </p>
        </Glass>
      </div>
    </AppShell>
  );
}
