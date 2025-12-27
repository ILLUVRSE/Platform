import { NextResponse } from "next/server";
import { latestMedia } from "@studio/lib/mediaStore";

export async function GET() {
  const media = await latestMedia();
  if (!media) return NextResponse.json({ media: null });

  return NextResponse.json({
    media: {
      fileName: media.fileName,
      title: media.title,
      sizeBytes: media.sizeBytes,
      mtimeMs: media.mtimeMs,
      previewUrl: `/studio/api/liveloop/preview?file=${encodeURIComponent(media.fileName)}`
    }
  });
}
