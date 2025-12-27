import { NextResponse } from "next/server";
import { prisma } from "@illuvrse/db";

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? undefined;
  const parentId = searchParams.get("parentId") ?? undefined;

  const tasks = await prisma.agentTask.findMany({
    where: {
      ...(agentId ? { agentId } : {}),
      ...(parentId ? { parentId } : {})
    },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const agentId = typeof body.agentId === "string" ? body.agentId : "";
  const title = typeof body.title === "string" ? body.title : "";
  const parentId = typeof body.parentId === "string" ? body.parentId : undefined;
  const children = Array.isArray(body.children) ? body.children : [];
  const allowedStatuses = new Set(["pending", "in_progress", "completed", "failed"]);
  const status = typeof body.status === "string" && allowedStatuses.has(body.status) ? body.status : "pending";

  if (!agentId || !title) {
    return NextResponse.json({ error: "agentId and title required" }, { status: 400 });
  }

  const task = await prisma.agentTask.create({
    data: {
      agentId,
      title,
      parentId: parentId || null,
      payload: body.payload ?? undefined,
      status
    }
  });

  let childTasks: unknown[] = [];
  if (children.length) {
    childTasks = await Promise.all(
      children.map((child) => {
        const childObj = child as Record<string, unknown>;
        const childTitle = typeof childObj.title === "string" ? childObj.title : "Subtask";
        const childAgentId = typeof childObj.agentId === "string" ? childObj.agentId : agentId;
        const childStatus =
          typeof childObj.status === "string" && allowedStatuses.has(childObj.status) ? childObj.status : "pending";
        return prisma.agentTask.create({
          data: {
            agentId: childAgentId,
            title: childTitle,
            parentId: task.id,
            payload: childObj.payload ?? undefined,
            status: childStatus
          }
        });
      })
    );
  }

  return NextResponse.json({ task, children: childTasks });
}
