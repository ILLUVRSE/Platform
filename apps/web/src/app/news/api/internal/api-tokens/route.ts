import prisma from '@news/lib/prisma';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  // @ts-expect-error guard for migration
  if (!prisma.apiToken) return NextResponse.json({ tokens: [] });
  // @ts-expect-error guarded above
  const tokens = await prisma.apiToken.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ tokens });
}

export async function POST(request: Request) {
  // @ts-expect-error guard for migration
  if (!prisma.apiToken) return NextResponse.json({ error: 'Model unavailable. Run migrations.' }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const { label, rateLimit = 1000 } = body || {};
  const token = randomUUID().replace(/-/g, '');
  // @ts-expect-error guarded above
  const created = await prisma.apiToken.create({
    data: {
      token,
      label: label ?? 'API Token',
      rateLimit: Number(rateLimit) || 1000,
    },
  });
  return NextResponse.json({ token: created });
}
