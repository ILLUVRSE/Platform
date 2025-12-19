import { NextResponse } from 'next/server';
import { getSessionUser, clearSession } from '@/lib/server/auth';
import { readDB, removeSession } from '@/lib/server/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await readDB();
  const sessions = db.sessions.filter((s) => s.userId === user.id);
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  await removeSession(token);
  return NextResponse.json({ ok: true });
}
