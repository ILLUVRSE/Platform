// src/services/newsAggregator.ts
// Helper to gather news for a set of tickers with de-duplication and a general fallback.
import { NewsArticle } from "@gridstock/types";
import { newsService } from "./localStorageService";

const MAX_TICKERS = 6;

export async function fetchNewsForTickers(tickers: string[]): Promise<NewsArticle[]> {
  const uniqueSymbols = Array.from(
    new Set(tickers.map((t) => t.toUpperCase()).filter(Boolean))
  );

  if (uniqueSymbols.length === 0) {
    return newsService.getGeneralNews();
  }

  // Limit requests to avoid hammering the provider; prefer most recent symbols
  const symbols = uniqueSymbols.slice(0, MAX_TICKERS);
  const batches = await Promise.all(symbols.map((sym) => newsService.getNewsForTicker(sym)));
  const merged = batches.flat().sort((a, b) => b.timestamp - a.timestamp);

  // Remove near-duplicate headlines across tickers
  const seen = new Set<string>();
  const deduped: NewsArticle[] = [];
  merged.forEach((article) => {
    const key = `${article.source}-${article.headline}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(article);
  });

  return deduped;
}
