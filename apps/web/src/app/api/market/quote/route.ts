import { NextRequest, NextResponse } from "next/server";
import { API_KEY, fetchQuoteBundle, fetchStooqQuote, missing } from "../utils";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return missing("symbol");
  if (!API_KEY) {
    try {
      const data = await fetchStooqQuote(symbol);
      return NextResponse.json(data);
    } catch (err) {
      console.error("[api/market/quote stooq]", err);
      return noKeyResponse();
    }
  }

  try {
    const data = await fetchQuoteBundle(symbol);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/market/quote]", err);
    return NextResponse.json({ error: "Quote fetch failed" }, { status: 500 });
  }
}
