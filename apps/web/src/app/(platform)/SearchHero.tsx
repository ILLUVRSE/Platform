"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StoredSearch } from "./searchStorage";
import {
  getPersonalizationEnabled,
  getSavedSearches,
  recordRecentSearch,
  removeSavedSearch,
  saveSearch,
  SEARCH_APPLY_EVENT,
  SEARCH_UPDATE_EVENT
} from "./searchStorage";
import { trackSearchEvent } from "./searchTelemetry";

type SearchScope = {
  id: string;
  label: string;
  group: "open" | "platform";
  hint: string;
  ia?: string;
  prefix?: string;
};

type SuggestionChip = {
  label: string;
  value: string;
};

type IntentSignal = {
  id: string;
  label: string;
  tokens: string[];
  scopeId: string;
};

const searchScopes: SearchScope[] = [
  {
    id: "web",
    label: "Web",
    group: "open",
    hint: "Open web results across trusted sources.",
    ia: "web"
  },
  {
    id: "news",
    label: "News",
    group: "open",
    hint: "Headlines, coverage, and briefings.",
    ia: "news"
  },
  {
    id: "images",
    label: "Images",
    group: "open",
    hint: "Visual references and stills.",
    ia: "images"
  },
  {
    id: "videos",
    label: "Videos",
    group: "open",
    hint: "Clips, streams, and demos.",
    ia: "videos"
  },
  {
    id: "docs",
    label: "Docs",
    group: "platform",
    hint: "Developer docs, specs, and API notes.",
    prefix: "site:illuvrse.com/developers"
  },
  {
    id: "people",
    label: "People",
    group: "platform",
    hint: "Profiles, credits, and creator bios.",
    prefix: "site:illuvrse.com/news/people"
  },
  {
    id: "projects",
    label: "Projects",
    group: "platform",
    hint: "Surface launches and platform projects.",
    prefix: "site:illuvrse.com/products"
  },
  {
    id: "events",
    label: "Events",
    group: "platform",
    hint: "Live desks, recaps, and program updates.",
    prefix: "site:illuvrse.com/news"
  },
  {
    id: "marketplace",
    label: "Marketplace",
    group: "platform",
    hint: "Listings, pricing, and agent bundles.",
    prefix: "site:illuvrse.com/marketplace"
  }
];

const sampleQueries = [
  { label: "Kernel signatures", query: "kernel signatures audit proof" },
  { label: "StorySphere prompts", query: "storysphere prompt to mp4 pipeline" },
  { label: "LiveLoop playlist", query: "liveloop streaming playlist" }
];

const intentCatalog: IntentSignal[] = [
  {
    id: "learn",
    label: "Learning",
    tokens: ["how", "guide", "tutorial", "docs", "api", "sdk"],
    scopeId: "docs"
  },
  {
    id: "news",
    label: "News",
    tokens: ["news", "headline", "update", "today", "report"],
    scopeId: "news"
  },
  {
    id: "people",
    label: "People",
    tokens: ["people", "person", "team", "creator", "author", "founder"],
    scopeId: "people"
  },
  {
    id: "market",
    label: "Commerce",
    tokens: ["market", "pricing", "price", "buy", "sell", "listing"],
    scopeId: "marketplace"
  },
  {
    id: "projects",
    label: "Projects",
    tokens: ["project", "product", "surface", "release", "roadmap"],
    scopeId: "projects"
  }
];

const typoCorrections: Record<string, string> = {
  illuverse: "illuvrse",
  storisphere: "storysphere",
  livelooop: "liveloop",
  gridstok: "gridstock"
};

const synonymMap: Record<string, string[]> = {
  proof: ["attestation", "verification", "signature"],
  signature: ["proof", "attestation", "audit"],
  policy: ["governance", "compliance", "ruleset"],
  marketplace: ["listing", "commerce", "pricing"],
  studio: ["creator", "pipeline", "storysphere"],
  news: ["headlines", "coverage", "briefing"],
  stream: ["liveloop", "playlist", "broadcast"]
};

