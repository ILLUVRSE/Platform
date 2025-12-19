import { logAudit } from '@news/lib/audit';
import { isSafeMode } from '@news/lib/settings';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { prompt = '', articleId } = body || {};
  const trimmedPrompt = typeof prompt === 'string' ? prompt.trim() : '';

  if (!trimmedPrompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  if (await isSafeMode()) {
    return NextResponse.json({ error: 'Safe mode enabled' }, { status: 503 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 503 });
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: trimmedPrompt,
      size: '1792x1024',
      n: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `OpenAI image error: ${text || res.statusText}` }, { status: res.status });
  }

  const data = await res.json();
  const image = data?.data?.[0]?.url || (data?.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null);
  const revisedPrompt = data?.data?.[0]?.revised_prompt || null;

  if (!image) {
    return NextResponse.json({ error: 'OpenAI image response was empty' }, { status: 500 });
  }

  await logAudit({
    action: 'openai.generate.image',
    entityId: articleId ?? null,
    entityType: 'article',
    summary: 'AI image generated',
    metadata: { size: '1792x1024', revisedPrompt: revisedPrompt ?? undefined },
  });

  return NextResponse.json({ url: image, revisedPrompt });
}
