"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { surfaceUrls } from "@/lib/navigation";
import type { StoredJump, StoredSearch } from "./searchStorage";
import {
  clearSearchHistory,
  dispatchApplySearch,
  getPersonalizationEnabled,
  getRecentJumps,
  getRecentSearches,
  getSavedSearches,
  recordJump,
  removeSavedSearch,
  SEARCH_UPDATE_EVENT,
  setPersonalizationEnabled
} from "./searchStorage";
import { trackSearchEvent } from "./searchTelemetry";

type CommandEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  tag: string;
  shortcut: string;
  keywords: string[];
};

const commandEntries: CommandEntry[] = [
  {
    id: "studio",
    title: "StorySphere Studio",
    description: "Prompt to MP4 workspace for creators.",
    href: "/studio",
    tag: "Create",
    shortcut: "/studio",
    keywords: ["storysphere", "studio", "prompt", "create"]
  },
  {
    id: "liveloop",
    title: "LiveLoop",
    description: "Always-on playlists with signed proofs.",
    href: "/liveloop",
    tag: "Stream",
    shortcut: "/liveloop",
    keywords: ["liveloop", "playlist", "stream", "broadcast"]
  },
  {
    id: "marketplace",
    title: "Marketplace",
    description: "Listings, pricing, and checkout.",
    href: "/marketplace",
    tag: "Ship",
    shortcut: "/marketplace",
    keywords: ["marketplace", "listing", "pricing", "checkout"]
  },
  {
    id: "news",
    title: "News Desk",
    description: "Headlines, features, and live desk.",
    href: "/news",
    tag: "Read",
    shortcut: "/news",
    keywords: ["news", "headlines", "desk", "briefing"]
  },
  {
    id: "products",
    title: "Products",
    description: "Surface map and launch notes.",
    href: "/products",
    tag: "Explore",
    shortcut: "/products",
    keywords: ["products", "surfaces", "launch", "roadmap"]
  },
  {
    id: "developers",
    title: "Developers",
    description: "Docs, SDKs, and integration guides.",
    href: "/developers",
    tag: "Build",
    shortcut: "/developers",
    keywords: ["developers", "docs", "api", "sdk"]
  },
  {
    id: "playground",
    title: "Playground",
    description: "Agent park and testing lab.",
    href: "/playground",
    tag: "Lab",
    shortcut: "/playground",
    keywords: ["playground", "agents", "lab", "testing"]
  },
  {
    id: "status",
    title: "Status",
    description: "System health and uptime.",
    href: "/status",
    tag: "Health",
    shortcut: "/status",
    keywords: ["status", "uptime", "health"]
  },
  {
    id: "gridstock",
    title: "GridStock",
    description: "Market terminal and trading play.",
    href: surfaceUrls.gridstock,
    tag: "Trade",
    shortcut: "/gridstock",
    keywords: ["gridstock", "trade", "market", "terminal"]
  },
  {
    id: "food",
    title: "Mom's Kitchen",
    description: "Recipes and meal planning.",
    href: surfaceUrls.food,
    tag: "Cook",
    shortcut: "/food",
    keywords: ["kitchen", "food", "recipes", "menu"]
  }
];

const scopeLabels: Record<string, string> = {
  web: "Web",
  news: "News",
  images: "Images",
  videos: "Videos",
  docs: "Docs",
  people: "People",
  projects: "Projects",
  events: "Events",
  marketplace: "Market"
};

const formatScope = (scopeId: string) => scopeLabels[scopeId] ?? scopeId;

