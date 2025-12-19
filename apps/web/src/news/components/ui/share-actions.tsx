"use client";

import { useState } from "react";

type ShareActionsProps = {
  url: string;
  title: string;
};

export function ShareActions({ url, title }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
      <a
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-white/10 px-3 py-2 text-[11px] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(0,0,0,0.35)]"
        aria-label="Share on Twitter"
        data-cy="share-twitter"
      >
        Share
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          } catch {
            setCopied(false);
          }
        }}
        className="rounded-full border px-3 py-2 text-[11px] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(0,0,0,0.35)]"
        style={{ borderColor: "rgba(255,255,255,0.2)", color: "white" }}
        aria-label="Copy link"
        data-cy="share-copy"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
