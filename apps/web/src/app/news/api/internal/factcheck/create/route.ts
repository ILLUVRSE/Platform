import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { articleId, notes } = body || {};
  if (!articleId) return NextResponse.json({ error: 'articleId required' }, { status: 400 });

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

  const task = await prisma.factCheckTask.create({
    data: {
      articleId,
      status: 'pending',
      notes: notes ?? 'Auto-created fact-check task',
    },
  });

  await logAudit({
    action: 'factcheck.create',
    entityId: articleId,
    entityType: 'article',
    summary: `Fact-check task created for ${article.title}`,
  });

  return NextResponse.json({ task });
}
