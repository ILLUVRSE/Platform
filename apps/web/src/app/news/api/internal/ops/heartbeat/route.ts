import prisma from '@news/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  let db = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = false;
  }
  return NextResponse.json({
    ok: db,
    db,
    workers: true, // placeholder since workers not tracked here
    timestamp: new Date().toISOString(),
  });
}
