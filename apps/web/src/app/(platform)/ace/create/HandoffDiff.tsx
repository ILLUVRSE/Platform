"use client";

import { useEffect, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { summarizeDiff } from "./utils";

type Props = {
  current: AceAgentManifest;
  storageKey: string;
};

export function HandoffDiff({ current, storageKey }: Props) {
  const [diff, setDiff] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as AceAgentManifest;
      setDiff(summarizeDiff(stored, current));
    } catch {
      setDiff([]);
    }
  }, [current, storageKey]);

  if (!diff.length) return null;

  return (
    <div className="rounded-2xl border border-[color:var(--ace-border)] bg-white/90 p-4 text-sm text-slate-700">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
        Diff vs last Playground manifest
      </div>
      <ul className="mt-2 space-y-1 text-[12px]">
        {diff.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
