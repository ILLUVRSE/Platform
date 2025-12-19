"use client";

import { useState } from "react";

type LicenseModalProps = {
  license?: string | null;
  title: string;
  author?: string | null;
  sourceName?: string | null;
  licenseUrl?: string | null;
  contactEmail?: string | null;
  attribution?: string | null;
  dataCy?: string;
};

export function LicenseModal({ license, title, author, sourceName, licenseUrl, contactEmail, attribution, dataCy }: LicenseModalProps) {
  const [open, setOpen] = useState(false);
  const attributionText =
    attribution ??
    `${title} — ${author ?? "ILLUVRSE"} (${license ?? "CC-BY"})${sourceName ? ` via ${sourceName}` : ""}`;

  if (!license) return null;

  return (
    <div className="relative" data-cy={dataCy}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
        style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        License: {license}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="License details"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <div className="max-w-lg rounded-2xl border bg-white p-6 shadow-2xl" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            <h3 className="text-lg font-bold">License & Attribution</h3>
            <p className="mt-2 text-sm text-gray-700">
              This story is published under <strong>{license}</strong>. Please attribute the reporter and publisher when reusing.
            </p>
            <div className="mt-3 rounded-lg bg-gray-100 p-3 text-sm font-mono text-gray-800">
              {attributionText}
            </div>
            {licenseUrl && (
              <p className="mt-2 text-sm">
                License details:{" "}
                <a href={licenseUrl} className="underline" target="_blank" rel="noreferrer">
                  {licenseUrl}
                </a>
              </p>
            )}
            {contactEmail && (
              <p className="mt-1 text-sm text-gray-700">
                Rights/contact: <a href={`mailto:${contactEmail}`} className="underline">{contactEmail}</a>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(attributionText);
                  } catch {
                    /* ignore */
                  }
                }}
                className="rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ borderColor: "var(--border)", color: "var(--forest)" }}
                data-cy="license-copy"
              >
                Copy attribution
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ borderColor: "var(--border)", color: "var(--forest)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
