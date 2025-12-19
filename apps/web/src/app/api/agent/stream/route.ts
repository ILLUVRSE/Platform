import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { statusEmitter, statusByAgent, type AgentStatus } from "../store";
import { refreshAgentManagerJobs } from "../agent-manager";
import { env } from "process";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filterId = searchParams.get("id");

  const backend = env.AGENT_BACKEND_URL;
  if (backend) {
    try {
      const upstream = await fetch(`${backend.replace(/\/$/, "")}/stream${filterId ? `?id=${encodeURIComponent(filterId)}` : ""}`, {
        headers: { Accept: "text/event-stream" },
        cache: "no-store"
      });
      if (upstream.ok && upstream.body) {
        return new NextResponse(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
          }
        });
      }
    } catch {
      // fall back to stub stream
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (status: AgentStatus) => {
        if (closed) return;
        if (filterId && status.agentId !== filterId) return;
        const payload = {
          ...status,
          action: status.action,
          timestamp: status.timestamp
        };
        try {
          controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
        } catch {
          closed = true;
        }
      };

      // send latest status for filtered agent
      if (filterId && statusByAgent[filterId]?.[0]) {
        send(statusByAgent[filterId][0]);
      }

      statusEmitter.on("status", send);
      controller.enqueue(": connected\n\n");

      const baseUrl = backend ? backend.replace(/\/$/, "") : "";
      const poller = baseUrl
        ? setInterval(() => {
            refreshAgentManagerJobs(baseUrl, filterId).catch(() => undefined);
          }, 1000)
        : null;
      if (baseUrl) {
        refreshAgentManagerJobs(baseUrl, filterId).catch(() => undefined);
      }

      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(": ping\n\n");
        } catch {
          closed = true;
        }
      }, 15000);

      return () => {
        closed = true;
        if (poller) clearInterval(poller);
        clearInterval(heartbeat);
        statusEmitter.off("status", send);
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
