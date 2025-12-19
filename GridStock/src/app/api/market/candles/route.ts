import { NextRequest, NextResponse } from "next/server";
import { API_KEY, fetchStooqDailyCsv, missing, withProviderUrl } from "../utils";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return missing("symbol");

  try {
    if (!API_KEY) {
      const candles = await fetchStooqDailyCsv(symbol);
      return NextResponse.json({
        c: candles.map((c) => c.c),
        h: candles.map((c) => c.h),
        l: candles.map((c) => c.l),
        o: candles.map((c) => c.o),
        v: candles.map((c) => c.v),
        t: candles.map((c) => c.t),
        s: "ok",
      });
    }

    // Fetch last trading day intraday candles (5m resolution)
    const nowSec = Math.floor(Date.now() / 1000);
    const from = nowSec - 6 * 60 * 60; // ~6 hours back
    const url = withProviderUrl("/stock/candle", {
      symbol,
      resolution: "5",
      from: String(from),
      to: String(nowSec),
    });

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Candles error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/market/candles]", err);
    return NextResponse.json({ error: "Candle fetch failed" }, { status: 500 });
  }
}
