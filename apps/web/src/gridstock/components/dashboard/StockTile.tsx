// src/components/dashboard/StockTile.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Quote } from "@gridstock/types";
import { quoteService } from "@gridstock/services/localStorageService";

interface StockTileProps {
  quote: Quote;
  density?: "regular" | "compact";
  onRemove?: (symbol: string) => void;
  marketMode?: "Live" | "Simulated";
  isStale?: boolean;
}

const buildSparkline = (symbol: string, fallback: boolean, candles: number[]) => {
  if (!fallback && candles.length > 0) return candles;
  // Deterministic pseudo-random based on symbol for a consistent sparkline fallback
  const values: number[] = [];
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i);
  }
  let current = seed % 50 + 25;
  for (let i = 0; i < 20; i++) {
    current += ((seed + i * 7) % 7) - 3;
    current = Math.max(10, Math.min(90, current));
    values.push(current);
  }
  return values;
};

export const StockTile: React.FC<StockTileProps> = ({
  quote,
  density = "regular",
  onRemove,
  marketMode = "Simulated",
  isStale = false,
}) => {
  const isPositive = quote.change >= 0;
  const toneClass = isPositive
    ? "from-emerald-500/22 via-emerald-500/10 to-slate-950/90 border-emerald-400/40 shadow-[0_18px_34px_-24px_rgba(16,185,129,0.55)]"
    : "from-rose-500/22 via-rose-500/10 to-slate-950/90 border-rose-400/40 shadow-[0_18px_34px_-24px_rgba(248,113,113,0.5)]";
  const hoverClass = isPositive
    ? "hover:border-emerald-300/80 hover:shadow-[0_22px_36px_-24px_rgba(16,185,129,0.7)]"
    : "hover:border-rose-300/80 hover:shadow-[0_22px_36px_-24px_rgba(248,113,113,0.6)]";
  const [sparkPoints, setSparkPoints] = useState<number[]>([]);
  const [sparkSource, setSparkSource] = useState<"live" | "fallback">("fallback");
  const sparkColor = isPositive ? "rgb(var(--grid-success))" : "rgb(var(--grid-danger))";

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!quoteService.getIntraday) return;
        const candles = await quoteService.getIntraday(quote.symbol);
        if (!active || candles.length === 0) return;
        const closes = candles.map((c) => c.close);
        const min = Math.min(...closes);
        const max = Math.max(...closes);
        const normalized =
          max === min
            ? closes.map(() => 50)
            : closes.map((c) => ((c - min) / (max - min)) * 100);
        setSparkPoints(normalized);
        setSparkSource("live");
      } catch {
        // keep fallback sparkline
        setSparkSource("fallback");
      }
    })();
    return () => {
      active = false;
    };
  }, [quote.symbol]);

  const spark = useMemo(
    () => buildSparkline(quote.symbol, sparkSource === "fallback", sparkPoints),
    [quote.symbol, sparkPoints, sparkSource]
  );

  const updatedAt = quote.timestamp ? new Date(quote.timestamp) : null;
  const updatedLabel = updatedAt
    ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <Link href={`/gridstock/stock/${quote.symbol}`} className="block group">
      <div 
        className={`relative overflow-hidden bg-gradient-to-br ${toneClass} ${hoverClass} ${isStale ? "ring-1 ring-amber-300/70" : ""} rounded-2xl ${density === "compact" ? "p-3 h-32" : "p-4 h-36"} flex flex-col justify-between transition-all cursor-pointer`}
      >
        <div className="absolute -top-10 right-6 h-24 w-24 rounded-full blur-3xl opacity-0 transition-opacity group-hover:opacity-100">
          <div className={`h-full w-full ${isPositive ? "bg-emerald-400/30" : "bg-rose-400/30"}`} />
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(quote.symbol);
            }}
            className="absolute top-3 right-3 text-white/70 hover:text-white text-xs bg-black/30 hover:bg-black/50 rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Remove ${quote.symbol}`}
          >
            Remove
          </button>
        )}
        <div className="flex justify-between items-start">
          <span className={`font-bold ${density === "compact" ? "text-xl" : "text-2xl"} text-white tracking-wide`}>{quote.symbol}</span>
          <span className="text-white/90 text-sm font-semibold">
             {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex items-end justify-between gap-2">
           <div className="flex-1">
             <svg viewBox="0 0 100 40" className="w-full h-12 opacity-80">
               <polyline
                 fill="none"
                 stroke={sparkColor}
                 strokeWidth="2"
                 points={spark.map((v, idx) => `${(idx / (spark.length - 1)) * 100},${40 - (v / 100) * 40}`).join(" ")}
               />
             </svg>
           </div>
           <span className={`${density === "compact" ? "text-2xl" : "text-3xl"} font-bold text-white tracking-tight`}>
             ${quote.price.toFixed(2)}
           </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-white/70 uppercase tracking-wide">
          <span className={isStale ? "text-amber-100" : ""}>Updated {updatedLabel}</span>
          <span className={marketMode === "Live" ? "text-emerald-100" : ""}>{marketMode}</span>
        </div>
      </div>
    </Link>
  );
};
