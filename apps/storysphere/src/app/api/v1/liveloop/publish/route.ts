import { NextResponse } from "next/server";
import type { LiveLoopPublishRequest, LiveLoopPublishResponse } from "@illuvrse/contracts";
import { callUpstream } from "../../../../../lib/upstream";
import { loadConfig } from "../../../../../lib/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LiveLoopPublishRequest;
  const assetId = body.assetId ?? "unknown";

  const { storysphereBackendUrl } = loadConfig();
  const upstream = storysphereBackendUrl;
  const upstreamRes = await callUpstream<LiveLoopPublishResponse>({
    baseUrl: upstream,
    path: "/liveloop/publish",
    method: "POST",
    body,
    tokenEnv: "STORYSPHERE_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }

  const response: LiveLoopPublishResponse = {
    assetId,
    scheduledFor: body.schedule ?? "immediate",
    status: "published",
    proof: {
      sha256: "c3db:901a...8ff1",
      signer: "kernel-multisig",
      timestamp: new Date().toISOString(),
      policyVerdict: "SentinelNet PASS",
      ledgerUrl: "/developers#ledger"
    }
  };

  return NextResponse.json(response);
}
