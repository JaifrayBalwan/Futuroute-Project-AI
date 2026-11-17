import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Bell,
  Bookmark,
  Briefcase,
  Compass,
  FlaskConical,
  GitCompareArrows,
  Info,
  LayoutGrid,
  LogIn,
  LogOut,
  Map,
  Menu,
  Search,
  Settings,
  User,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Logo, btnClass } from "./ui-kit";
import { cn } from "@/lib/utils";
import { logoutUser, useUser } from "@/lib/auth";
import { useCareersCatalog } from "@/lib/careers-service";
import { useApp } from "@/lib/store";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/discover", label: "Discover Careers", icon: Compass },
  { to: "/compare", label: "Compare Futures", icon: GitCompareArrows },
  { to: "/roadmap", label: "My Career Roadmap", icon: Map },
  { to: "/simulator", label: "Career Change Simulator", icon: ArrowLeftRight },
  { to: "/opportunities", label: "Opportunity Finder", icon: Briefcase },
  { to: "/planner", label: "Budget Planner", icon: Wallet },
  { to: "/saved", label: "Saved Careers", icon: Bookmark },
  { to: "/try", label: "Try Challenges", icon: FlaskConical },
  { to: "/profile", label: "My Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About Futuroute", icon: Info },
] as const;

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = path === to || (to !== "/dashboard" && path.startsWith(to));
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              active
                ? "border border-lavender/40 bg-lavender/20 text-foreground glow"
                : "border border-transparent text-text-2 hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-lavender-bright")} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountCard({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading } = useUser();
  const { profile } = useApp();
  const nav = useNavigate();

  if (loading) {
    return (
      <div className="glass-soft p-4">
        <p className="text-xs text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-soft space-y-3 p-4">
        <div>
          <p className="text-sm font-medium">Guest explorer</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Browse 260+ careers freely. Sign in to save folders, comparisons, and roadmaps.
          </p>
        </div>
        <Link to="/auth" onClick={onNavigate} className={btnClass("soft", "w-full text-xs")}>
          <LogIn className="size-3.5" /> Sign in / Register
        </Link>
      </div>
    );
  }

  const name = profile?.displayName || user.displayName || user.email?.split("@")[0] || "Explorer";
  const handleSignOut = async () => {
    await logoutUser();
    toast.success("Signed out");
    onNavigate?.();
    nav({ to: "/" });
  };

  return (
    <div className="glass-soft space-y-2.5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <UserCheck className="size-4 shrink-0 text-turquoise" aria-hidden />
      </div>
      {!user.emailVerified && (
        <Link
          to="/auth"
          onClick={onNavigate}
          className="block rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-[11px] text-warning hover:bg-warning/20"
        >
          Verify email to sync cloud data
        </Link>
      )}
      <div className="flex gap-2 pt-1">
        <Link
          to="/profile"
          onClick={onNavigate}
          className={btnClass("outline", "h-8 min-h-8 flex-1 px-2 text-xs")}
        >
          Profile
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className={btnClass("ghost", "h-8 min-h-8 px-2 text-xs")}
          aria-label="Sign out"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function SearchBox() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const { careers } = useCareersCatalog();
  const trimmed = q.trim().toLowerCase();
  const hits =
    trimmed.length < 2
      ? []
      : careers
          .filter((c) =>
            `${c.name} ${c.industry} ${c.subcategory} ${c.skills.join(" ")}`
              .toLowerCase()
              .includes(trimmed),
          )
          .slice(0, 6);

  return (
    <div className="relative w-full max-w-xs">
      <label htmlFor="global-search" className="sr-only">
        Search 260+ careers and skills
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        id="global-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search 260+ careers & skills"
        className="h-10 w-full rounded-xl border border-glass-border bg-popover pl-9 pr-3 text-sm text-foreground placeholder:text-text-2/80 focus-visible:border-cyan focus-visible:outline-none"
      />
      {trimmed.length >= 2 && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-glass-border bg-popover p-1.5 text-popover-foreground shadow-2xl">
          {hits.length === 0 ? (
            <p className="px-3 py-2 text-sm text-text-2">No matches</p>
          ) : (
            hits.map((c) => (
              <button
                key={c.id}
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-popover-foreground transition hover:bg-lavender/20 focus-visible:bg-lavender/25"
                onClick={() => {
                  setQ("");
                  nav({ to: "/careers/$id", params: { id: c.id } });
                }}
              >
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="block text-xs text-text-2">
                  {c.industry} · {c.skills.slice(0, 2).join(", ")}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Activity() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Recent activity"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative grid size-10 place-items-center rounded-xl border border-glass-border bg-secondary hover:bg-accent"
      >
        <Bell className="size-4" />
        {s.activity.length > 0 && (
          <span className="absolute right-2 top-2 size-2 rounded-full bg-cyan" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-glass-border bg-popover p-2 shadow-xl">
          <p className="px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
            Your recent activity
          </p>
          {s.activity.length === 0 ? (
            <p className="px-2 py-3 text-sm text-text-2">Nothing yet — start exploring.</p>
          ) : (
            s.activity.slice(0, 6).map((a) => (
              <p key={a.id} className="rounded-lg px-2 py-2 text-sm text-text-2">
                {a.text}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, greeting }: { children: ReactNode; greeting?: boolean }) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { profile } = useApp();
  const firstName = profile?.displayName?.split(" ")[0] || user?.displayName?.split(" ")[0];

  return (
    <div className="ambient flex min-h-screen w-full">
      <aside className="glass sticky top-4 m-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col gap-6 overflow-y-auto p-4 lg:flex">
        <Link to="/" className="px-2 pt-1">
          <Logo />
        </Link>
        <SideNav />
        <AccountCard />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-background/70"
            onClick={() => setOpen(false)}
          />
          <div className="glass relative m-3 flex h-[calc(100vh-1.5rem)] w-72 flex-col gap-6 overflow-y-auto p-4">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-lg hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>
            <SideNav onNavigate={() => setOpen(false)} />
            <AccountCard onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col px-4 pb-10 lg:pl-0 lg:pr-6">
        <header className="flex flex-wrap items-center gap-3 py-4 lg:py-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center rounded-xl border border-glass-border bg-secondary lg:hidden"
          >
            <Menu className="size-4" />
          </button>
          <Link to="/" className="lg:hidden">
            <Logo size={28} />
          </Link>
          {greeting ? (
            <div className="order-last w-full md:order-none md:w-auto md:flex-1">
              <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                {firstName
                  ? `Good to see you, ${firstName}. Ready to explore your future?`
                  : "Good to see you. Ready to explore your future?"}
              </h1>
              <p className="mt-1 text-text-2">
                Your next step starts with understanding your options.
              </p>
            </div>
          ) : (
            <div className="hidden flex-1 md:block" />
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <SearchBox />
            </div>
            <Activity />
            <Link
              to="/settings"
              aria-label="Settings"
              className="grid size-10 place-items-center rounded-xl border border-glass-border bg-secondary hover:bg-accent"
            >
              <Settings className="size-4" />
            </Link>
            <Link to="/discover" className={btnClass("primary", "hidden md:inline-flex")}>
              Start Exploring
            </Link>
          </div>
        </header>
        <div className="mb-4 sm:hidden">
          <SearchBox />
        </div>
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
