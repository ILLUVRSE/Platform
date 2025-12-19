import { NextResponse } from 'next/server';
import prisma from '@news/lib/prisma';

export async function GET() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(assets);
}
