"use client";

import { useState } from "react";

export function AddToLiveLoopButton({
  title,
  duration,
  sha
}: {
  title: string;
  duration: string;
  sha?: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setStatus("Adding...");
    setError(null);
    try {
      const res = await fetch("/studio/api/v1/liveloop/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, duration, sha })
      });
      if (!res.ok) {
        setError(`Failed: ${res.status}`);
        setStatus(null);
        return;
      }
      setStatus("Added to LiveLoop");
    } catch (e) {
      setError((e as Error).message);
      setStatus(null);
    }
  };

  return (
    <div className="space-y-1 text-sm">
      <button
        onClick={add}
        className="rounded-full border border-slate-600 px-3 py-1 text-sm text-cream transition hover:border-teal-500/70 hover:text-teal-200"
      >
        Add to LiveLoop
      </button>
      {status && <div className="text-teal-200">{status}</div>}
      {error && <div className="text-red-300">{error}</div>}
    </div>
  );
}
