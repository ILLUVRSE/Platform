import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/server/auth';
import { isRateLimited } from '@/lib/server/rateLimit';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`register:${ip}`, { limit: 5, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });
    }
    if (email && isRateLimited(`register-email:${email.toLowerCase()}`, { limit: 3, windowMs: 60_000 * 10 })) {
      return NextResponse.json({ error: 'Too many signups for this email. Try later.' }, { status: 429 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    const user = await registerUser(email, password);
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
  }
}
