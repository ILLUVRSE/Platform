import prisma from '@news/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // @ts-expect-error guard for migration
  if (!prisma.translationTask) return NextResponse.json({ tasks: [] });
  // @ts-expect-error guarded above
  const tasks = await prisma.translationTask.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ tasks });
}
