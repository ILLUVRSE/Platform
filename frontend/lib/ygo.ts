import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

export type Episode = {
  productionId: number;
  season: number;
  episode: number;
  title: string;
  filename: string;
  url: string;
  durationSeconds?: number;
};

export type Season = {
  seasonNumber: number;
  episodes: Episode[];
};

const VIDEO_DIR = path.join(process.cwd(), "public");
const durationCache = new Map<string, number>();
const FALLBACK_DURATION_SECONDS = 1300; // ~21.6 minutes

function probeDurationSeconds(filePath: string): number | null {
  if (durationCache.has(filePath)) {
    return durationCache.get(filePath)!;
  }

  try {
    const output = execFileSync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const duration = parseFloat(output.toString().trim());
    if (Number.isFinite(duration)) {
      durationCache.set(filePath, duration);
      return duration;
    }
  } catch (err) {
    // ffprobe not available or file unreadable; fall through
  }

  return null;
}

type LoadOptions = {
  includeDurations?: boolean;
};

export function loadYuGiOhSeasons(
  options: LoadOptions = {},
): Season[] {
  const { includeDurations = false } = options;
  if (!fs.existsSync(VIDEO_DIR)) return [];

  const files = fs.readdirSync(VIDEO_DIR);

  const episodes: Episode[] = files
    .filter((file) => file.toLowerCase().endsWith(".mp4"))
    .map((file) => {
      const match = file.match(
        /^(\d+)\s+-\s+S(\d{2})\s+E(\d{2})\s+-\s+(.+)\.mp4$/i,
      );
      if (!match) return null;

      const [, production, season, episode, rawTitle] = match;

      let durationSeconds: number | undefined;
      if (includeDurations) {
        durationSeconds =
          probeDurationSeconds(path.join(VIDEO_DIR, file)) ??
          FALLBACK_DURATION_SECONDS;
      }

      const ep: Episode = {
        productionId: Number(production),
        season: Number(season),
        episode: Number(episode),
        title: rawTitle,
        filename: file,
        url: `/${encodeURI(file)}`,
        durationSeconds,
      };
      return ep;
    })
    .filter((item): item is Episode => item !== null);

  const grouped = episodes.reduce<Map<number, Episode[]>>((acc, ep) => {
    if (!acc.has(ep.season)) acc.set(ep.season, []);
    acc.get(ep.season)!.push(ep);
    return acc;
  }, new Map());

  const seasons: Season[] = Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([seasonNumber, eps]) => ({
      seasonNumber,
      episodes: eps.sort((a, b) => a.episode - b.episode),
    }));

  return seasons;
}

export function loadYuGiOhSeasonsWithDurations(): Season[] {
  return loadYuGiOhSeasons({ includeDurations: true });
}
