import { NextResponse } from "next/server";
import { gameGridManifest } from "../../../../lib/gameGridManifest";

export async function GET() {
  return NextResponse.json({ games: gameGridManifest });
}
