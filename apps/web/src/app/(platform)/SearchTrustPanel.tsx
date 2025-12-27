"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearSearchHistory,
  getPersonalizationEnabled,
  SEARCH_UPDATE_EVENT,
  setPersonalizationEnabled
} from "./searchStorage";
import { trackSearchEvent } from "./searchTelemetry";

export default function SearchTrustPanel() {
  const [personalizationEnabled, setPersonalizationState] = useState(true);

  useEffect(() => {
    const refresh = () => setPersonalizationState(getPersonalizationEnabled());
    refresh();
    window.addEventListener(SEARCH_UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SEARCH_UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const handleTogglePersonalization = () => {
    const next = !personalizationEnabled;
    setPersonalizationState(next);
    setPersonalizationEnabled(next);
    trackSearchEvent("search_personalization_toggle", {
      enabled: next,
      source: "trust_panel"
    });
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    trackSearchEvent("search_history_clear", { source: "trust_panel" });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card animate-rise animate-rise-delay-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
          <span>Privacy controls</span>
          <span className="text-[color:var(--search-forest)]">Local-only</span>
        </div>
        <div className="mt-4 space-y-3 text-sm text-[color:var(--search-ink)]">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
            <div>
              <div className="text-sm font-semibold">Personalization</div>
              <p className="text-xs text-[color:var(--muted)]">
                Uses local history for recent searches and jumps.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTogglePersonalization}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                personalizationEnabled
                  ? "border-[color:var(--search-forest)] bg-[color:var(--search-forest)] text-white"
                  : "border-[color:var(--border)] bg-white text-[color:var(--search-ink)]"
              }`}
              aria-pressed={personalizationEnabled}
            >
              {personalizationEnabled ? "On" : "Off"}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
            <div>
              <div className="text-sm font-semibold">Clear history</div>
              <p className="text-xs text-[color:var(--muted)]">
                Removes recent searches and jump activity.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--search-forest)] transition hover:border-[color:var(--search-forest)]"
            >
              Clear
            </button>
          </div>
          <p className="text-xs text-[color:var(--muted)]">
            Saved searches stay pinned until you remove them.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card animate-rise animate-rise-delay-4">
        <div className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
          Transparency
        </div>
        <div className="mt-4 space-y-3 text-sm text-[color:var(--search-ink)]">
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
            <span>Result sources</span>
            <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-xs font-semibold text-[color:var(--search-forest)]">
              DuckDuckGo + ILLUVRSE
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
            <span>Ranking model</span>
            <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-xs font-semibold text-[color:var(--search-forest)]">
              No paid placement
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
            <span>Why you see this</span>
            <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-xs font-semibold text-[color:var(--search-forest)]">
              Query + scope
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
            <span>Data handling</span>
            <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-xs font-semibold text-[color:var(--search-forest)]">
              Stored locally
            </span>
          </div>
        </div>
        <Link
          href="/about"
          className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--search-forest)] transition hover:opacity-80"
        >
          Learn about trust-first design
        </Link>
      </div>
    </div>
  );
}
