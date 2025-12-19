import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { apiKey } = await req.json();
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Missing API key' }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey });
    await client.models.list({ limit: 1 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Key validation failed', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Could not validate API key' },
      { status: 400 }
    );
  }
}
