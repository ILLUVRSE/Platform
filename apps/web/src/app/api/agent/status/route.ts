import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { statusByAgent } from "../store";
import { refreshAgentManagerJobs } from "../agent-manager";
import { env } from "process";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const backend = env.AGENT_BACKEND_URL ?? "http://localhost:4040";
  const token = env.AGENT_BACKEND_TOKEN;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  if (backend) {
    try {
      const res = await fetch(`${backend.replace(/\/$/, "")}/status?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
        headers: authHeaders
      });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      // fall back to stub status
    }
    try {
      await refreshAgentManagerJobs(backend.replace(/\/$/, ""), id);
    } catch {
      // ignore refresh errors
    }
  }
  return NextResponse.json({ statuses: statusByAgent[id] ?? [] });
}
