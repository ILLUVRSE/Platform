"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/config";

type Item = {
  key: string;
  url: string;
  size: number;
  lastModified?: string;
};

export default function LibraryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/v1/library`);
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        setItems(data.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load library");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <p className="uppercase text-xs tracking-[0.3em] text-white/60 mb-2">
          Library
        </p>
        <h1 className="text-3xl font-serif font-bold">StorySphere Media</h1>
        <p className="text-white/75">
          Listing objects from MinIO with signed URLs.
        </p>
      </header>

      {loading && <div className="text-white/70">Loading…</div>}
      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <a
              key={item.key}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-[var(--color-accent)]/40 transition flex flex-col gap-2"
            >
              <div className="text-sm text-white/60 break-words">{item.key}</div>
              <div className="text-xs text-white/50">
                {formatBytes(item.size)}
                {item.lastModified ? ` · ${new Date(item.lastModified).toLocaleString()}` : ""}
              </div>
              <div className="text-[var(--color-accent)] text-sm font-semibold">
                Open →
              </div>
            </a>
          ))}
          {items.length === 0 && (
            <div className="text-white/60">No objects found in bucket.</div>
          )}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
