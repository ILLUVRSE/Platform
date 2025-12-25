import type { AceAgentManifest } from "@illuvrse/contracts";
import { NextResponse } from "next/server";
import { listRegistryEntries, setHandoffManifest, upsertRegistryManifest } from "@/lib/aceRegistry";

export async function GET() {
  const entries = listRegistryEntries();
  return NextResponse.json({ entries, total: entries.length });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      manifest?: AceAgentManifest;
      source?: string;
      setHandoff?: boolean;
    };
    if (!body.manifest) {
      return NextResponse.json({ error: "manifest required" }, { status: 400 });
    }
    const entry = upsertRegistryManifest(body.manifest, body.source);
    const handoff = body.setHandoff ? setHandoffManifest(body.manifest, body.source) : undefined;
    return NextResponse.json({ ok: true, entry, handoff });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
