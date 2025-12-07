import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    policyVersion: "v0.9.2",
    verdict: "PASS",
    canary: body.risk === "high" ? "route-to-canary" : "skip",
    reason: "Stub policy evaluation",
    inputs: body
  });
}
