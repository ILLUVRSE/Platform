import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { type, entityId, region, language, data, requiredApprovals = 1 } = body || {};
  if (!type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 });
  }
  const proposal = await prisma.proposal.create({
    data: {
      type,
      entityId: entityId ?? null,
      region: region ?? null,
      language: language ?? null,
      data: data ?? {},
      requiredApprovals: Number(requiredApprovals) || 1,
    },
  });

  await logAudit({
    action: 'proposal.create',
    entityId: proposal.entityId,
    entityType: 'proposal',
    summary: `Proposal created: ${proposal.type}`,
    metadata: { proposalId: proposal.id, requiredApprovals: proposal.requiredApprovals },
  });

  return NextResponse.json({ proposal });
}
