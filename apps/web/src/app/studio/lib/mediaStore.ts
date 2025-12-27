import path from "path";
import fs from "fs/promises";
import { sha256File } from "./hash";

type MediaFile = { id: string; title: string; path: string; duration?: string; sha256?: string };
export type LatestMedia = {
  fileName: string;
  title: string;
  path: string;
  mtimeMs: number;
  sizeBytes: number;
};

const mediaRoots = [
  process.env.MEDIA_ROOT ?? path.join(process.cwd(), "public"),
  path.join(process.cwd(), "src/app/studio/library")
];
const allowedExt = [".mp4", ".mkv", ".mov", ".avi", ".mpeg"];

export async function listMedia(): Promise<MediaFile[]> {
  const results: MediaFile[] = [];

  for (const root of mediaRoots) {
    try {
      const entries = await fs.readdir(root);
      const files = entries.filter((f) => allowedExt.some((ext) => f.toLowerCase().endsWith(ext)));
      results.push(
        ...files.map((file) => ({
          id: file,
          title: file.replace(/\.[^/.]+$/, ""),
          path: path.join(root, file)
        }))
      );
    } catch {
      // ignore roots that don't exist
    }
  }

  return results;
}

export async function latestMedia(): Promise<LatestMedia | null> {
  const candidates: LatestMedia[] = [];

  for (const root of mediaRoots) {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!allowedExt.some((ext) => entry.name.toLowerCase().endsWith(ext))) continue;
        const filePath = path.join(root, entry.name);
        const stat = await fs.stat(filePath);
        candidates.push({
          fileName: entry.name,
          title: stripExtension(entry.name),
          path: filePath,
          mtimeMs: stat.mtimeMs,
          sizeBytes: stat.size
        });
      }
    } catch {
      // ignore roots that don't exist
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0];
}

export async function bestFormat(basename: string): Promise<MediaFile | null> {
  const candidates = await listMedia();
  const targetSlug = normalizeSlug(basename);
  const filtered = candidates.filter((m) => {
    const slug = normalizeSlug(m.title);
    return slug === targetSlug || slug.startsWith(targetSlug) || targetSlug.startsWith(slug);
  });
  if (filtered.length === 0) return null;
  // prefer mp4 > mkv > mov
  const preferredOrder = ["mp4", "mkv", "mov"];
  filtered.sort((a, b) => {
    const extA = a.path.split(".").pop() ?? "";
    const extB = b.path.split(".").pop() ?? "";
    return preferredOrder.indexOf(extA) - preferredOrder.indexOf(extB);
  });
  const best = filtered[0];
  const hash = await shaOrNull(best.path);
  return { ...best, sha256: hash ?? undefined };
}

async function shaOrNull(filePath: string): Promise<string | null> {
  try {
    const hash = await sha256File(filePath);
    return hash;
  } catch {
    return null;
  }
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/^the/, "")
    .replace(/[^a-z0-9]/g, "");
}

function stripExtension(value: string) {
  return value.replace(/\.[^/.]+$/, "");
}
