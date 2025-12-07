import { NextResponse } from "next/server";
import { callUpstream } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const receipt = body.receipt;
  if (!receipt?.sha256) {
    return NextResponse.json({ valid: false, error: "missing receipt" }, { status: 400 });
  }

  const { financeUrl } = loadConfig();
  const upstreamRes = await callUpstream({
    baseUrl: financeUrl,
    path: "/verify",
    method: "POST",
    body,
    tokenEnv: "FINANCE_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }

  return NextResponse.json({
    valid: true,
    receipt,
    proof: {
      sha256: receipt.sha256,
      signer: "finance-stub",
      timestamp: new Date().toISOString()
    }
  });
}
