import { logAudit } from '@news/lib/audit';
import { isSafeMode } from '@news/lib/settings';
import { generateWithOpenAI } from '@news/lib/openaiClient';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { prompt = '', articleId } = body || {};

  if (await isSafeMode()) {
    return NextResponse.json({ error: 'Safe mode enabled' }, { status: 503 });
  }

  const result = await generateWithOpenAI(prompt);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await logAudit({
    action: 'openai.generate',
    entityId: articleId ?? null,
    entityType: 'article',
    summary: 'AI draft generated',
    metadata: { tokens: result.tokens, model: result.model },
  });

  return NextResponse.json({ content: result.content, tokenUsage: result.tokens, model: result.model });
}
