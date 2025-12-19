import { NextRequest, NextResponse } from "next/server";
import { API_KEY, missing, withProviderUrl } from "../utils";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return missing("symbol");

  try {
    if (!API_KEY) {
      return NextResponse.json(
        {
          metric: {},
          note: "Fundamentals unavailable without API key; using mock fallback on client.",
        },
        { status: 200 }
      );
    }
    // Finnhub metrics
    const url = withProviderUrl("/stock/metric", {
      symbol,
      metric: "all",
    });
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Fundamentals error ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/market/fundamentals]", err);
    return NextResponse.json({ error: "Fundamentals fetch failed" }, { status: 500 });
  }
}
