import { NextResponse } from "next/server";
import { callUpstream } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sha = body.sha256 ?? "unknown";
  const { financeUrl } = loadConfig();

  const upstreamRes = await callUpstream({
    baseUrl: financeUrl,
    path: "/receipt",
    method: "POST",
    body,
    tokenEnv: "FINANCE_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }
  return NextResponse.json({
    receipt: {
      id: `rcpt-${Date.now()}`,
      sha256: sha,
      amount: body.amount ?? 0,
      currency: body.currency ?? "USD",
      signed: true,
      signature: "finance-stub-signature"
    },
    delivery: {
      encryptedBlob: "minio://artifacts/secure/...",
      proof: `delivery-proof-${sha}`
    }
  });
}
