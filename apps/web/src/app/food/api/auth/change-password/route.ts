import { NextResponse } from 'next/server';
import { changePassword, getSessionUser, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@food/lib/server/auth';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  try {
    const token = await changePassword(user.id, oldPassword, newPassword);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not change password' }, { status: 400 });
  }
}
