import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await _request.json().catch(() => ({}));
  const actor = body?.actor || 'system';
  const reason = body?.reason || 'No reason provided';

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: {
      status: 'rejected',
      reason,
    },
  });

  await logAudit({
    action: 'proposal.reject',
    entityId: id,
    entityType: 'proposal',
    summary: `Proposal ${id} rejected by ${actor}`,
    metadata: { reason },
  });

  return NextResponse.json({ proposal: updated });
}
