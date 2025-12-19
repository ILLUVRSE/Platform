import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { approvalRequired, isValidApprover } from "../approval";
import { getApprovalRequest, updateApproval } from "../approval-repo";
import { executeAgentAction } from "../exec/execute";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id?: string;
      decision?: "approve" | "reject";
      approvedBy?: string;
      reason?: string;
    };
    if (!body.id || !body.decision) {
      return NextResponse.json({ error: "id and decision required" }, { status: 400 });
    }
    if (body.decision !== "approve" && body.decision !== "reject") {
      return NextResponse.json({ error: "decision must be approve or reject" }, { status: 400 });
    }
    const request = await getApprovalRequest(body.id);
    if (!request) {
      return NextResponse.json({ error: "approval request not found" }, { status: 404 });
    }
    if (request.status !== "pending") {
      return NextResponse.json({ error: "approval request already resolved" }, { status: 409 });
    }

    const approvedBy = (body.approvedBy ?? "").trim();
    if (approvalRequired() && !isValidApprover(approvedBy)) {
      return NextResponse.json({ error: "invalid approver" }, { status: 403 });
    }

    if (body.decision === "reject") {
      const updated = await updateApproval(request.id, {
        status: "rejected",
        approvedBy,
        decidedAt: Date.now(),
        reason: body.reason
      });
      return NextResponse.json({ ok: true, request: updated });
    }

    await updateApproval(request.id, {
      status: "approved",
      approvedBy,
      decidedAt: Date.now(),
      reason: body.reason
    });
    const result = await executeAgentAction({
      agentId: request.agentId,
      action: request.action,
      payload: request.payload,
      manifest: request.manifest,
      approvedBy
    });
    const updated = await updateApproval(request.id, {
      status: result.ok ? "executed" : "failed",
      execution: {
        ok: result.ok,
        status: result.status,
        error: typeof result.body?.error === "string" ? (result.body.error as string) : undefined,
        jobId: typeof result.body?.jobId === "string" ? (result.body.jobId as string) : undefined
      }
    });
    return NextResponse.json({ ok: result.ok, request: updated, result: result.body }, { status: result.status });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
