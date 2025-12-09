import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { queue, pushStatus, type AgentStatus } from "../store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { agentId: string; action: string; payload?: Record<string, unknown> };
    if (!body.agentId || !body.action) {
      return NextResponse.json({ error: "agentId and action required" }, { status: 400 });
    }
    queue.push(body);
    const entry: AgentStatus = {
      id: `${body.agentId}-${Date.now()}`,
      action: body.action,
      status: "queued",
      agentId: body.agentId,
      timestamp: Date.now(),
      message: "Queued in demo executor"
    };
    pushStatus(body.agentId, entry);
    // Simulate async completion
    setTimeout(() => {
      const running: AgentStatus = {
        ...entry,
        status: "running",
        agentId: body.agentId,
        timestamp: Date.now(),
        message: "Processing…"
      };
      pushStatus(body.agentId, running);
    }, 300);
    setTimeout(() => {
      const done: AgentStatus = {
        ...entry,
        status: "completed",
        agentId: body.agentId,
        timestamp: Date.now(),
        message: "Completed in demo executor",
        proofSha: `demo-sha-${body.agentId.slice(0, 4)}`,
        policyVerdict: "PASS"
      };
      pushStatus(body.agentId, done);
    }, 900);
    return NextResponse.json({ ok: true, enqueued: entry });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Basic GET to inspect queue (optional)
export async function GET() {
  return NextResponse.json({ queue, statusByAgent });
}
