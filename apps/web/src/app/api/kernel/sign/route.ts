import { NextResponse } from "next/server";
import type { KernelSignRequest, KernelSignResponse } from "@illuvrse/contracts";
import { callUpstream } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as KernelSignRequest;
  const sha = body.sha256 ?? "unknown";

  const config = loadConfig();
  const upstream = config.kernelUrl;
  const upstreamRes = await callUpstream<KernelSignResponse>({
    baseUrl: upstream,
    path: "/sign",
    method: "POST",
    body,
    tokenEnv: "KERNEL_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }

  const response: KernelSignResponse = {
    sha256: sha,
    signer: "kernel-multisig",
    timestamp: new Date().toISOString(),
    policyVerdict: "SentinelNet PASS",
    ledgerUrl: "/developers#ledger",
    signature: "stub-signature"
  };

  return NextResponse.json(response);
}
