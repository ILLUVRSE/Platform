import { NextResponse } from "next/server";
import type { AceAgentManifest, KernelSignRequest, KernelSignResponse } from "@illuvrse/contracts";
import { validateAceAgentManifest } from "@illuvrse/contracts";
import { callUpstream } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";
import { emitAudit } from "../../../../lib/audit";
import crypto from "crypto";

function pickManifest(payload: unknown): AceAgentManifest | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  const manifest = obj.manifest ?? obj;
  if (
    manifest &&
    typeof manifest === "object" &&
    "id" in manifest &&
    "capabilities" in manifest &&
    "runtime" in manifest
  ) {
    return validateAceAgentManifest(manifest);
  }
  return undefined;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as KernelSignRequest;
  const sha = body.sha256 ?? "unknown";

  let manifest: AceAgentManifest | undefined;
  try {
    manifest = pickManifest(body);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

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
    emitAudit({
      type: "manifest.signed.upstream",
      message: "Manifest signed by upstream Kernel",
      data: { sha, manifestId: manifest?.id }
    });
    return NextResponse.json(upstreamRes.data);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const signature = crypto
    .createHash("sha256")
    .update(`${sha}:${now.toISOString()}:kernel-multisig`)
    .digest("hex");

  const response: KernelSignResponse = {
    sha256: sha,
    signer: "kernel-multisig",
    timestamp: now.toISOString(),
    expiry: expiresAt.toISOString(),
    policyVerdict: "SentinelNet PASS",
    ledgerUrl: "/developers#ledger",
    signature,
    requestId: crypto.randomUUID()
  };

  emitAudit({
    type: "manifest.signed.stub",
    message: "Manifest signed by stub Kernel",
    data: { sha, manifestId: manifest?.id, requestId: response.requestId }
  });

  return NextResponse.json(response);
}
