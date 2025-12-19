import { NextResponse } from "next/server";

export const BASE_URL =
  process.env.MARKET_API_URL ||
  process.env.NEXT_PUBLIC_MARKET_API_URL ||
  "https://finnhub.io/api/v1";
export const API_KEY =
  process.env.MARKET_API_KEY || process.env.NEXT_PUBLIC_MARKET_API_KEY || "";

export function missing(param: string) {
  return NextResponse.json({ error: `Missing ${param}` }, { status: 400 });
}

export function withProviderUrl(path: string, query: Record<string, string>) {
  const params = new URLSearchParams({
    ...query,
    token: API_KEY,
  });
  return `${BASE_URL}${path}?${params.toString()}`;
}

export function noKeyResponse() {
  return NextResponse.json(
    { error: "Market API key missing on server" },
    { status: 503 }
  );
}

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
  v?: number;
};

type FinnhubMetric = {
  metric?: Record<string, unknown>;
};

type FinnhubProfile = {
  marketCapitalization?: number;
  finnhubIndustry?: string;
  gicsIndustry?: string;
  ipo?: string;
};

const num = (value: unknown, fallback = 0) =>
  typeof value === "number" ? value : typeof value === "string" ? Number(value) : fallback;

// Fetches a live quote and enriches it with fundamentals so the client has
// consistent, high-fidelity data (market cap, P/E, 52-week, dividend).
export async function fetchQuoteBundle(symbol: string) {
  if (!API_KEY) throw new Error("API key missing");
  const [quoteRes, metricRes, profileRes] = await Promise.all([
    fetch(withProviderUrl("/quote", { symbol }), { next: { revalidate: 0 } }),
    fetch(withProviderUrl("/stock/metric", { symbol, metric: "all" }), { next: { revalidate: 60 } }),
    fetch(withProviderUrl("/stock/profile2", { symbol }), { next: { revalidate: 600 } }),
  ]);

  if (!quoteRes.ok) throw new Error(`Quote error ${quoteRes.status}`);
  const quote = (await quoteRes.json()) as FinnhubQuote;

  const metrics = metricRes.ok ? ((await metricRes.json()) as FinnhubMetric) : { metric: {} };
  const profile = profileRes.ok ? ((await profileRes.json()) as FinnhubProfile) : {};
  const m = metrics.metric || {};

  const week52High = m["52WeekHigh"] ?? m["week52High"];
  const week52Low = m["52WeekLow"] ?? m["week52Low"];

  return {
    ...quote,
    marketCap: num(profile.marketCapitalization ?? m["marketCapitalization"]),
    pe: num(m["peInclExtraTTM"] ?? m["peBasicExclExtraItemsTTM"]),
    peRatio: num(m["peBasicExclExtraItemsTTM"]),
    week52High: num(week52High),
    week52Low: num(week52Low),
    dividendYield: num(m["dividendYieldIndicatedAnnual"]),
    sector: (profile.finnhubIndustry || profile.gicsIndustry) ?? "",
  };
}

type StooqQuote = {
  Symbol: string;
  Date: string;
  Time: string;
  Open: string;
  High: string;
  Low: string;
  Close: string;
  Volume: string;
};

export async function fetchStooqQuote(symbol: string) {
  const url = `https://stooq.pl/q/l/?s=${encodeURIComponent(symbol.toLowerCase())}.us&f=sd2t2ohlcv&h&e=json`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Stooq quote error ${res.status}`);
  const payload = (await res.json()) as { symbol?: string; data?: StooqQuote[]; [k: string]: unknown };
  const row = Array.isArray(payload) ? (payload as unknown as StooqQuote[])[0] : (payload as { data?: StooqQuote[] }).data?.[0];
  if (!row) throw new Error("Stooq payload missing");
  const close = Number(row.Close);
  const open = Number(row.Open);
  const change = close - open;
  const dp = open ? (change / open) * 100 : 0;
  return {
    c: close,
    d: change,
    dp,
    v: Number(row.Volume),
    t: Date.now() / 1000,
    symbol: row.Symbol?.toUpperCase() ?? symbol.toUpperCase(),
  };
}

export async function fetchStooqQuotes(symbols: string[]) {
  return Promise.all(symbols.map((s) => fetchStooqQuote(s)));
}

export async function fetchStooqDailyCsv(symbol: string) {
  const url = `https://stooq.pl/q/d/l/?s=${encodeURIComponent(symbol.toLowerCase())}.us&i=d`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Stooq candles error ${res.status}`);
  const text = await res.text();
  // CSV header: Date,Open,High,Low,Close,Volume
  const lines = text.trim().split("\n").slice(1);
  return lines.map((line) => {
    const [date, open, high, low, close, volume] = line.split(",");
    const time = new Date(date).getTime();
    return {
      t: time / 1000,
      o: Number(open),
      h: Number(high),
      l: Number(low),
      c: Number(close),
      v: Number(volume),
    };
  });
}
