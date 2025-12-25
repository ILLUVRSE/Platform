// src/components/dashboard/LiveNewsPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NewsArticle } from "@gridstock/types";
import { Button } from "@gridstock/components/ui/Button";
import { Badge } from "@gridstock/components/ui/Badge";

interface LiveNewsPanelProps {
  title: string;
  subtitle?: string;
  news: NewsArticle[];
  loading: boolean;
  error?: string;
  watchingTickers: string[];
  onRefresh: () => void;
}

export const LiveNewsPanel: React.FC<LiveNewsPanelProps> = ({
  title,
  subtitle,
  news,
  loading,
  error,
  watchingTickers,
  onRefresh,
}) => {
  const watching =
    watchingTickers.length > 0
      ? watchingTickers.join(", ")
      : "General market";
  const subText = subtitle || "Streaming fresh headlines every 20 seconds.";
  const [timeFilter, setTimeFilter] = useState<"1h" | "6h" | "24h" | "all">("24h");
  const [tickerFilter, setTickerFilter] = useState<string>("all");
  const watchSet = useMemo(
    () => new Set(watchingTickers.map((t) => t.toUpperCase())),
    [watchingTickers]
  );

  useEffect(() => {
    if (tickerFilter !== "all" && !watchSet.has(tickerFilter)) {
      setTickerFilter("all");
    }
  }, [tickerFilter, watchSet]);

  const dedupedNews = useMemo(() => {
    const seen = new Set<string>();
    return news.filter((article) => {
      const key = `${article.source}-${article.headline}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [news]);

  const filteredNews = useMemo(() => {
    const now = Date.now();
    const cutoffMap: Record<"1h" | "6h" | "24h", number> = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
    };
    const timeCutoff =
      timeFilter === "all" ? null : now - cutoffMap[timeFilter];
    return dedupedNews.filter((article) => {
      if (timeCutoff && article.timestamp < timeCutoff) return false;
      if (tickerFilter === "all") return true;
      return article.relatedTickers?.some(
        (t) => t.toUpperCase() === tickerFilter
      );
    });
  }, [dedupedNews, timeFilter, tickerFilter]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-xs text-gray-500">{subText}</p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">
            Tracking: {watching}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={onRefresh}
          disabled={loading}
          className="whitespace-nowrap"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span>Filter:</span>
        <select
          className="bg-gray-800 text-xs px-2 py-1 rounded border border-gray-700"
          value={timeFilter}
          onChange={(e) =>
            setTimeFilter(e.target.value as "1h" | "6h" | "24h" | "all")
          }
        >
          <option value="1h">Last 1h</option>
          <option value="6h">Last 6h</option>
          <option value="24h">Last 24h</option>
          <option value="all">All</option>
        </select>
        <select
          className="bg-gray-800 text-xs px-2 py-1 rounded border border-gray-700"
          value={tickerFilter}
          onChange={(e) => setTickerFilter(e.target.value)}
        >
          <option value="all">All tickers</option>
          {watchingTickers.map((ticker) => (
            <option key={ticker} value={ticker.toUpperCase()}>
              {ticker.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredNews.map((article) => {
          const primaryTicker =
            article.relatedTickers?.find((t) => watchSet.has(t.toUpperCase())) ||
            article.relatedTickers?.[0];
          return (
          <div
            key={article.id}
            className="block bg-gray-800/60 border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold text-gray-100 leading-tight">
                {article.headline}
              </div>
              <Badge variant="neutral">{article.source}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <span>
                {new Date(article.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {article.relatedTickers && article.relatedTickers.length > 0 && (
                <>
                  <span>•</span>
                  <span className="flex gap-1">
                    {article.relatedTickers.map((t) => (
                      <span
                        key={`${article.id}-${t}`}
                        className={
                          watchSet.has(t.toUpperCase())
                            ? "text-green-400 font-medium"
                            : "text-gray-400"
                        }
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              {primaryTicker && (
                <Link
                  href={`/gridstock/stock/${primaryTicker}`}
                  className="px-2 py-1 rounded bg-gray-900 border border-gray-700 hover:border-gray-500 text-gray-200"
                >
                  Open {primaryTicker}
                </Link>
              )}
              {article.url && article.url !== "#" && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded bg-gray-900 border border-gray-700 hover:border-gray-500 text-gray-300"
                >
                  Source
                </a>
              )}
            </div>
          </div>
        );
        })}

        {!loading && filteredNews.length === 0 && (
          <div className="text-sm text-gray-500">
            No headlines yet. We will keep watching your symbols.
          </div>
        )}

        {loading && filteredNews.length === 0 && (
          <div className="text-sm text-gray-500">Loading headlines...</div>
        )}
      </div>
    </div>
  );
};
