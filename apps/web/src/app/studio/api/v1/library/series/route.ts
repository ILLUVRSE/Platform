import { NextResponse } from "next/server";
import { seriesCatalog } from "@studio/lib/libraryData";
import { store } from "@studio/lib/store";
import { ingestSeries } from "@studio/lib/libraryIngest";

export async function GET() {
  const { series } = await store.getLibrary();
  if (!series || series.length === 0) {
    const ingested = await ingestSeries();
    return NextResponse.json({ series: ingested });
  }
  return NextResponse.json({ series: series ?? seriesCatalog });
}
