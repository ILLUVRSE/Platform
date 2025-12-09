import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { statusByAgent } from "../store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json({ statuses: statusByAgent[id] ?? [] });
}
