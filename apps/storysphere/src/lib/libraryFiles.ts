import fs from "fs";
import path from "path";
import { moviesCatalog } from "./libraryData";

export type LibraryVideoKind = "feature" | "render";

export type LibraryVideo = {
  fileName: string;
  url: string;
  sizeLabel: string;
  bytes: number;
  title: string;
  duration?: string;
  kind: LibraryVideoKind;
};

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MEDIA_BASE = (process.env.MEDIA_BASE_URL || "").replace(/\/$/, "");

export function getLibraryVideos(): LibraryVideo[] {
  const featureVideos = buildFeatureVideos();
  const featureNames = new Set(featureVideos.map((v) => v.fileName));
  const renderVideos = buildRenderVideos(featureNames);

  return [...featureVideos, ...renderVideos];
}

function formatMegabytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

function trimExtension(name: string) {
  return name.replace(/\.mp4$/i, "");
}

function buildFeatureVideos(): LibraryVideo[] {
  return moviesCatalog
    .filter((movie) => movie.file)
    .map((movie) => {
      const fileName = movie.file as string;
      const { url, sizeLabel, bytes } = resolveAsset(fileName);
      return {
        fileName,
        url,
        sizeLabel,
        bytes,
        title: movie.title,
        duration: movie.duration,
        kind: "feature" as const
      };
    });
}

function buildRenderVideos(skipNames: Set<string>): LibraryVideo[] {
  const videos: LibraryVideo[] = [];
  try {
    const entries = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true });
    const mp4s = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp4"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    for (const fileName of mp4s) {
      if (skipNames.has(fileName)) continue;
      const filePath = path.join(PUBLIC_DIR, fileName);
      const stat = safeStat(filePath);
      videos.push({
        fileName,
        url: `/${encodeURIComponent(fileName)}`,
        sizeLabel: stat ? formatMegabytes(stat.size) : "local",
        bytes: stat?.size ?? 0,
        title: trimExtension(fileName),
        kind: "render"
      });
    }
  } catch {
    // ignore missing public dir
  }
  return videos;
}

function resolveAsset(fileName: string): { url: string; sizeLabel: string; bytes: number } {
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return { url: fileName, sizeLabel: "remote", bytes: 0 };
  }

  const publicPath = path.join(PUBLIC_DIR, fileName);
  const stat = safeStat(publicPath);

  if (MEDIA_BASE) {
    return {
      url: `${MEDIA_BASE}/${encodeURIComponent(fileName)}`,
      sizeLabel: stat ? formatMegabytes(stat.size) : "remote",
      bytes: stat?.size ?? 0
    };
  }

  return {
    url: `/${encodeURIComponent(fileName)}`,
    sizeLabel: stat ? formatMegabytes(stat.size) : "local",
    bytes: stat?.size ?? 0
  };
}

function safeStat(filePath: string) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}
