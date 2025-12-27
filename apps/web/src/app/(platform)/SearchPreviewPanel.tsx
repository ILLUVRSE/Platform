"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { recordJump } from "./searchStorage";
import { trackSearchEvent } from "./searchTelemetry";

type QuickAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  tag: string;
};

type PreviewResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  source: string;
  type: string;
  meta: string;
  badge: string;
  previewClass: string;
  external?: boolean;
};

const quickActions: QuickAction[] = [
  {
    id: "briefing",
    title: "Run a News Briefing",
    description: "Open the live desk and generate a quick recap.",
    href: "/news",
    tag: "Brief"
  },
  {
    id: "studio",
    title: "Start StorySphere Studio",
    description: "Launch a new prompt-to-MP4 session.",
    href: "/studio",
    tag: "Create"
  },
  {
    id: "marketplace",
    title: "Publish a Marketplace Listing",
    description: "Package and ship a signed artifact.",
    href: "/marketplace",
    tag: "Ship"
  },
  {
    id: "developers",
    title: "Open Developer Docs",
    description: "Explore APIs, SDKs, and trust specs.",
    href: "/developers",
    tag: "Build"
  }
];

const previewResults: PreviewResult[] = [
  {
    id: "trust-playbook",
    title: "Trust-first discovery playbook",
    description:
      "How ILLUVRSE keeps search neutral: no paid placement, transparent sourcing, and local-first history.",
    href: "/about",
    source: "ILLUVRSE Platform",
    type: "Trust",
    meta: "Updated weekly",
    badge: "Verified",
    previewClass:
      "bg-[linear-gradient(135deg,rgba(27,99,80,0.2),rgba(240,209,154,0.35))]"
  },
  {
    id: "storysphere-pipeline",
    title: "StorySphere prompt pipeline",
    description:
      "From prompt to proofed MP4: rendering, review gates, and publication workflows.",
    href: "/storysphere",
    source: "ILLUVRSE Studio",
    type: "Studio",
    meta: "Pipeline guide",
    badge: "Signed",
    previewClass:
      "bg-[linear-gradient(135deg,rgba(27,99,80,0.15),rgba(255,255,255,0.8))]"
  },
  {
    id: "news-briefing",
    title: "Live desk briefing",
    description:
      "Daily signal sweep with source labels, region filters, and verified-only toggles.",
    href: "/news",
    source: "ILLUVRSE News",
    type: "News",
    meta: "Live updates",
    badge: "Live",
    previewClass:
      "bg-[linear-gradient(135deg,rgba(240,209,154,0.4),rgba(255,255,255,0.8))]"
  },
  {
    id: "kernel-signing",
    title: "Kernel signing and audit proofs",
    description:
      "Reference docs on signing flows, verification endpoints, and policy checks.",
    href: "/developers",
    source: "ILLUVRSE Docs",
    type: "Docs",
    meta: "API reference",
    badge: "Spec",
    previewClass:
      "bg-[linear-gradient(135deg,rgba(27,99,80,0.12),rgba(230,239,230,0.9))]"
  }
];

const buildResultHost = (href: string) => href.replace(/^https?:\/\//, "");

export default function SearchPreviewPanel() {
  const [savedResults, setSavedResults] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const savedSet = useMemo(() => new Set(savedResults), [savedResults]);

  const handleQuickAction = (action: QuickAction) => {
    recordJump(action.title, action.href);
    trackSearchEvent("quick_action", {
      actionId: action.id,
      href: action.href
    });
  };

  const handleOpen = (result: PreviewResult) => {
    recordJump(result.title, result.href);
    trackSearchEvent("preview_open", {
      resultId: result.id,
      href: result.href,
      type: result.type,
      external: Boolean(result.external)
    });
  };

  const handleToggleSave = (result: PreviewResult) => {
    setSavedResults((current) => {
      const next = new Set(current);
      const isSaved = next.has(result.id);
      if (isSaved) {
        next.delete(result.id);
      } else {
        next.add(result.id);
      }
      trackSearchEvent("preview_save_toggle", {
        resultId: result.id,
        saved: !isSaved,
        type: result.type
      });
      return Array.from(next);
    });
  };

  const handleShare = async (result: PreviewResult) => {
    let method = "prompt";
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(result.href);
        setCopiedId(result.id);
        window.setTimeout(() => setCopiedId(null), 1600);
        method = "clipboard";
      } catch {
        window.prompt("Copy link", result.href);
      }
    } else {
      window.prompt("Copy link", result.href);
    }
    trackSearchEvent("preview_share", {
      resultId: result.id,
      type: result.type,
      method
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-5 shadow-card">
          <div className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
            Quick actions
          </div>
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                onClick={() => handleQuickAction(action)}
                className="group rounded-xl border border-[color:var(--border)] bg-white/70 p-3 transition hover:border-[color:var(--search-forest)]"
              >
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  <span>{action.tag}</span>
                  <span className="text-[color:var(--search-forest)]">Open</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-[color:var(--search-ink)] group-hover:text-[color:var(--search-forest)]">
                  {action.title}
                </div>
                <p className="mt-1 text-xs text-[color:var(--muted)]">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-5 shadow-card">
          <div className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
            Result tools
          </div>
          <div className="mt-4 space-y-3 text-xs text-[color:var(--search-ink)]">
            <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
              <span>Preview actions</span>
              <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-[10px] font-semibold text-[color:var(--search-forest)]">
                Open, Save, Share
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
              <span>Result richness</span>
              <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-[10px] font-semibold text-[color:var(--search-forest)]">
                Snippets + badges
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
              <span>Scope hints</span>
              <span className="rounded-full bg-[color:var(--search-mist)] px-2 py-1 text-[10px] font-semibold text-[color:var(--search-forest)]">
                Source labeled
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {previewResults.map((result) => {
          const isSaved = savedSet.has(result.id);
          return (
            <div
              key={result.id}
              className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-5 shadow-card"
            >
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                <span>{result.type}</span>
                <span className="text-[color:var(--search-forest)]">{result.badge}</span>
              </div>
              <div
                className={`mt-4 h-28 w-full rounded-xl border border-[color:var(--border)] ${result.previewClass}`}
                aria-hidden="true"
              />
              <div className="mt-4 space-y-2">
                <div className="text-lg font-semibold text-[color:var(--search-ink)]">
                  {result.title}
                </div>
                <p className="text-sm text-[color:var(--muted)]">{result.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  <span>{result.source}</span>
                  <span>{result.meta}</span>
                  <span>{buildResultHost(result.href)}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={result.href}
                  onClick={() => handleOpen(result)}
                  className="rounded-full bg-[color:var(--search-forest)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => handleToggleSave(result)}
                  className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                  aria-pressed={isSaved}
                >
                  {isSaved ? "Saved" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(result)}
                  className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--search-ink)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
                >
                  {copiedId === result.id ? "Copied" : "Share"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
