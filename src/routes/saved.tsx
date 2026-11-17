import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark, GitCompareArrows, LogIn } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CareerCard } from "@/components/CareerParts";
import {
  Button,
  Chip,
  EmptyState,
  Glass,
  PageHeader,
  btnClass,
  inputClass,
  selectClass,
} from "@/components/ui-kit";
import { getCareer, type Career } from "@/lib/careers";
import { useCareersCatalog } from "@/lib/careers-service";
import { useUser } from "@/lib/auth";
import { actions, useApp, type SavedFolder } from "@/lib/store";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Careers — Futuroute" },
      {
        name: "description",
        content:
          "Organise your saved careers into Top Choices, Alternative Careers, and Explore Later folders.",
      },
      { property: "og:title", content: "Saved Careers — Futuroute" },
      { property: "og:description", content: "Your saved career shortlist folders." },
    ],
  }),
  component: Saved,
});

const FOLDERS: Array<{ id: SavedFolder; label: string; desc: string }> = [
  {
    id: "top",
    label: "Top Career Choices",
    desc: "Strong contenders you want to examine closely.",
  },
  {
    id: "alternative",
    label: "Alternative Careers",
    desc: "Realistic backup or cross-industry paths.",
  },
  {
    id: "explore_later",
    label: "Explore Later",
    desc: "Interesting discoveries to revisit when you have time.",
  },
];

function Saved() {
  const { user, loading } = useUser();
  const { saved, savedFolders, savedNotes } = useApp();
  const { careers } = useCareersCatalog();
  const [activeTab, setActiveTab] = useState<SavedFolder | "all">("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  if (!loading && !user) {
    return (
      <AppShell>
        <PageHeader
          title="Saved Careers"
          text="Sign in to save careers into Top Choices, Alternative Careers, and Explore Later folders."
        />
        <Glass className="max-w-xl space-y-4">
          <h2 className="font-display text-xl font-semibold">
            Sign in to manage your saved folders
          </h2>
          <p className="text-sm text-text-2">
            Your shortlist folders and personal notes sync safely with your verified Futuroute
            account.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/auth" search={{ next: "/saved" }} className={btnClass("primary")}>
              <LogIn className="size-4" /> Sign in / Register
            </Link>
            <Link to="/discover" className={btnClass("outline")}>
              Browse careers
            </Link>
          </div>
        </Glass>
      </AppShell>
    );
  }

  const allCareers = saved
    .map((id) => getCareer(id, careers))
    .filter((c): c is Career => Boolean(c));

  const visibleCareers =
    activeTab === "all"
      ? allCareers
      : allCareers.filter((c) => (savedFolders[c.id] ?? "top") === activeTab);

  return (
    <AppShell>
      <PageHeader
        title="Saved Careers"
        text="Organise your shortlist into folders, keep personal notes, and compare options side by side."
      >
        {visibleCareers.length >= 2 && (
          <Link
            to="/compare"
            onClick={() => actions.setCompare(visibleCareers.slice(0, 3).map((c) => c.id))}
            className={btnClass("primary")}
          >
            <GitCompareArrows className="size-4" /> Compare{" "}
            {activeTab === "all" ? "top saved" : "folder"}
          </Link>
        )}
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip active={activeTab === "all"} onClick={() => setActiveTab("all")}>
          All Saved ({allCareers.length})
        </Chip>
        {FOLDERS.map((f) => {
          const count = allCareers.filter((c) => (savedFolders[c.id] ?? "top") === f.id).length;
          return (
            <Chip key={f.id} active={activeTab === f.id} onClick={() => setActiveTab(f.id)}>
              {f.label} ({count})
            </Chip>
          );
        })}
      </div>

      {allCareers.length === 0 ? (
        <Glass>
          <EmptyState
            icon={<Bookmark className="size-5" />}
            title="No saved careers yet"
            text="Save careers from Guided Discovery, the 260+ Career Explorer, Compare, or any Career Profile."
            action={{ label: "Discover careers", to: "/discover" }}
          />
        </Glass>
      ) : visibleCareers.length === 0 ? (
        <Glass>
          <p className="text-sm text-text-2">
            No careers in this folder yet. Move any saved career below or save more in Discover.
          </p>
        </Glass>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCareers.map((c) => {
            const folder = savedFolders[c.id] ?? "top";
            const draft = noteDrafts[c.id] ?? savedNotes[c.id] ?? "";
            return (
              <div key={c.id} className="flex flex-col gap-2">
                <CareerCard career={c} />
                <div className="glass-soft space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">Folder:</span>
                    <select
                      aria-label={`Folder for ${c.name}`}
                      value={folder}
                      onChange={(e) => {
                        actions.setSavedFolder(c.id, c.name, e.target.value as SavedFolder);
                        toast.success(`Moved ${c.name}`);
                      }}
                      className={selectClass("h-8 w-auto rounded-lg px-2 text-xs")}
                    >
                      {FOLDERS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      aria-label={`Personal note for ${c.name}`}
                      value={draft}
                      onChange={(e) => setNoteDrafts({ ...noteDrafts, [c.id]: e.target.value })}
                      placeholder="Add personal note…"
                      maxLength={240}
                      className={inputClass("h-8 min-w-0 flex-1 rounded-lg px-2.5 text-xs")}
                    />
                    <Button
                      variant="outline"
                      className="h-8 min-h-8 px-2.5 text-xs"
                      onClick={() => {
                        actions.setSavedNote(c.id, draft);
                        toast.success("Note saved");
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
