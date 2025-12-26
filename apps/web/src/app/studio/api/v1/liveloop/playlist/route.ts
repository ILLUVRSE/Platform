import { NextResponse } from "next/server";
import { playlist as defaultPlaylist } from "@studio/lib/liveloopData";
import { store } from "@studio/lib/store";

export async function GET() {
  const playlist = await store.getPlaylist();
  return NextResponse.json({ playlist });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const title = body.title ?? "untitled";
  const newItem = {
    id: `item-${Date.now()}`,
    title,
    duration: body.duration ?? "00:10",
    status: "Queued" as const,
    proofSha: body.proofSha ?? body.sha ?? "pending",
    policyVerdict: body.policyVerdict ?? "SentinelNet PASS"
  };

  const updated = await store.addPlaylistItem(newItem);

  return NextResponse.json({ added: newItem, playlist: updated });
}
