"use client";

import { useState } from "react";

type FeatureCardActionsProps = {
  url: string;
  title: string;
  dataCy?: string;
};

/**
 * Engagement actions for feature cards: bookmark, share/copy, print, and flag.
 * Client-side only; persistence intentionally omitted for now.
 */
export function FeatureCardActions({ url, title, dataCy }: FeatureCardActionsProps) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flagged, setFlagged] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
      data-cy={dataCy}
    >
      <button
        type="button"
        onClick={() => setSaved((prev) => !prev)}
        className="rounded-full border px-4 py-2 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        style={{ borderColor: "var(--border)", background: "var(--cream)", color: "var(--forest)" }}
        aria-pressed={saved}
        aria-label={saved ? "Remove bookmark" : "Save feature"}
        data-cy="feature-save"
      >
        {saved ? "Saved" : "Save"}
      </button>

      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopied(false);
          }
        }}
        className="rounded-full border px-4 py-2 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
        aria-label={`Copy link for ${title}`}
        data-cy="feature-share"
      >
        {copied ? "Copied" : "Share"}
      </button>

      <button
        type="button"
        onClick={() => window.open(url + "?print=1", "_blank", "noopener")}
        className="rounded-full border px-4 py-2 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
        aria-label="Open print view"
        data-cy="feature-print"
      >
        Print
      </button>

      <button
        type="button"
        onClick={() => setFlagged(true)}
        className="rounded-full border px-4 py-2 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b91c1c] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        style={{ borderColor: "#b91c1c", background: flagged ? "#b91c1c" : "var(--panel)", color: flagged ? "#fff" : "#b91c1c" }}
        aria-pressed={flagged}
        aria-label="Flag for fact-check"
        data-cy="feature-flag"
      >
        {flagged ? "Flagged" : "Flag"}
      </button>
    </div>
  );
}
