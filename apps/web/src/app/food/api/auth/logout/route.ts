import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearSession, SESSION_COOKIE } from '@food/lib/server/auth';

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await clearSession(token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
