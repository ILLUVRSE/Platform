import { NextRequest, NextResponse } from "next/server";
import { API_KEY, fetchQuoteBundle, fetchStooqQuotes } from "../utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbols: string[] = Array.isArray(body?.symbols) ? body.symbols : [];
    if (symbols.length === 0) {
      return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
    }

    if (!API_KEY) {
      const data = await fetchStooqQuotes(symbols);
      return NextResponse.json(data);
    }

    const merged = await Promise.all(symbols.map((symbol) => fetchQuoteBundle(symbol)));
    return NextResponse.json(merged);
  } catch (err) {
    console.error("[api/market/quotes]", err);
    return NextResponse.json({ error: "Batch quotes failed" }, { status: 500 });
  }
}
