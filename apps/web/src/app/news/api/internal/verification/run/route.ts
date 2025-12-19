import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { sourceId } = body || {};

  if (!sourceId) return NextResponse.json({ error: 'sourceId required' }, { status: 400 });
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 });

  const reliability = source.reliability ?? 50;
  const suggested = Math.min(100, reliability + 10);

  await prisma.source.update({
    where: { id: sourceId },
    data: { reliability: suggested },
  });

  await logAudit({
    action: 'verification.run',
    entityId: sourceId,
    entityType: 'source',
    summary: `Verification updated ${source.name} to ${suggested}`,
  });

  return NextResponse.json({ ok: true, reliability: suggested });
}
