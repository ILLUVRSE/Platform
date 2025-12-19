import { logAudit } from '@news/lib/audit';
import { getSetting, setSetting } from '@news/lib/settings';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DAILY_LIMIT = Number(process.env.OPENAI_DAILY_LIMIT_TOKENS || 50000);
const BUDGET_KEY = 'openai_tokens_today';

async function getBudgetUsed(): Promise<number> {
  const value = await getSetting(BUDGET_KEY);
  return value ? Number(value) || 0 : 0;
}

async function addBudgetUsed(tokens: number) {
  const used = await getBudgetUsed();
  await setSetting(BUDGET_KEY, String(used + tokens));
}

export async function generateWithOpenAI(prompt: string, maxTokens = 700) {
  if (!OPENAI_API_KEY) {
    const content = `AI placeholder (no OPENAI_API_KEY). Prompt length: ${prompt.length}`;
    await logAudit({
      action: 'openai.generate.placeholder',
      entityId: null,
      entityType: 'article',
      summary: 'OpenAI placeholder used (missing key)',
      metadata: { promptLength: prompt.length },
    });
    return { content, tokens: 0, model: 'placeholder' };
  }

  const used = await getBudgetUsed();
  if (DAILY_LIMIT && used + maxTokens > DAILY_LIMIT) {
    return { error: 'Daily OpenAI token budget exceeded', tokens: 0, model: OPENAI_MODEL };
  }

  const res = await fetch(OPENAI_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `OpenAI error: ${res.status} ${text}`, tokens: 0, model: OPENAI_MODEL };
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const tokens = data?.usage?.total_tokens || 0;

  await addBudgetUsed(tokens);
  await logAudit({
    action: 'openai.generate',
    entityId: null,
    entityType: 'article',
    summary: 'AI draft generated',
    metadata: { tokens, model: OPENAI_MODEL, promptLength: prompt.length },
  });

  return { content, tokens, model: OPENAI_MODEL };
}
