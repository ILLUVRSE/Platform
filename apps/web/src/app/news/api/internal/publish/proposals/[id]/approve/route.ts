import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await _request.json().catch(() => ({}));
  const actor = body?.actor || 'system';

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  if (proposal.status === 'rejected') {
    return NextResponse.json({ error: 'Proposal rejected' }, { status: 400 });
  }

  const approvers = proposal.approvers.includes(actor)
    ? proposal.approvers
    : [...proposal.approvers, actor];
  const approved = approvers.length >= proposal.requiredApprovals;

  const updated = await prisma.proposal.update({
    where: { id },
    data: {
      approvers,
      status: approved ? 'approved' : proposal.status,
    },
  });

  await logAudit({
    action: 'proposal.approve',
    entityId: id,
    entityType: 'proposal',
    summary: `Proposal ${id} approved by ${actor}`,
    metadata: { approvers, status: updated.status },
  });

  return NextResponse.json({ proposal: updated });
}
