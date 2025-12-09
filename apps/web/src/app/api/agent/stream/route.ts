import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { statusEmitter, statusByAgent, type AgentStatus } from "../store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filterId = searchParams.get("id");

  const stream = new ReadableStream({
    start(controller) {
      const send = (status: AgentStatus) => {
        if (filterId && status.agentId !== filterId) return;
        controller.enqueue(`data: ${JSON.stringify(status)}\n\n`);
      };

      // send latest status for filtered agent
      if (filterId && statusByAgent[filterId]?.[0]) {
        send(statusByAgent[filterId][0]);
      }

      statusEmitter.on("status", send);
      controller.enqueue(": connected\n\n");

      const heartbeat = setInterval(() => controller.enqueue(": ping\n\n"), 15000);

      return () => {
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
