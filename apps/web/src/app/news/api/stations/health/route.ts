import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const stationId = body?.stationId as string | undefined;
    if (!stationId) {
      return NextResponse.json({ error: "stationId required" }, { status: 400 });
    }

    const station = await prisma.station.findUnique({ where: { id: stationId } });
    if (!station) {
      return NextResponse.json({ error: "station not found" }, { status: 404 });
    }

    let status: string = "unknown";
    let failureCount = station.failureCount ?? 0;
    const lastCheckedAt = new Date();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(station.streamUrl, {
        method: "HEAD",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      status = res.ok ? "online" : "offline";
      if (!res.ok) failureCount += 1;
    } catch {
      status = "offline";
      failureCount += 1;
    }

    const updated = await prisma.station.update({
      where: { id: stationId },
      data: { status, lastCheckedAt, failureCount },
      select: {
        id: true,
        status: true,
        lastCheckedAt: true,
        failureCount: true,
      },
    });

    return NextResponse.json({ station: updated });
  } catch {
    return NextResponse.json({ error: "health check failed" }, { status: 500 });
  }
}
