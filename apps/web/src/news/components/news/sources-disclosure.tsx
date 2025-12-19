"use client";

import Link from "next/link";
import { useState } from "react";

type SourceItem = {
  name?: string | null;
  url?: string | null;
  countryCode?: string | null;
  reliability?: number | null;
};

type SourcesDisclosureProps = {
  sources?: unknown;
  fallbackName?: string | null;
  fallbackUrl?: string | null;
  reliability?: number | null;
  dataCy?: string;
};

export function SourcesDisclosure({ sources, fallbackName, fallbackUrl, reliability, dataCy }: SourcesDisclosureProps) {
  const [open, setOpen] = useState(false);
  const sourceList: SourceItem[] = Array.isArray(sources)
    ? (sources as SourceItem[])
    : sources && typeof sources === "object"
      ? [sources as SourceItem]
      : [];

  if (!sourceList.length && !fallbackName && !fallbackUrl) return null;

  return (
    <div className="text-sm" data-cy={dataCy}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
        aria-expanded={open}
      >
        Sources {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--cream)" }}>
          {sourceList.map((s, idx) => (
            <div key={`${s.url || s.name || idx}`} className="flex flex-col gap-1">
              <span className="text-sm font-semibold" style={{ color: "var(--forest)" }}>
                {s.name || "Source"}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-[12px]" style={{ color: "var(--muted)" }}>
                {s.countryCode && <span>{s.countryCode}</span>}
                {typeof s.reliability === "number" && <span>Reliability {s.reliability}/100</span>}
                {s.url && (
                  <Link href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                    Visit source
                  </Link>
                )}
              </div>
            </div>
          ))}
          {!sourceList.length && fallbackName && (
            <div className="flex flex-wrap items-center gap-2 text-[12px]" style={{ color: "var(--muted)" }}>
              <span>{fallbackName}</span>
              {fallbackUrl && (
                <Link href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Visit source
                </Link>
              )}
              {typeof reliability === "number" && <span>Reliability {reliability}/100</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
