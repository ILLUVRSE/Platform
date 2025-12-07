import { NextResponse } from "next/server";
import { seriesCatalog } from "../../../../../lib/libraryData";
import { store } from "../../../../../lib/store";
import { ingestSeries } from "../../../../../lib/libraryIngest";

export async function GET() {
  const { series } = await store.getLibrary();
  if (!series || series.length === 0) {
    const ingested = await ingestSeries();
    return NextResponse.json({ series: ingested });
  }
  return NextResponse.json({ series: series ?? seriesCatalog });
}
