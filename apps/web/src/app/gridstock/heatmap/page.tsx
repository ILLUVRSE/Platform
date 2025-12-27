// src/app/heatmap/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Quote } from "@gridstock/types";
import { storageService, quoteService } from "@gridstock/services/localStorageService";
import { DEFAULT_GRIDS } from "@gridstock/services/storageDefaults";

export default function HeatmapPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tickers = useMemo(() => {
    storageService.initializeDefaults();
    const grids = storageService.getGrids() || DEFAULT_GRIDS;
    const symbols = grids.flatMap((g) => g.tickers);
    return Array.from(new Set(symbols));
  }, []);

  useEffect(() => {
    const load = async () => {
      if (tickers.length === 0) return;
      setLoading(true);
      setError("");
      try {
        const data = await quoteService.getQuotes(tickers);
        setQuotes(data);
      } catch (err) {
        console.warn("Heatmap quotes failed", err);
        setError("Unable to load quotes for heatmap.");
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [tickers]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Today’s Tape</h1>
        <p className="text-slate-400">Heatmap of your tracked symbols.</p>
      </header>

      {error && (
        <div className="text-rose-200 text-sm bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
          {error}
        </div>
      )}

      {loading && quotes.length === 0 && (
        <div className="text-slate-500">Loading heatmap...</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {quotes.map((q) => (
          <div
            key={q.symbol}
            className="relative rounded-lg p-3 text-white shadow-sm"
            style={{ backgroundColor: colorForChange(q.changePercent) }}
          >
            <div className="flex justify-between text-sm font-bold">
              <span>{q.symbol}</span>
              <span>{q.changePercent.toFixed(2)}%</span>
            </div>
            <div className="text-lg font-extrabold mt-2">${q.price.toFixed(2)}</div>
            <div className="text-xs text-white/80">Vol {(q.volume / 1_000_000).toFixed(1)}M</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function colorForChange(pct: number) {
  // green to red gradient
  const clamp = Math.max(-5, Math.min(5, pct));
  const ratio = (clamp + 5) / 10; // 0..1
  const r = Math.round(255 * (1 - ratio));
  const g = Math.round(180 * ratio + 30);
  return `rgb(${r}, ${g}, 80)`;
}
