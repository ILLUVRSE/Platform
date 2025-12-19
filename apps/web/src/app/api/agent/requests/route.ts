import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createApprovalRequest, listApprovalRequests } from "../approval-repo";

export async function GET() {
  const data = await listApprovalRequests();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      agentId?: string;
      action?: string;
      payload?: Record<string, unknown>;
      manifest?: Record<string, unknown>;
      requestedBy?: string;
    };
    if (!body.agentId || !body.action) {
      return NextResponse.json({ error: "agentId and action required" }, { status: 400 });
    }
    const requestedBy = (body.requestedBy ?? "").trim() || "unknown";
    const request = await createApprovalRequest({
      agentId: body.agentId,
      action: body.action,
      payload: body.payload ?? {},
      manifest: body.manifest,
      requestedBy
    });
    return NextResponse.json({ ok: true, request });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
