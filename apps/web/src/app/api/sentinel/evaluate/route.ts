import { NextResponse } from "next/server";
import { validateAceAgentManifest } from "@illuvrse/contracts";
import { emitAudit } from "../../../../lib/audit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const manifest = body?.manifest ?? body;

  try {
    validateAceAgentManifest(manifest);
  } catch (err) {
    emitAudit({
      type: "manifest.policy.reject",
      message: "Manifest failed validation before policy evaluation",
      data: { error: (err as Error).message }
    });
    return NextResponse.json({ verdict: "REJECT", reason: (err as Error).message }, { status: 400 });
  }

  const verdict = {
    policyVersion: "v0.9.2",
    verdict: "ALLOW",
    severity: body.risk === "high" ? "medium" : "low",
    rules: [
      {
        id: "ace.manifest.required",
        result: "pass",
        message: "Required fields present",
      },
      {
        id: "ace.permissions.bounds",
        result: "pass",
        message: "Permissions within allowed bounds for stub",
      },
    ],
    canary: body.risk === "high" ? "route-to-canary" : "skip",
    reason: "Stub policy evaluation",
    inputs: body
  };

  emitAudit({
    type: "manifest.policy.allow",
    message: "Manifest passed SentinelNet stub evaluation",
    data: { manifestId: manifest?.id, severity: verdict.severity }
  });

  return NextResponse.json(verdict);
}
