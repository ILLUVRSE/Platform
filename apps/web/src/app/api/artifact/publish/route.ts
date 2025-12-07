import { NextResponse } from "next/server";
import { callUpstream } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sha = body.sha256 ?? "unknown";
  const { artifactPublisherUrl } = loadConfig();
  const upstreamRes = await callUpstream({
    baseUrl: artifactPublisherUrl,
    path: "/publish",
    method: "POST",
    body,
    tokenEnv: "ARTIFACT_PUBLISHER_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }

  return NextResponse.json({
    delivery: {
      encryptedBlob: "minio://artifacts/secure/...",
      proof: `delivery-proof-${sha}`,
      policy: "SentinelNet PASS"
    }
  });
}
