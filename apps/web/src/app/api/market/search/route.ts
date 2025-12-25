import { NextRequest, NextResponse } from "next/server";
import { API_KEY, missing, noKeyResponse, withProviderUrl } from "../utils";

type WikiSearchPage = { title: string };
type WikiSearchResponse = { query?: { search?: WikiSearchPage[] } };
type ProviderSearchItem = {
  symbol?: string;
  ticker?: string;
  description?: string;
  name?: string;
  sector?: string;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return missing("q");
  if (!API_KEY) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${encodeURIComponent(
        q
      )}&origin=*`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      const data: WikiSearchResponse = await res.json();
      const result =
        data?.query?.search?.map((item) => ({
          symbol: item.title.toUpperCase().replace(/\s+/g, "").slice(0, 5),
          name: item.title,
          sector: "Public",
        })) ?? [];
      return NextResponse.json({ result });
    } catch (err) {
      console.error("[api/market/search wiki]", err);
      return noKeyResponse();
    }
  }

  try {
    const url = withProviderUrl("/search", { q });
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Search error ${res.status}` },
        { status: res.status }
      );
    }
    const data: { result?: ProviderSearchItem[] } | ProviderSearchItem[] = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/market/search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
