import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { message, region = 'WORLD', language = 'en', severity = 'info', requiredApprovals = 2 } = body || {};
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

  // @ts-expect-error guard for migration
  if (!prisma.proposal) return NextResponse.json({ error: 'Proposal model unavailable. Run migrations.' }, { status: 500 });

  // @ts-expect-error guarded above
  const proposal = await prisma.proposal.create({
    data: {
      type: 'alert.publish',
      region,
      language,
      severity,
      data: { message, region, language, severity },
      requiredApprovals: severity === 'critical' ? Math.max(2, Number(requiredApprovals) || 2) : Number(requiredApprovals) || 1,
    },
  });

  await logAudit({
    action: 'alert.proposal.create',
    entityId: proposal.id,
    entityType: 'proposal',
    summary: `Alert proposal created (${severity})`,
    metadata: { region, language },
  });

  return NextResponse.json({ proposal });
}

export async function GET() {
  // @ts-expect-error guard for migration
  if (!prisma.proposal) return NextResponse.json({ proposals: [] });
  // @ts-expect-error guarded above
  const proposals = await prisma.proposal.findMany({ where: { type: 'alert.publish' }, orderBy: { createdAt: 'desc' }, take: 20 });
  return NextResponse.json({ proposals });
}
