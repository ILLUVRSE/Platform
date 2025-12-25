import { NextResponse } from 'next/server';
import { deleteAccount, getSessionUser } from '@food/lib/server/auth';

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await deleteAccount(user.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not delete account' }, { status: 400 });
  }
}
