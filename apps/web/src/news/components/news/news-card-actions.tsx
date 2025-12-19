"use client";

import { useState } from "react";

type NewsCardActionsProps = {
  url: string;
  title: string;
  sourceName?: string | null;
  dataCy?: string;
};

/**
 * Local share/save/flag actions for News cards.
 * These are client-side only affordances to support engagement and QA flows without backend wiring.
 */
export function NewsCardActions({ url, title, sourceName, dataCy }: NewsCardActionsProps) {
  const [saved, setSaved] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [copied, setCopied] = useState(false);

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
        aria-label={saved ? "Remove bookmark" : "Save article"}
        data-cy="card-save"
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
        data-cy="card-share"
      >
        {copied ? "Copied" : "Share"}
      </button>

      <button
        type="button"
        onClick={() => setFlagged(true)}
        className="rounded-full border px-4 py-2 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b91c1c] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        style={{ borderColor: "#b91c1c", background: flagged ? "#b91c1c" : "var(--panel)", color: flagged ? "#fff" : "#b91c1c" }}
        aria-pressed={flagged}
        aria-label="Flag for fact-check"
        data-cy="card-flag"
      >
        {flagged ? "Flagged" : "Flag"}
      </button>

      {sourceName && (
        <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Source: {sourceName}
        </span>
      )}
    </div>
  );
}
