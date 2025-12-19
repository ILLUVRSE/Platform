import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { approvalRequired, isValidApprover } from "../approval";
import { createApprovalRequest } from "../approval-repo";
import { queue, statusByAgent } from "../store";
import { executeAgentAction, type AgentExecRequest } from "./execute";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AgentExecRequest;
    if (!body.agentId || !body.action) {
      return NextResponse.json({ error: "agentId and action required" }, { status: 400 });
    }

    const approvedBy = typeof body.approvedBy === "string" ? body.approvedBy.trim() : "";
    const requestedBy = (typeof body.requestedBy === "string" ? body.requestedBy.trim() : "") || approvedBy || "unknown";
    if (approvalRequired() && !isValidApprover(approvedBy)) {
      const request = await createApprovalRequest({
        agentId: body.agentId,
        action: body.action,
        payload: body.payload ?? {},
        manifest: body.manifest,
        requestedBy
      });
      return NextResponse.json(
        {
          ok: true,
          status: "pending",
          requestId: request.id,
          message: "Approval required. Request queued for operator review."
        },
        { status: 202 }
      );
    }

    const result = await executeAgentAction(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Basic GET to inspect queue (optional)
export async function GET() {
  return NextResponse.json({ queue, statusByAgent });
}
