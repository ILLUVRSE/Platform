// src/services/marketDataService.ts
// Provides a resilient quote/news service that prefers a real market API when configured
// and falls back to the existing mock services. Includes basic retry/backoff.
import { Quote, QuoteService, Stock, NewsService, NewsArticle, Candle, Fundamentals } from "@gridstock/types";
import { MockQuoteService, MOCK_STOCKS } from "./mockQuoteService";
import { MockNewsService } from "./mockNewsService";

type QuotePayload = Record<string, unknown>;
type SearchPayload = Record<string, unknown>;
type NewsPayload = Record<string, unknown>;

type Fetcher = typeof fetch;

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  backoffMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const wait = backoffMs * Math.pow(2, i);
      await new Promise((res) => setTimeout(res, wait));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export class ResilientQuoteService implements QuoteService {
  private mock = new MockQuoteService();
  private fetcher: Fetcher;

  constructor(fetcher: Fetcher = fetch) {
    this.fetcher = fetcher;
  }

  private get useMock() {
    return process.env.NEXT_PUBLIC_FORCE_MOCK === "true";
  }

  private async fetchQuote(symbol: string): Promise<Quote> {
    const url = `/api/market/quote?symbol=${encodeURIComponent(symbol)}`;
    const res = await this.fetcher(url);
    if (!res.ok) {
      throw new Error(`Quote fetch failed ${res.status}`);
    }
    const data: QuotePayload = await res.json();
    return this.mapQuoteFromPayload(data, symbol);
  }

  async getQuote(symbol: string): Promise<Quote> {
    if (this.useMock) return this.mock.getQuote(symbol);
    try {
      return await withRetry(() => this.fetchQuote(symbol));
    } catch (err) {
      console.warn("[quotes] falling back to mock", err);
      return this.mock.getQuote(symbol);
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (this.useMock) return this.mock.getQuotes(symbols);
    try {
      const res = await this.fetcher(`/api/market/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });
      if (!res.ok) throw new Error(`Batch quote error ${res.status}`);
      const data: QuotePayload[] = await res.json();
      return data.map((_, idx) => this.mapQuoteFromPayload(data[idx], symbols[idx]));
    } catch (err) {
      console.warn("[quotes] batch fallback to mock", err);
      return this.mock.getQuotes(symbols);
    }
  }

  private mapQuoteFromPayload(data: QuotePayload, symbol: string): Quote {
    const num = (key: string, fallback = 0) =>
      Number((data[key] as number | string | undefined) ?? fallback);
    const str = (key: string) => (data[key] as string | undefined) || "";
    return {
      symbol: symbol.toUpperCase(),
      price: num("c", num("price")),
      change: num("d", num("change")),
      changePercent: num("dp", num("changePercent")),
      timestamp: num("t") ? num("t") * 1000 : Date.now(),
      volume: num("v", num("volume")),
      marketCap: num("marketCap"),
      peRatio: num("pe", num("peRatio")),
      high52Week: num("week52High", num("high52Week")),
      low52Week: num("week52Low", num("low52Week")),
      dividendYield: num("dividendYield"),
      sector: str("sector") || undefined,
    };
  }

  async searchStocks(query: string): Promise<Stock[]> {
    if (!query.trim()) return [];
    if (this.useMock) return this.mock.searchStocks(query);

    try {
      const url = `/api/market/search?q=${encodeURIComponent(query)}`;
      const res = await this.fetcher(url);
      if (!res.ok) throw new Error(`Search failed ${res.status}`);
      const data: { result?: SearchPayload[] } | SearchPayload[] = await res.json();
      const list = Array.isArray(data) ? data : data.result || [];
      return list.map((item: SearchPayload) => ({
        symbol: ((item.symbol as string) || (item.ticker as string) || "").toUpperCase(),
        name: (item.description as string) || (item.name as string) || (item.symbol as string),
        sector: item.sector as string | undefined,
      }));
    } catch (err) {
      console.warn("[quotes] search fallback to mock", err);
      return this.mock.searchStocks(query);
    }
  }

  async getIntraday(symbol: string): Promise<Candle[]> {
    if (this.useMock) return this.mock.getIntraday(symbol);
    try {
      const url = `/api/market/candles?symbol=${encodeURIComponent(symbol)}`;
      const res = await this.fetcher(url);
      if (!res.ok) throw new Error(`Candles failed ${res.status}`);
      const data: { c?: number[]; h?: number[]; l?: number[]; o?: number[]; v?: number[]; t?: number[]; s?: string } =
        await res.json();

      if (!data.c || !data.t) throw new Error("Invalid candle payload");
      const candles: Candle[] = data.t.map((ts, idx) => ({
        time: Number(ts) * 1000,
        open: Number(data.o?.[idx] ?? 0),
        high: Number(data.h?.[idx] ?? 0),
        low: Number(data.l?.[idx] ?? 0),
        close: Number(data.c?.[idx] ?? 0),
        volume: Number(data.v?.[idx] ?? 0),
      }));
      return candles;
    } catch (err) {
      console.warn("[quotes] candles fallback to mock", err);
      return this.mock.getIntraday(symbol);
    }
  }

  async getFundamentals(symbol: string): Promise<Fundamentals> {
    if (this.useMock) return this.mock.getFundamentals(symbol);
    try {
      const url = `/api/market/fundamentals?symbol=${encodeURIComponent(symbol)}`;
      const res = await this.fetcher(url);
      if (!res.ok) throw new Error(`Fundamentals failed ${res.status}`);
      const payload: { metric?: Record<string, unknown> } = await res.json();
      const m = payload.metric || {};
      const num = (k: string, fallback = 0) =>
        Number((m[k] as number | string | undefined) ?? fallback);
      return {
        symbol: symbol.toUpperCase(),
        marketCap: num("marketCapitalization"),
        peRatio: num("peInclExtraTTM"),
        forwardPE: num("forwardPE"),
        eps: num("epsBasicExclExtraItemsTTM"),
        revenueTTM: num("revenueTTM"),
        profitMargin: num("netProfitMarginTTM"),
        dividendYield: num("dividendYieldIndicatedAnnual"),
        beta: num("beta"),
      };
    } catch (err) {
      console.warn("[quotes] fundamentals fallback to mock", err);
      return this.mock.getFundamentals(symbol);
    }
  }
}

export class ResilientNewsService implements NewsService {
  private mock = new MockNewsService();
  private fetcher: Fetcher;

  constructor(fetcher: Fetcher = fetch) {
    this.fetcher = fetcher;
  }

  private get useMock() {
    return process.env.NEXT_PUBLIC_FORCE_MOCK === "true";
  }

  private mapNews(raw: NewsPayload): NewsArticle {
    return {
      id:
        raw.id?.toString() ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)),
      headline: (raw.headline as string) || (raw.title as string),
      source: (raw.source as string) || "News",
      url: (raw.url as string) || "#",
      timestamp: raw.datetime ? Number(raw.datetime) * 1000 : Date.now(),
      relatedTickers: raw.related ? String(raw.related).split(",") : [],
    };
  }

  async getNewsForTicker(symbol: string): Promise<NewsArticle[]> {
    if (this.useMock) return this.mock.getNewsForTicker(symbol);
    try {
      const url = `/api/market/news?ticker=${encodeURIComponent(symbol)}`;
      const res = await this.fetcher(url);
      if (!res.ok) throw new Error(`News failed ${res.status}`);
      const data: NewsPayload[] = await res.json();
      return data.map((item) => this.mapNews(item));
    } catch (err) {
      console.warn("[news] fallback to mock", err);
      return this.mock.getNewsForTicker(symbol);
    }
  }

  async getGeneralNews(): Promise<NewsArticle[]> {
    if (this.useMock) return this.mock.getGeneralNews();
    try {
      const url = `/api/market/news?category=general`;
      const res = await this.fetcher(url);
      if (!res.ok) throw new Error(`News failed ${res.status}`);
      const data: NewsPayload[] = await res.json();
      return data.map((item) => this.mapNews(item));
    } catch (err) {
      console.warn("[news] general fallback to mock", err);
      return this.mock.getGeneralNews();
    }
  }
}

// Helper to derive sectors for unknown tickers when using mock fallback
export function inferSector(symbol: string): string {
  const found = MOCK_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
  return found?.sector || "Unknown";
}
