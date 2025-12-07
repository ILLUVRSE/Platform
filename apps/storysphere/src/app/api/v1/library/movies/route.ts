import { NextResponse } from "next/server";
import { moviesCatalog } from "../../../../../lib/libraryData";
import { store } from "../../../../../lib/store";
import { ingestMovies } from "../../../../../lib/libraryIngest";

export async function GET() {
  const { movies } = await store.getLibrary();
  if (!movies || movies.length === 0) {
    const ingested = await ingestMovies();
    return NextResponse.json({ movies: ingested });
  }
  return NextResponse.json({ movies: movies ?? moviesCatalog });
}
