import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Glass, PageHeader, Button, Notice, btnClass } from "@/components/ui-kit";
import { logoutUser, useUser } from "@/lib/auth";
import { actions, useApp } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Futuroute" },
      { name: "description", content: "Manage your Futuroute account, cloud sync and local data." },
      { property: "og:title", content: "Settings — Futuroute" },
      { property: "og:description", content: "Manage account and exploration data." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const s = useApp();
  const { user } = useUser();
  const nav = useNavigate();
  const [msg, setMsg] = useState("");

  const exportData = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "futuroute-data.json";
    a.click();
  };

  const handleLogout = async () => {
    await logoutUser();
    toast.success("Signed out");
    nav({ to: "/" });
  };

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        text="Manage your account session, export your exploration data, or reset browser cache."
      />
      <div className="grid max-w-3xl gap-5">
        <Glass>
          <h2 className="font-display text-lg font-semibold">Account & Cloud Sync</h2>
          {user ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-text-2">
                Signed in as <span className="font-medium text-foreground">{user.email}</span> (
                {user.emailVerified ? (
                  <span className="text-success">Verified · Cloud Firestore sync active</span>
                ) : (
                  <span className="text-warning">Email verification pending</span>
                )}
                )
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/profile" className={btnClass("outline")}>
                  <User className="size-4" /> Edit Personal Profile
                </Link>
                <Button variant="ghost" onClick={() => void handleLogout()}>
                  <LogOut className="size-4" /> Sign out
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-text-2">
                You are exploring as a guest. Sign in to sync your profile, shortlist folders,
                comparisons, and roadmaps with Cloud Firestore.
              </p>
              <Link to="/auth" search={{ next: "/settings" }} className={btnClass("primary")}>
                <LogIn className="size-4" /> Sign in / Create account
              </Link>
            </div>
          )}
        </Glass>

        <Glass>
          <h2 className="font-display text-lg font-semibold">Your data</h2>
          <p className="mt-2 text-sm text-text-2">
            Currently loaded: {s.saved.length} saved careers, {s.savedComparisons.length} saved
            comparisons, {Object.keys(s.challenges).length} challenges, {s.roadmaps.length} roadmaps
            ({s.roadmap ? s.roadmap.tasks.length : 0} active tasks), and {s.activity.length}{" "}
            activity events.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}>
              Download my data (JSON)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (
                  confirm(
                    "Clear local browser cache for Futuroute? (Cloud-synced account data remains safe.)",
                  )
                ) {
                  actions.reset();
                  setMsg("Local browser state cleared.");
                }
              }}
            >
              Clear local browser cache
            </Button>
          </div>
          {msg && (
            <div className="mt-3">
              <Notice tone="success">{msg}</Notice>
            </div>
          )}
        </Glass>
      </div>
    </AppShell>
  );
}
