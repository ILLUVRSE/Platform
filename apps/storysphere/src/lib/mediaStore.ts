import path from "path";
import fs from "fs/promises";
import { sha256File } from "./hash";

type MediaFile = { id: string; title: string; path: string; duration?: string; sha256?: string };

const mediaRoot = process.env.MEDIA_ROOT ?? path.join(process.cwd(), "apps/storysphere/data/media");

export async function listMedia(): Promise<MediaFile[]> {
  try {
    const entries = await fs.readdir(mediaRoot);
    return entries
      .filter((f) => f.endsWith(".mp4") || f.endsWith(".mkv") || f.endsWith(".mov"))
      .map((file) => ({
        id: file,
        title: file.replace(/\.[^/.]+$/, ""),
        path: path.join(mediaRoot, file)
      }));
  } catch {
    return [];
  }
}

export async function bestFormat(basename: string): Promise<MediaFile | null> {
  const candidates = await listMedia();
  const filtered = candidates.filter((m) => m.title === basename);
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
