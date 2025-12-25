import type { AceAgentManifest } from "@illuvrse/contracts";
import { NextResponse } from "next/server";
import { readHandoff, setHandoffFromRegistry, setHandoffManifest } from "@/lib/aceRegistry";

export async function GET() {
  const handoff = readHandoff();
  return NextResponse.json({ handoff });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      manifest?: AceAgentManifest;
      source?: string;
    };
    if (body.manifest) {
      const handoff = setHandoffManifest(body.manifest, body.source);
      return NextResponse.json({ ok: true, handoff });
    }
    if (body.id) {
      const handoff = setHandoffFromRegistry(body.id, body.source);
      if (!handoff) {
        return NextResponse.json({ error: "manifest not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, handoff });
    }
    return NextResponse.json({ error: "id or manifest required" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
