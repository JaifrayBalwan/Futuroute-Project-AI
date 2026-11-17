import { Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, ArrowRight, Sparkles } from "lucide-react";
import { HUE_CLASS, type Career } from "@/lib/careers";
import { useCareersCatalog } from "@/lib/careers-service";
import { actions, useApp, type SavedFolder } from "@/lib/store";
import { Chip, btnClass } from "./ui-kit";
import { cn } from "@/lib/utils";

export function SaveButton({
  career,
  compact,
  folder = "top",
}: {
  career: Career;
  compact?: boolean;
  folder?: SavedFolder;
}) {
  const { saved, savedFolders } = useApp();
  const on = saved.includes(career.id);
  const currentFolder = savedFolders[career.id] ?? folder;
  return (
    <button
      type="button"
      onClick={() => actions.toggleSave(career.id, career.name, currentFolder)}
      aria-pressed={on}
      aria-label={on ? `Remove ${career.name} from saved` : `Save ${career.name}`}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm transition",
        on
          ? "border-turquoise/40 bg-turquoise/15 text-turquoise"
          : "border-glass-border bg-secondary text-text-2 hover:text-foreground",
      )}
    >
      {on ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {!compact && (on ? "Saved" : "Save")}
    </button>
  );
}

export function CareerCard({ career }: { career: Career }) {
  const h = HUE_CLASS[career.hue];
  return (
    <article className="glass flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-lavender/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl border font-display font-semibold",
              h.bg,
              h.border,
              h.text,
            )}
          >
            {career.name[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {career.industry}
            </p>
            {career.emerging && (
              <span className="inline-flex items-center gap-1 text-[11px] text-cyan">
                <Sparkles className="size-3" /> Emerging
              </span>
            )}
          </div>
        </div>
        <SaveButton career={career} compact />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">{career.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-text-2">{career.short}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {career.skills.slice(0, 3).map((s) => (
          <Chip key={s} className="text-xs">
            {s}
          </Chip>
        ))}
      </div>
      <Link to="/careers/$id" params={{ id: career.id }} className={btnClass("outline", "mt-auto")}>
        Explore Career <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

const NODE_POSITIONS = [
  { x: 300, y: 50 },
  { x: 340, y: 120 },
  { x: 330, y: 195 },
  { x: 300, y: 265 },
  { x: 170, y: 290 },
  { x: 160, y: 20 },
];

const DEFAULT_NODE_IDS = [
  "software-developer",
  "sports-analytics-engineer",
  "data-analyst",
  "ui-ux-designer",
  "cybersecurity-analyst",
  "digital-marketer",
];

export function RouteMap({ className }: { className?: string }) {
  const nav = useNavigate();
  const { saved, recent } = useApp();
  const { careers } = useCareersCatalog();
  const o = { x: 60, y: 160 };

  const pickedIds = Array.from(new Set([...saved.slice(0, 4), ...DEFAULT_NODE_IDS])).slice(0, 6);
  const nodes = pickedIds
    .map((id, idx) => {
      const career = careers.find((c) => c.id === id);
      const pos = NODE_POSITIONS[idx];
      return career && pos ? { career, x: pos.x, y: pos.y } : null;
    })
    .filter((n): n is { career: Career; x: number; y: number } => Boolean(n));

  return (
    <svg
      viewBox="0 0 420 320"
      className={cn("h-auto w-full", className)}
      role="group"
      aria-label="Career branching map — select a career to explore"
    >
      <defs>
        <linearGradient id="rm-line" x1="0" x2="1">
          <stop offset="0" stopColor="var(--lavender-bright)" />
          <stop offset="1" stopColor="var(--cyan)" />
        </linearGradient>
        <radialGradient id="rm-glow">
          <stop offset="0" stopColor="var(--lavender)" stopOpacity="0.6" />
          <stop offset="1" stopColor="var(--lavender)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {nodes.map((n) => {
        const mx = (o.x + n.x) / 2;
        return (
          <path
            key={n.career.id}
            d={`M${o.x},${o.y} C${mx},${o.y} ${mx},${n.y} ${n.x},${n.y}`}
            stroke="url(#rm-line)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
            className="route-dash"
          />
        );
      })}
      <circle cx={o.x} cy={o.y} r="34" fill="url(#rm-glow)" />
      <circle cx={o.x} cy={o.y} r="9" fill="var(--lavender-bright)" />
      <text x={o.x} y={o.y + 28} textAnchor="middle" fontSize="11" fill="var(--text-2)">
        You
      </text>
      {nodes.map(({ career: c, x, y }) => {
        const isSaved = saved.includes(c.id);
        const seen = recent.includes(c.id);
        const shortLabel =
          c.name.length > 17
            ? `${c.name.replace(" Analyst", "").replace(" Engineer", "").slice(0, 16)}…`
            : c.name;
        return (
          <g
            key={c.id}
            role="button"
            tabIndex={0}
            aria-label={`Open ${c.name}`}
            className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[var(--cyan)]"
            onClick={() => nav({ to: "/careers/$id", params: { id: c.id } })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                nav({ to: "/careers/$id", params: { id: c.id } });
              }
            }}
          >
            <rect
              x={x - 66}
              y={y - 14}
              width="132"
              height="28"
              rx="14"
              fill="oklch(0.27 0.08 285 / 0.85)"
              stroke={isSaved ? "var(--turquoise)" : "oklch(1 0 0 / 0.25)"}
            />
            <circle
              cx={x - 52}
              cy={y}
              r="4"
              fill={isSaved ? "var(--turquoise)" : seen ? "var(--cyan)" : "var(--lavender)"}
            />
            <text x={x - 42} y={y + 4} fontSize="11" fill="var(--foreground)">
              {shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
