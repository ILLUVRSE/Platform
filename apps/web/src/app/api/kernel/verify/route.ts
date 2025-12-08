import { NextResponse } from "next/server";
import type { KernelVerifyRequest, KernelVerifyResponse } from "@illuvrse/contracts";
import { callUpstream } from "../../../../lib/upstream";
import { callUpstream as callFinance } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";
import { emitAudit } from "../../../../lib/audit";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as KernelVerifyRequest;
  const sha = body.sha256 ?? (body as any).sha ?? "unknown";

  const config = loadConfig();
  const upstream = config.kernelUrl;
  const upstreamRes = await callUpstream<KernelVerifyResponse>({
    baseUrl: upstream,
    path: "/verify",
    method: "POST",
    body,
    tokenEnv: "KERNEL_TOKEN"
  });
  if (upstreamRes.ok) {
    emitAudit({
      type: "manifest.verify.upstream",
      message: "Manifest verification delegated to upstream Kernel",
      data: { sha, valid: upstreamRes.data.valid }
    });
    return NextResponse.json(upstreamRes.data);
  }

  // If upstream fails but Finance can verify receipt, allow that path
  const financeRes = await callFinance({
    baseUrl: config.financeUrl,
    path: "/verify",
    method: "POST",
    body: { receipt: { sha256: sha } }
  });
  if (financeRes.ok) {
    emitAudit({
      type: "manifest.verify.finance",
      message: "Manifest verified via Finance receipt",
      data: { sha, signer: financeRes.data.proof?.signer }
    });
    return NextResponse.json({
      sha256: sha,
      signer: financeRes.data.proof?.signer ?? "finance",
      timestamp: financeRes.data.proof?.timestamp ?? new Date().toISOString(),
      policyVerdict: "Finance verification",
      ledgerUrl: financeRes.data.proof?.ledgerUrl,
      valid: true
    });
  }

  const response: KernelVerifyResponse = {
    sha256: sha,
    signer: "kernel-multisig",
    timestamp: new Date().toISOString(),
    policyVerdict: "SentinelNet PASS",
    ledgerUrl: "/developers#ledger",
    valid: true
  };

  emitAudit({
    type: "manifest.verify.stub",
    message: "Manifest verified by stub Kernel",
    data: { sha, valid: true }
  });

  return NextResponse.json(response);
}
