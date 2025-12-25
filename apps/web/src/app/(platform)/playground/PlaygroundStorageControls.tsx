"use client";

import { useEffect, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";

export function PlaygroundStorageControls() {
  const [stored, setStored] = useState<AceAgentManifest | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ace-playground-manifest");
      if (raw) {
        setStored(JSON.parse(raw) as AceAgentManifest);
      }
    } catch {
      setStored(null);
    }
  }, []);

  function clearStorage() {
    try {
      localStorage.removeItem("ace-playground-manifest");
      localStorage.removeItem("ace-wizard-draft");
      document.cookie = "ace-playground-manifest=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      setStored(null);
    } catch {
      setStored(null);
    }
  }

  function reloadStored() {
    if (!stored) return;
    try {
      const json = JSON.stringify(stored, null, 2);
      localStorage.setItem("ace-playground-manifest", json);
      document.cookie = `ace-playground-manifest=${encodeURIComponent(json)}; path=/; max-age=900`;
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
      {stored ? (
        <>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            Stored: {stored.name} ({stored.version})
          </span>
          <button
            type="button"
            onClick={reloadStored}
            className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-800 transition hover:border-teal-500/70"
          >
            Reload stored
          </button>
        </>
      ) : (
        <span className="rounded-full bg-slate-100 px-3 py-1">No manifest stored</span>
      )}
      <button
        type="button"
        onClick={clearStorage}
        className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-700 transition hover:border-rose-500"
      >
        Clear Playground storage
      </button>
    </div>
  );
}
