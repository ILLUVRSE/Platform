import { NextRequest, NextResponse } from "next/server";
import { API_KEY, missing, noKeyResponse, withProviderUrl } from "../utils";

type WikiFeaturedItem = {
  id?: string | number;
  displaytitle?: string;
  title?: string;
  content_urls?: {
    desktop?: { page?: string };
    mobile?: { page?: string };
  };
  url?: string;
  timestamp?: string;
};

type WikiFeaturedResponse = {
  items?: {
    links?: { items?: WikiFeaturedItem[] };
  }[];
};

function formatDate(ts: number) {
  return new Date(ts).toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  const category = req.nextUrl.searchParams.get("category");

  try {
    if (!API_KEY) {
      // Public fallback: Wikipedia featured/news feed
      const url = "https://en.wikipedia.org/api/rest_v1/feed/news/featured";
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) return noKeyResponse();
      const data = (await res.json()) as WikiFeaturedResponse;
      const items = Array.isArray(data?.items?.[0]?.links?.items)
        ? data.items?.[0]?.links?.items ?? []
        : Array.isArray(data?.items)
        ? (data.items as unknown as WikiFeaturedItem[])
        : [];
      const mapped = items.map((item, idx: number) => ({
        id: item?.id?.toString() || `wiki-${idx}`,
        headline: item?.displaytitle ?? item?.title ?? "Wikipedia News",
        source: "Wikipedia",
        url:
          item?.content_urls?.desktop?.page ??
          item?.content_urls?.mobile?.page ??
          item?.url ??
          "#",
        timestamp: item?.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
        related: ticker ? [ticker] : [],
      }));
      return NextResponse.json(mapped);
    }

    if (ticker) {
      const now = Date.now();
      const from = formatDate(now - 3 * 24 * 60 * 60 * 1000);
      const to = formatDate(now);
      const url = withProviderUrl("/company-news", { symbol: ticker, from, to });
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) {
        return NextResponse.json(
          { error: `News error ${res.status}` },
          { status: res.status }
        );
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (category) {
      const url = withProviderUrl("/news", { category });
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) {
        return NextResponse.json(
          { error: `News error ${res.status}` },
          { status: res.status }
        );
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    return missing("ticker or category");
  } catch (err) {
    console.error("[api/market/news]", err);
    return NextResponse.json({ error: "News fetch failed" }, { status: 500 });
  }
}