const refinementsByScope: Record<string, SuggestionChip[]> = {
  web: [
    { label: "Add: site:illuvrse.com", value: "site:illuvrse.com" },
    { label: "Add: \"trust-first\"", value: "\"trust-first\"" },
    { label: "Add: case study", value: "\"case study\"" }
  ],
  news: [
    { label: "Add: News Desk", value: "\"news desk\"" },
    { label: "Add: briefing", value: "briefing" },
    { label: "Add: report", value: "report" }
  ],
  images: [
    { label: "Add: render", value: "render" },
    { label: "Add: concept", value: "\"concept art\"" },
    { label: "Add: studio", value: "storysphere" }
  ],
  videos: [
    { label: "Add: livestream", value: "livestream" },
    { label: "Add: demo", value: "demo" },
    { label: "Add: playlist", value: "playlist" }
  ],
  docs: [
    { label: "Add: API", value: "API" },
    { label: "Add: SDK", value: "SDK" },
    { label: "Add: spec", value: "spec" }
  ],
  people: [
    { label: "Add: profile", value: "profile" },
    { label: "Add: interview", value: "interview" },
    { label: "Add: credits", value: "credits" }
  ],
  projects: [
    { label: "Add: release", value: "release" },
    { label: "Add: roadmap", value: "roadmap" },
    { label: "Add: surfaces", value: "surfaces" }
  ],
  events: [
    { label: "Add: live", value: "live" },
    { label: "Add: recap", value: "recap" },
    { label: "Add: briefing", value: "briefing" }
  ],
  marketplace: [
    { label: "Add: listing", value: "listing" },
    { label: "Add: pricing", value: "pricing" },
    { label: "Add: checkout", value: "checkout" }
  ]
};

const buildScopedQuery = (query: string, scope: SearchScope) => {
  const trimmed = query.trim();
  if (!trimmed) return "";
  if (!scope.prefix) return trimmed;
  return `${scope.prefix} ${trimmed}`.trim();
};

const getFirstMatch = (query: string, candidates: string[]) => {
  const lower = query.toLowerCase();
  return candidates.find((token) => lower.includes(token));
};

