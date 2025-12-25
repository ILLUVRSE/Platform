import { NextResponse } from 'next/server';
import { clearSession } from '@food/lib/server/auth';

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
