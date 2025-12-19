import prisma from '@news/lib/prisma';
import { logAudit } from '@news/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { articleId, targetLang, machine = true } = body || {};
  if (!articleId || !targetLang) return NextResponse.json({ error: 'articleId and targetLang required' }, { status: 400 });

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

  const task = await prisma.translationTask.create({
    data: {
      articleId,
      targetLang,
      machine: Boolean(machine),
      status: 'pending',
    },
  });

  await logAudit({
    action: 'translation.create',
    entityId: articleId,
    entityType: 'article',
    summary: `Translation task created to ${targetLang}`,
  });

  return NextResponse.json({ task });
}
