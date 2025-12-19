import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { isSafeMode } from '@news/lib/settings';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { proposalId } = body || {};
  if (!proposalId) return NextResponse.json({ error: 'proposalId required' }, { status: 400 });

  if (await isSafeMode()) return NextResponse.json({ error: 'Safe mode enabled' }, { status: 503 });

  // @ts-expect-error guard for migration
  if (!prisma.proposal || !prisma.alert) {
    return NextResponse.json({ error: 'Models unavailable. Run migrations.' }, { status: 500 });
  }

  // @ts-expect-error guarded above
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  if (proposal.status !== 'approved') return NextResponse.json({ error: 'Proposal not approved' }, { status: 400 });

  const proposalData = (proposal.data || {}) as { message?: string; severity?: string };
  const message = proposalData.message || 'Alert';
  const severity = proposal.severity || proposalData.severity || 'info';
  const region = proposal.region || 'WORLD';
  const language = proposal.language || 'en';

  // @ts-expect-error guarded above
  const alert = await prisma.alert.create({
    data: {
      message,
      severity,
      region,
      language,
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await logAudit({
    action: 'alert.publish',
    entityId: alert.id,
    entityType: 'alert',
    summary: `Alert published (${severity}) via proposal ${proposal.id}`,
    metadata: { region, language },
  });

  return NextResponse.json({ ok: true, alert });
}
