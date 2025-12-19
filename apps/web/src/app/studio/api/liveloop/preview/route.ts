import { NextResponse } from "next/server";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const mediaRoots = [
  process.env.MEDIA_ROOT ?? path.join(process.cwd(), "public"),
  path.join(process.cwd(), "src/app/studio/library")
];

const allowedExt = [".mp4", ".mov", ".mkv", ".avi", ".mpeg"];
const browserPreferred = [".mp4", ".mov"]; // browsers most likely to play inline

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("file");

  const candidates = getCandidates();
  if (candidates.length === 0) {
    return new Response("No media found", { status: 404 });
  }

  const chosen = pickFile(candidates, requested);
  try {
    const stat = fs.statSync(chosen);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    if (range) {
      const { start, end } = parseRange(range, fileSize);
      const chunkSize = end - start + 1;
      const nodeStream = fs.createReadStream(chosen, { start, end });
      const webStream = toWebStream(nodeStream);
      return new NextResponse(webStream, {
        status: 206,
        headers: buildHeaders(chosen, chunkSize, fileSize, { start, end, partial: true })
      });
    }

    const nodeStream = fs.createReadStream(chosen);
    const webStream = toWebStream(nodeStream);
    return new NextResponse(webStream, {
      status: 200,
      headers: buildHeaders(chosen, fileSize, fileSize, { partial: false })
    });
  } catch (err) {
    return new Response(`Failed to stream: ${(err as Error).message}`, { status: 500 });
  }
}

function getCandidates() {
  const results: string[] = [];
  for (const root of mediaRoots) {
    try {
      const entries = fs.readdirSync(root);
      const files = entries
        .filter((f) => allowedExt.some((ext) => f.toLowerCase().endsWith(ext)))
        .map((file) => path.join(root, file))
        .sort(sortByPreferred);
      results.push(...files);
    } catch {
      // ignore missing roots
    }
  }
  return results;
}

function sortByPreferred(a: string, b: string) {
  const preferredOrder = [".mp4", ".mkv", ".mov", ".avi", ".mpeg"];
  const extA = path.extname(a).toLowerCase();
  const extB = path.extname(b).toLowerCase();
  return preferredOrder.indexOf(extA) - preferredOrder.indexOf(extB);
}

function pickFile(candidates: string[], requested?: string | null) {
  if (requested) {
    const safeName = path.basename(requested);
    const found = candidates.find((f) => path.basename(f) === safeName);
    if (found) {
      if (!browserPreferred.includes(path.extname(found).toLowerCase())) {
        // fallback to a browser-friendly file if the requested one is likely unsupported
        const fallback = candidates.find((f) => browserPreferred.includes(path.extname(f).toLowerCase()));
        if (fallback) return fallback;
      }
      return found;
    }
  }
  // default to first browser-friendly file, else first candidate
  return candidates.find((f) => browserPreferred.includes(path.extname(f).toLowerCase())) ?? candidates[0];
}

function parseRange(range: string, fileSize: number) {
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match && match[1] ? parseInt(match[1], 10) : 0;
  let end = match && match[2] ? parseInt(match[2], 10) : fileSize - 1;
  if (isNaN(end) || end >= fileSize) end = fileSize - 1;
  return { start, end };
}

function buildHeaders(
  filePath: string,
  contentLength: number,
  fileSize: number,
  opts: { start?: number; end?: number; partial: boolean }
) {
  const headers = new Headers();
  headers.set("Content-Length", contentLength.toString());
  headers.set("Content-Type", contentType(filePath));
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Disposition", "inline");
  if (opts.partial) {
    headers.set("Content-Range", `bytes ${opts.start ?? 0}-${opts.end ?? fileSize - 1}/${fileSize}`);
  }
  return headers;
}

function toWebStream(nodeStream: fs.ReadStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => {
        const bytes =
          chunk instanceof Uint8Array
            ? chunk
            : typeof chunk === "string"
              ? Buffer.from(chunk)
              : new Uint8Array(chunk);
        controller.enqueue(bytes);
      });
      nodeStream.once("end", () => controller.close());
      nodeStream.once("close", () => controller.close());
      nodeStream.once("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    }
  });
}

function contentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".mkv":
      return "video/x-matroska";
    case ".mov":
      return "video/quicktime";
    case ".avi":
      return "video/x-msvideo";
    case ".mpeg":
      return "video/mpeg";
    default:
      return "application/octet-stream";
  }
}
