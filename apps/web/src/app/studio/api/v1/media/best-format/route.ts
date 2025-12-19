import { NextResponse } from "next/server";
import { bestFormat } from "@studio/lib/mediaStore";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const basename = body.basename ?? "";
  if (!basename) return NextResponse.json({ error: "basename required" }, { status: 400 });
  const media = await bestFormat(basename);
  if (!media) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ media });
}
