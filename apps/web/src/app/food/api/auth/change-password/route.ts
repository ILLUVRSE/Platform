import { NextResponse } from 'next/server';
import { changePassword, getSessionUser } from '@food/lib/server/auth';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  try {
    await changePassword(user.id, oldPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not change password' }, { status: 400 });
  }
}
