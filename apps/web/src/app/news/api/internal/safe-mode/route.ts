import { logAudit } from '@news/lib/audit';
import { getSetting, setSetting } from '@news/lib/settings';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const value = await getSetting('safe_mode');
  return NextResponse.json({ safeMode: value === 'on' });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { enabled } = body || {};
  await setSetting('safe_mode', enabled ? 'on' : 'off');
  await logAudit({
    action: 'safeMode.set',
    actor: 'internal-token',
    summary: `Safe mode ${enabled ? 'enabled' : 'disabled'}`,
    metadata: { enabled: Boolean(enabled) },
  });
  return NextResponse.json({ safeMode: Boolean(enabled) });
}
