import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { callUpstream } from "../../../lib/upstream";
import { loadConfig } from "../../../lib/config";

export async function GET(request: NextRequest) {
  const { kernelUrl } = loadConfig();
  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get("format");
  const query = searchParams.toString();
  const path = `/audit${query ? `?${query}` : ""}`;
  const upstreamRes = await callUpstream<{ events: any[] }>({
    baseUrl: kernelUrl,
    path,
    tokenEnv: "KERNEL_TOKEN"
  });
  if (upstreamRes.ok) {
    if (format === "csv") {
      const csv = toCsv(upstreamRes.data.events ?? []);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv" } });
    }
    return NextResponse.json(upstreamRes.data);
  }
  const fallback = {
    events: [
      { id: "evt-1", message: "Stub audit event", timestamp: Date.now(), actor: "system" },
      { id: "evt-2", message: "Checkout completed", timestamp: Date.now() - 1000, actor: "buyer1" }
    ]
  };
  if (format === "csv") {
    const csv = toCsv(fallback.events);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv" } });
  }
  return NextResponse.json(fallback);
}

function toCsv(events: any[]) {
  const header = ["id", "message", "timestamp", "actor", "action"].join(",");
  const rows = events.map((evt) =>
    [evt.id, evt.message, evt.timestamp, evt.actor ?? "", evt.action ?? ""]
      .map((value) => `"${String(value).replace(/\"/g, '\"\"')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}