export default function SearchHero() {
  const [query, setQuery] = useState("");
  const [scopeId, setScopeId] = useState("web");
  const [savedSearches, setSavedSearches] = useState<StoredSearch[]>([]);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim();
  const selectedScope = searchScopes.find((scope) => scope.id === scopeId) ?? searchScopes[0];

  useEffect(() => {
    const refresh = () => {
      setSavedSearches(getSavedSearches());
      setPersonalizationEnabled(getPersonalizationEnabled());
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
    const handleApply = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string; scopeId?: string }>).detail;
      if (!detail?.query) return;
      setQuery(detail.query);
      if (detail.scopeId) {
        setScopeId(detail.scopeId);
      }
      inputRef.current?.focus();
    };
    window.addEventListener(SEARCH_APPLY_EVENT, handleApply);
    return () => window.removeEventListener(SEARCH_APPLY_EVENT, handleApply);
  }, []);

  const intentSignal = useMemo(() => {
    if (!trimmedQuery) {
      return { id: "explore", label: "Explore", scopeId: "web", tokens: [] };
    }
    return (
      intentCatalog.find((intent) => getFirstMatch(trimmedQuery, intent.tokens)) ?? {
        id: "explore",
        label: "Explore",
        scopeId: "web",
        tokens: []
      }
    );
  }, [trimmedQuery]);

  const intentScope = searchScopes.find((scope) => scope.id === intentSignal.scopeId);

  const didYouMean = useMemo(() => {
    if (!trimmedQuery) return "";
    let suggestion = trimmedQuery;
    Object.entries(typoCorrections).forEach(([typo, correction]) => {
      const regex = new RegExp(`\\b${typo}\\b`, "gi");
      suggestion = suggestion.replace(regex, correction);
    });
    return suggestion !== trimmedQuery ? suggestion : "";
  }, [trimmedQuery]);

  const relatedTerms = useMemo(() => {
    if (!trimmedQuery) return [];
    const tokens = trimmedQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const terms = new Set<string>();
    tokens.forEach((token) => {
      synonymMap[token]?.forEach((synonym) => terms.add(synonym));
    });
    return Array.from(terms).slice(0, 6);
  }, [trimmedQuery]);

  const refinementChips = refinementsByScope[selectedScope.id] ?? refinementsByScope.web;

  const smartSuggestions = useMemo(() => {
    if (!trimmedQuery) return [];
    const suggestions = [
      {
        label: "Deep dive",
        query: `${trimmedQuery} deep dive`
      },
      {
        label: "Proof + policy",
        query: `${trimmedQuery} policy proof`
      }
    ];
    if (selectedScope.group === "platform") {
      suggestions.unshift({
        label: `Search ${selectedScope.label} on ILLUVRSE`,
        query: buildScopedQuery(trimmedQuery, selectedScope)
      });
    }
    if (relatedTerms.length > 0) {
      suggestions.push({
        label: `Compare with ${relatedTerms[0]}`,
        query: `${trimmedQuery} ${relatedTerms[0]}`
      });
    }
    return suggestions.slice(0, 3);
  }, [trimmedQuery, selectedScope, relatedTerms]);

  const handleScopeChange = (nextScopeId: string) => {
    if (nextScopeId === scopeId) return;
    trackSearchEvent("search_scope_change", {
      fromScope: scopeId,
      toScope: nextScopeId
    });
    setScopeId(nextScopeId);
  };

  const handleIntentSwitch = () => {
    if (!intentScope || intentScope.id === scopeId) return;
    trackSearchEvent("search_intent_scope_switch", {
      fromScope: scopeId,
      toScope: intentScope.id,
      intent: intentSignal.id
    });
    setScopeId(intentScope.id);
  };

  const applySuggestion = (
    nextQuery: string,
    source = "suggestion",
    meta?: Record<string, unknown>
  ) => {
    const trimmed = nextQuery.trim();
    if (trimmed) {
      trackSearchEvent("search_suggestion_apply", {
        source,
        scopeId,
        queryLength: trimmed.length,
        ...meta
      });
    }
    setQuery(nextQuery);
    inputRef.current?.focus();
  };

  const appendToQuery = (value: string, source = "refinement", meta?: Record<string, unknown>) => {
    setQuery((current) => {
      const base = current.trim();
      const addition = value.trim();
      if (!addition) return current;
      if (!base) {
        trackSearchEvent("search_refinement_add", {
          source,
          scopeId,
          additionLength: addition.length,
          ...meta
        });
        return addition;
      }
      if (base.toLowerCase().includes(addition.toLowerCase())) return current;
      const next = `${base} ${addition}`;
      trackSearchEvent("search_refinement_add", {
        source,
        scopeId,
        additionLength: addition.length,
        ...meta
      });
      return next;
    });
    inputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedQuery) return;
    if (personalizationEnabled) {
      recordRecentSearch(trimmedQuery, scopeId);
    }
    trackSearchEvent("search_submit", {
      scopeId,
      scopeGroup: selectedScope.group,
      queryLength: trimmedQuery.length,
      personalizationEnabled
    });
    const scopedQuery = buildScopedQuery(trimmedQuery, selectedScope);
    const params = new URLSearchParams({ q: scopedQuery });
    if (selectedScope.ia) {
      params.set("ia", selectedScope.ia);
    }
    window.location.assign(`https://duckduckgo.com/?${params.toString()}`);
  };

  const openScopes = searchScopes.filter((scope) => scope.group === "open");
  const platformScopes = searchScopes.filter((scope) => scope.group === "platform");
  const isSaved =
    trimmedQuery.length > 0 &&
    savedSearches.some(
      (entry) =>
        entry.scopeId === scopeId && entry.query.trim().toLowerCase() === trimmedQuery.toLowerCase()
    );

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--muted)] animate-rise">
        <span className="h-2 w-2 rounded-full bg-[color:var(--search-forest)]" />
        ILLUVRSE Search
      </div>
      <h1 className="text-4xl font-semibold leading-tight text-[color:var(--search-ink)] md:text-5xl animate-rise animate-rise-delay-1">
        Search the open web with a calm, trust-first lens.
      </h1>
      <p className="text-lg text-[color:var(--muted)] animate-rise animate-rise-delay-2">
        Private by default and powered by DuckDuckGo, with quick jumps into the ILLUVRSE studio,
        marketplace, and news desk.
      </p>

      <form
        action="https://duckduckgo.com/"
        method="GET"
        onSubmit={handleSubmit}
        className="space-y-4 animate-rise animate-rise-delay-3"
      >
        <input type="hidden" name="ia" value={selectedScope.ia ?? "web"} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-full border border-[color:var(--border)] bg-white px-4 py-3 shadow-card focus-within:border-[color:var(--search-forest)] focus-within:ring-2 focus-within:ring-[color:var(--search-forest)]/20">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 text-[color:var(--search-forest)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 21l-4.35-4.35" />
              <circle cx="11" cy="11" r="7" />
            </svg>
            <input
              ref={inputRef}
              name="q"
              type="search"
              required
              placeholder="Search ILLUVRSE Search"
              aria-label="Search the web"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-base text-[color:var(--search-ink)] placeholder:text-[color:var(--muted)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-[color:var(--search-forest)] px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:opacity-90"
          >
            Search
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
            <span className="text-xs uppercase tracking-[0.26em]">Scope</span>
            {openScopes.map((scope) => (
              <label key={scope.id} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="scope"
                  value={scope.id}
                  checked={scopeId === scope.id}
                  onChange={() => handleScopeChange(scope.id)}
                />
                <span className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--search-ink)] transition peer-checked:border-[color:var(--search-forest)] peer-checked:bg-[color:var(--search-forest)] peer-checked:text-white">
                  {scope.label}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
            <span className="text-xs uppercase tracking-[0.26em]">ILLUVRSE</span>
            {platformScopes.map((scope) => (
              <label key={scope.id} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="scope"
                  value={scope.id}
                  checked={scopeId === scope.id}
                  onChange={() => handleScopeChange(scope.id)}
                />
                <span className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--search-ink)] transition peer-checked:border-[color:var(--search-forest)] peer-checked:bg-[color:var(--search-forest)] peer-checked:text-white">
                  {scope.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-[color:var(--muted)]">
          Powered by DuckDuckGo. No tracking. No noisy ads.
        </p>
      </form>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card animate-rise animate-rise-delay-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
          <span>Search assist</span>
          <span className="text-[color:var(--search-forest)]">{selectedScope.hint}</span>
        </div>
        <div className="mt-4 space-y-4 text-sm text-[color:var(--search-ink)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Intent
            </span>
            <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-xs font-semibold text-[color:var(--search-forest)]">
              {intentSignal.label}
            </span>
            {intentScope && intentScope.id !== selectedScope.id && (
              <button
                type="button"
                onClick={handleIntentSwitch}
                className="rounded-full border border-[color:var(--border)] bg-white/80 px-2 py-1 text-xs font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
              >
                Switch to {intentScope.label}
              </button>
            )}
          </div>

          {didYouMean && (
            <button
              type="button"
              onClick={() => applySuggestion(didYouMean, "did_you_mean")}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white/70 px-3 py-2 text-left text-sm font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
            >
              Did you mean &quot;{didYouMean}&quot;?
            </button>
          )}

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Refine by
            </div>
            <div className="flex flex-wrap gap-2">
              {refinementChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() =>
                    appendToQuery(chip.value, "refine_chip", { label: chip.label })
                  }
                  className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {relatedTerms.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Related terms
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedTerms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => appendToQuery(term, "related_term")}
                    className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {smartSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Suggested searches
              </div>
              <div className="flex flex-wrap gap-2">
                {smartSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() =>
                      applySuggestion(suggestion.query, "smart_suggestion", {
                        label: suggestion.label
                      })
                    }
                    className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {trimmedQuery && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isSaved) {
                    removeSavedSearch(trimmedQuery, scopeId);
                    trackSearchEvent("search_saved_remove", {
                      scopeId,
                      queryLength: trimmedQuery.length
                    });
                  } else {
                    saveSearch(trimmedQuery, scopeId);
                    trackSearchEvent("search_saved_add", {
                      scopeId,
                      queryLength: trimmedQuery.length
                    });
                  }
                }}
                className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                aria-pressed={isSaved}
              >
                {isSaved ? "Saved" : "Save search"}
              </button>
              <span className="text-xs text-[color:var(--muted)]">
                {isSaved ? "Click to remove." : "Pin this search for quick access."}
              </span>
            </div>
          )}

          {!trimmedQuery && (
            <p className="text-xs text-[color:var(--muted)]">
              Type a query to reveal intent signals, refinements, and related terms.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)] animate-rise animate-rise-delay-4">
        <span className="font-semibold text-[color:var(--search-ink)]">Try:</span>
        {sampleQueries.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() =>
              applySuggestion(sample.query, "sample_query", { label: sample.label })
            }
            className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
