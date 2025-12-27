import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearSession, deleteAccount, getSessionUser, SESSION_COOKIE } from '@food/lib/server/auth';

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    await deleteAccount(user.id);
    if (token) {
      await clearSession(token);
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not delete account' }, { status: 400 });
  }
}
