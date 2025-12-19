import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { isSafeMode } from '@news/lib/settings';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (await isSafeMode()) return NextResponse.json({ error: 'Safe mode enabled' }, { status: 503 });

  const now = new Date();
  const due = await prisma.article.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: now },
    },
    select: { id: true, title: true, region: true, locale: true },
  });

  for (const article of due) {
    await prisma.article.update({
      where: { id: article.id },
      data: {
        published: true,
        status: 'published',
        publishedAt: now,
      },
    });
    await logAudit({
      action: 'publish.scheduled',
      entityId: article.id,
      entityType: 'article',
      summary: `Scheduled publish executed for ${article.title}`,
      metadata: { region: article.region, language: article.locale },
    });
  }

  return NextResponse.json({ ok: true, count: due.length });
}
