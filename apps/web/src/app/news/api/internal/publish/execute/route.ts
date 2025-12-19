import { executeProposal } from '@news/lib/publish';
import { isSafeMode } from '@news/lib/settings';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { proposalId } = body || {};
  if (!proposalId) return NextResponse.json({ error: 'proposalId required' }, { status: 400 });

  if (await isSafeMode()) return NextResponse.json({ error: 'Safe mode enabled' }, { status: 503 });

  const result = await executeProposal(proposalId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
