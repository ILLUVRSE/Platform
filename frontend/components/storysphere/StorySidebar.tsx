import { useMemo, useState } from "react";
import type { StorySummary } from "./types";

interface Props {
  stories: StorySummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

const filters: { key: "all" | "draft" | "editing" | "rendering" | "done"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "In progress" },
  { key: "editing", label: "Editing" },
  { key: "rendering", label: "Rendering" },
  { key: "done", label: "Rendered" },
];

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-white",
  generating: "bg-amber-400/20 text-amber-200",
  editing: "bg-cyan-400/15 text-cyan-100",
  rendering: "bg-indigo-400/20 text-indigo-100",
  done: "bg-emerald-400/20 text-emerald-100",
  error: "bg-red-500/20 text-red-100",
};

export function StorySidebar({ stories, selectedId, onSelect, onNew }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");

  const filtered = useMemo(() => {
    return stories.filter((story) => {
      const matchesFilter = filter === "all" ? true : story.status === filter;
      const matchesQuery =
        query.trim().length === 0 ||
        story.title.toLowerCase().includes(query.toLowerCase()) ||
        story.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      return matchesFilter && matchesQuery;
    });
  }, [stories, filter, query]);

  return (
    <aside className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">Your Stories</p>
          <p className="font-semibold">Project browser</p>
        </div>
        <button
          onClick={onNew}
          className="text-sm font-semibold px-3 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
        >
          New
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search titles, tags…"
        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`text-xs px-3 py-1 rounded-full border ${
              filter === item.key ? "bg-white/10 border-white/40" : "border-white/10 hover:border-white/20"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-white/70">
            No stories match your filter.
          </div>
        )}
        {filtered.map((story) => {
          const active = story.id === selectedId;
          return (
            <button
              key={story.id}
              onClick={() => onSelect(story.id)}
              className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <p className="font-semibold">{story.title}</p>
                  <p className="text-xs text-white/60">
                    {story.duration.toFixed(0)}s • {story.resolution} • {story.fps}fps
                  </p>
                  <p className="text-xs text-white/60">Updated {story.updatedAt}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${statusColors[story.status] || "bg-white/10 text-white"}`}
                >
                  {story.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
