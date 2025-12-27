import { NextResponse } from 'next/server';
import { loginUser, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@food/lib/server/auth';
import { isRateLimited } from '@food/lib/server/rateLimit';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`login:${ip}`, { limit: 8, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });
    }
    if (email && isRateLimited(`login-email:${email.toLowerCase()}`, { limit: 8, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many attempts for this account. Try again later.' }, { status: 429 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    const { user, token } = await loginUser(email, password);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 401 });
  }
}
