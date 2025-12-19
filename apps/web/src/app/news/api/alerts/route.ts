import prisma from '@news/lib/prisma';
import { validateAndConsumeToken } from '@news/lib/apiTokens';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region')?.toUpperCase() || 'WORLD';
  const token = request.headers.get('x-api-token');
  const validation = await validateAndConsumeToken(token);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 429 });
  }

  // @ts-expect-error guard for migration
  if (!prisma.alert) {
    return NextResponse.json({ alerts: [] });
  }

  // @ts-expect-error guarded above
  const alerts = await prisma.alert.findMany({
    where: {
      status: 'published',
      OR: [{ region: 'WORLD' }, { region }],
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ alerts });
}
