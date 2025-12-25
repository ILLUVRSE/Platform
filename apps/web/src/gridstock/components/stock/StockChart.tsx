// src/components/stock/StockChart.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { quoteService } from "@gridstock/services/localStorageService";
import { Candle } from "@gridstock/types";

interface StockChartProps {
  isPositive: boolean;
  symbol: string;
}

export const StockChart: React.FC<StockChartProps> = ({ isPositive, symbol }) => {
  const color = isPositive ? "#22c55e" : "#ef4444"; // green-500 or red-500
  const [series, setSeries] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = (await quoteService.getIntraday?.(symbol)) || [];
        if (isMounted) setSeries(data);
      } catch (err) {
        console.warn("Intraday load failed", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol]);

  const pathD = useMemo(() => {
    if (series.length === 0) return "";
    const min = Math.min(...series.map((c) => c.low));
    const max = Math.max(...series.map((c) => c.high));
    const range = max - min || 1;
    const xs = series.map((_, idx) => (idx / Math.max(1, series.length - 1)) * 100);
    const points = series.map(
      (c, idx) => `${xs[idx]},${100 - ((c.close - min) / range) * 100}`
    );
    return `M${points[0]} L` + points.join(" L");
  }, [series]);

  return (
    <div className="w-full h-64 bg-gray-900/30 rounded-xl border border-gray-800 p-4 relative overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {pathD && (
          <>
            <path d={`${pathD} V100 H0 Z`} fill="url(#gradient)" stroke="none" />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      
      {/* Time range tabs (visual only) */}
      <div className="absolute bottom-2 left-4 flex gap-2">
         {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map(t => (
            <button 
              key={t} 
              className={`text-xs font-bold px-2 py-1 rounded ${t === '1D' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t}
            </button>
         ))}
      </div>

      {loading && (
        <div className="absolute top-2 right-3 text-xs text-gray-400">Updating…</div>
      )}
    </div>
  );
};
