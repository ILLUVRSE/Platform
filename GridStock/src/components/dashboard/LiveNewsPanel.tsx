// src/components/dashboard/LiveNewsPanel.tsx
"use client";

import React from "react";
import { NewsArticle } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {news.map((article) => (
          <a
            key={article.id}
            href={article.url || "#"}
            target={article.url && article.url !== "#" ? "_blank" : undefined}
            rel="noreferrer"
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
                        className="text-green-400 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>
          </a>
        ))}

        {!loading && news.length === 0 && (
          <div className="text-sm text-gray-500">
            No headlines yet. We will keep watching your symbols.
          </div>
        )}

        {loading && news.length === 0 && (
          <div className="text-sm text-gray-500">Loading headlines...</div>
        )}
      </div>
    </div>
  );
};
