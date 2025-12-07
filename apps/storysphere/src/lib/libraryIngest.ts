import fs from "fs/promises";
import path from "path";
import { moviesCatalog, seriesCatalog } from "./libraryData";

const seriesRoot = process.env.SERIES_ROOT ?? path.join(process.cwd(), "apps/storysphere/data/series");
const moviesRoot = process.env.MOVIES_ROOT ?? path.join(process.cwd(), "apps/storysphere/data/movies");

export async function ingestSeries() {
  try {
    const entries = await fs.readdir(seriesRoot, { withFileTypes: true });
    const series = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(seriesRoot, entry.name, "manifest.json");
      try {
        const raw = await fs.readFile(manifestPath, "utf-8");
        series.push(JSON.parse(raw));
      } catch {
        // skip invalid manifests
      }
    }
    return series.length ? series : seriesCatalog;
  } catch {
    return seriesCatalog;
  }
}

export async function ingestMovies() {
  try {
    const files = await fs.readdir(moviesRoot);
    const movies = files
      .filter((f) => f.endsWith(".json"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(moviesRoot, file), "utf-8");
        return JSON.parse(raw);
      });
    const resolved = await Promise.all(movies);
    return resolved.length ? resolved : moviesCatalog;
  } catch {
    return moviesCatalog;
  }
}
