// src/components/dashboard/StockTile.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Quote } from "@/types";
import { quoteService } from "@/services/localStorageService";

interface StockTileProps {
  quote: Quote;
  density?: "regular" | "compact";
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

export const StockTile: React.FC<StockTileProps> = ({ quote, density = "regular" }) => {
  const isPositive = quote.change >= 0;
  const colorClass = isPositive ? "bg-green-600" : "bg-red-600";
  const hoverClass = isPositive ? "hover:bg-green-500" : "hover:bg-red-500";
  const [sparkPoints, setSparkPoints] = useState<number[]>([]);
  const [sparkSource, setSparkSource] = useState<"live" | "fallback">("fallback");

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

  return (
    <Link href={`/stock/${quote.symbol}`}>
      <div 
        className={`${colorClass} ${hoverClass} rounded-lg ${density === "compact" ? "p-3 h-28" : "p-4 h-32"} flex flex-col justify-between transition-colors cursor-pointer shadow-lg`}
      >
        <div className="flex justify-between items-start">
          <span className={`font-bold ${density === "compact" ? "text-xl" : "text-2xl"} text-white tracking-wide`}>{quote.symbol}</span>
          <span className="text-white/90 text-sm font-medium">
             {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex items-end justify-between gap-2">
           <div className="flex-1">
             <svg viewBox="0 0 100 40" className="w-full h-12 opacity-80">
               <polyline
                 fill="none"
                 stroke="white"
                 strokeWidth="2"
                 points={spark.map((v, idx) => `${(idx / (spark.length - 1)) * 100},${40 - (v / 100) * 40}`).join(" ")}
               />
             </svg>
           </div>
           <span className={`${density === "compact" ? "text-2xl" : "text-3xl"} font-bold text-white tracking-tight`}>
             ${quote.price.toFixed(2)}
           </span>
        </div>
      </div>
    </Link>
  );
};
