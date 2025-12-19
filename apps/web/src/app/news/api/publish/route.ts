import prisma from '@news/lib/prisma';
import { NextResponse } from 'next/server';

// Simple auto-publish endpoint to be called manually or via cron (e.g., GitHub Actions/cURL)
export async function POST() {
  const now = new Date();
  const readyToPublish = await prisma.article.findMany({
    where: {
      status: 'scheduled',
      published: false,
      scheduledFor: { lte: now },
    },
    select: { id: true },
  });

  if (readyToPublish.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  await prisma.article.updateMany({
    where: { id: { in: readyToPublish.map((a) => a.id) } },
    data: {
      status: 'published',
      published: true,
      publishedAt: now,
    },
  });

  return NextResponse.json({ published: readyToPublish.length });
}