export default function SearchCommandCenter() {
  const [filter, setFilter] = useState("");
  const [recentSearches, setRecentSearches] = useState<StoredSearch[]>([]);
  const [savedSearches, setSavedSearches] = useState<StoredSearch[]>([]);
  const [recentJumps, setRecentJumps] = useState<StoredJump[]>([]);
  const [personalizationEnabled, setPersonalizationState] = useState(true);
  const paletteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => {
      setRecentSearches(getRecentSearches());
      setSavedSearches(getSavedSearches());
      setRecentJumps(getRecentJumps());
      setPersonalizationState(getPersonalizationEnabled());
    };
    refresh();
    window.addEventListener(SEARCH_UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SEARCH_UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      const isTypingField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTypingField) return;
      event.preventDefault();
      trackSearchEvent("command_palette_focus", { trigger: "/" });
      paletteRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredCommands = useMemo(() => {
    const trimmed = filter.trim().toLowerCase();
    if (!trimmed) return commandEntries;
    return commandEntries.filter((command) => {
      const haystack = [
        command.title,
        command.description,
        command.tag,
        command.shortcut,
        ...command.keywords
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [filter]);

  const handleCommandJump = (command: CommandEntry) => {
    recordJump(command.title, command.href);
    trackSearchEvent("command_jump", {
      commandId: command.id,
      href: command.href
    });
  };

  const handleApplySearch = (entry: StoredSearch, source: "recent" | "saved") => {
    dispatchApplySearch({ query: entry.query, scopeId: entry.scopeId });
    trackSearchEvent("search_apply", {
      source,
      scopeId: entry.scopeId,
      queryLength: entry.query.length
    });
  };

  const handleRemoveSaved = (entry: StoredSearch) => {
    removeSavedSearch(entry.query, entry.scopeId);
    trackSearchEvent("search_saved_remove", {
      scopeId: entry.scopeId,
      queryLength: entry.query.length,
      source: "command_center"
    });
  };

  const handleRecentJumpOpen = (jump: StoredJump) => {
    recordJump(jump.title, jump.href);
    trackSearchEvent("recent_jump_open", { href: jump.href });
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    trackSearchEvent("search_history_clear", { source: "command_center" });
  };

  const handleEnablePersonalization = () => {
    setPersonalizationEnabled(true);
    trackSearchEvent("search_personalization_toggle", {
      enabled: true,
      source: "command_center"
    });
  };

  const hasHistory = recentSearches.length > 0 || recentJumps.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card animate-rise animate-rise-delay-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
          <span>Command palette</span>
          <span className="text-[color:var(--search-forest)]">Press / to focus</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <input
            ref={paletteRef}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Jump to a surface or command"
            className="w-full rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm text-[color:var(--search-ink)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--search-forest)]/20"
          />
          <div className="grid gap-2">
            {filteredCommands.map((command) => (
              <Link
                key={command.id}
                href={command.href}
                onClick={() => handleCommandJump(command)}
                className="group flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2 text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
              >
                <div>
                  <div className="text-sm font-semibold">{command.title}</div>
                  <div className="text-xs text-[color:var(--muted)]">{command.description}</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {command.shortcut}
                </div>
              </Link>
            ))}
            {filteredCommands.length === 0 && (
              <div className="rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2 text-sm text-[color:var(--muted)]">
                No commands match that query.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card animate-rise animate-rise-delay-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
          <span>Recent activity</span>
          <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-[10px] font-semibold text-[color:var(--search-forest)]">
            {personalizationEnabled ? "Personalization on" : "Personalization off"}
          </span>
          {hasHistory && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="rounded-full border border-[color:var(--border)] bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--search-forest)] transition hover:border-[color:var(--search-forest)]"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-4 space-y-4 text-sm text-[color:var(--search-ink)]">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Recent searches
            </div>
            {!personalizationEnabled && (
              <div className="rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2 text-xs text-[color:var(--muted)]">
                Personalization is off. Enable it to log recent searches locally.
                <button
                  type="button"
                  onClick={handleEnablePersonalization}
                  className="ml-2 rounded-full border border-[color:var(--border)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--search-forest)] transition hover:border-[color:var(--search-forest)]"
                >
                  Enable
                </button>
              </div>
            )}
            {personalizationEnabled && recentSearches.length > 0 ? (
              <div className="grid gap-2">
                {recentSearches.map((entry) => (
                  <button
                    key={`${entry.scopeId}-${entry.query}`}
                    type="button"
                    onClick={() => handleApplySearch(entry, "recent")}
                    className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2 text-left text-sm font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                  >
                    <span>{entry.query}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      {formatScope(entry.scopeId)}
                    </span>
                  </button>
                ))}
              </div>
            ) : personalizationEnabled ? (
              <p className="text-xs text-[color:var(--muted)]">No searches yet.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Saved searches
            </div>
            {savedSearches.length > 0 ? (
              <div className="grid gap-2">
                {savedSearches.map((entry) => (
                  <div
                    key={`${entry.scopeId}-${entry.query}`}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplySearch(entry, "saved")}
                      className="flex-1 rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2 text-left text-sm font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                    >
                      <div className="flex items-center justify-between">
                        <span>{entry.query}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                          {formatScope(entry.scopeId)}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSaved(entry)}
                      className="rounded-full border border-[color:var(--border)] bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                      aria-label={`Remove ${entry.query}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[color:var(--muted)]">Save a search to pin it here.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Recent jumps
            </div>
            {personalizationEnabled && recentJumps.length > 0 ? (
              <div className="grid gap-2">
                {recentJumps.map((jump) => (
                  <Link
                    key={`${jump.href}-${jump.timestamp}`}
                    href={jump.href}
                    onClick={() => handleRecentJumpOpen(jump)}
                    className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                  >
                    <span>{jump.title}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      {jump.href.replace(/^https?:\/\//, "")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : personalizationEnabled ? (
              <p className="text-xs text-[color:var(--muted)]">Jump to a surface to log it.</p>
            ) : (
              <p className="text-xs text-[color:var(--muted)]">
                Personalization is off. Jumps are not recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
