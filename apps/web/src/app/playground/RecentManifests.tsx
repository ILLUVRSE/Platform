"use client";

import { useEffect, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { clearRecent, loadRecent, rememberManifest } from "./recent";

type Props = {
  onLoad?: (manifest: AceAgentManifest) => void;
};

export function RecentManifests({ onLoad }: Props) {
  const [recent, setRecent] = useState<AceAgentManifest[]>([]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  function handleLoad(manifest: AceAgentManifest) {
    try {
      const json = JSON.stringify(manifest, null, 2);
      localStorage.setItem("ace-playground-manifest", json);
      rememberManifest(manifest);
      document.cookie = `ace-playground-manifest=${encodeURIComponent(json)}; path=/; max-age=900`;
    } catch {
      // ignore
    }
    onLoad?.(manifest);
    setRecent(loadRecent());
  }

  function handleClear() {
    clearRecent();
    setRecent([]);
  }

  if (!recent.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent manifests</div>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-slate-300 px-2 py-[2px] text-[11px] font-semibold text-rose-700 transition hover:border-rose-400"
        >
          Clear
        </button>
      </div>
      <div className="mt-2 space-y-1">
        {recent.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleLoad(m)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:border-teal-400"
          >
            <span>{m.name} ({m.version})</span>
            <span className="text-[11px] text-slate-500">{m.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
