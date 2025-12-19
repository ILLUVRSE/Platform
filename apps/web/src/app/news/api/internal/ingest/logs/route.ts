import prisma from '@news/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs = await prisma.ingestLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: { source: true },
  });
  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      sourceName: log.source?.name ?? 'Unknown source',
      status: log.status,
      message: log.message,
      createdAt: log.createdAt,
    })),
  });
}
