import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { approvalRequired, isValidApprover } from "../approval";
import { createApprovalRequest } from "../approval-repo";
import { queue, statusByAgent } from "../store";
import { executeAgentAction, type AgentExecRequest } from "./execute";
import type { AceAgentManifest } from "@illuvrse/contracts";
import { validateAceAgentManifest } from "@illuvrse/contracts";

function matchesAction(pattern: string, action: string) {
  if (pattern === action) return true;
  if (pattern.endsWith(".*")) {
    return action.startsWith(pattern.slice(0, -1));
  }
  return false;
}

function isActionAllowed(action: string, manifest?: AceAgentManifest) {
  if (!manifest?.tools?.length) return true;
  return manifest.tools.some((tool) => tool.actions?.some((pattern) => matchesAction(pattern, action)));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AgentExecRequest;
    if (!body.agentId || !body.action) {
      return NextResponse.json({ error: "agentId and action required" }, { status: 400 });
    }

    let validatedManifest: AceAgentManifest | undefined;
    if (body.manifest) {
      try {
        validatedManifest = validateAceAgentManifest(body.manifest);
      } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
      }
      if (!isActionAllowed(body.action, validatedManifest)) {
        return NextResponse.json({ error: "action not permitted by agent tools" }, { status: 400 });
      }
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
