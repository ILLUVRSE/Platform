import { NextResponse } from "next/server";
import { gameGridManifest } from "@studio/lib/gameGridManifest";

export async function GET() {
  return NextResponse.json({ games: gameGridManifest });
}
