import { latestAudit } from '@news/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await latestAudit(30);
  return NextResponse.json({ entries });
}
