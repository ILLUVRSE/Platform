import { NextResponse } from "next/server";
import { callUpstream } from "../../../lib/upstream";
import { loadConfig } from "../../../lib/config";

export async function GET() {
  const { kernelUrl } = loadConfig();
  const upstreamRes = await callUpstream<{ events: any[] }>({
    baseUrl: kernelUrl,
    path: "/audit",
    tokenEnv: "KERNEL_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }
  return NextResponse.json({
    events: [
      { id: "evt-1", message: "Stub audit event", timestamp: Date.now(), actor: "system" },
      { id: "evt-2", message: "Checkout completed", timestamp: Date.now() - 1000, actor: "buyer1" }
    ]
  });
}
