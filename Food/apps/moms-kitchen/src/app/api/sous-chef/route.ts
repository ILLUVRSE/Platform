import OpenAI from 'openai';
import { NextResponse } from 'next/server';

async function withTimeout<T>(promise: Promise<T>, ms = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
}

export async function POST(req: Request) {
  try {
    const { messages, recipeContexts = [], apiKey: providedKey, mode, diet, pantryItems = [] } = await req.json();
    const apiKey = providedKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 400 });
    }

    const modeText =
      mode === 'substitute'
        ? 'Focus on offering ingredient substitutions and equivalents, keep flavor and texture similar.'
        : mode === 'pantry'
        ? 'Focus on helping the user cook with what they have; suggest recipes and swaps based on pantry items they share.'
        : 'General friendly sous chef help.';
    const dietText =
      diet && diet !== 'none'
        ? `Honor dietary preference: ${diet}. Avoid conflicts and suggest compliant swaps.`
        : '';

    const multiContext = (recipeContexts as any[])
      .map(
        (r, idx) => `
Recipe ${idx + 1}:
Title: ${r.title}
Ingredients: ${JSON.stringify(r.ingredients)}
Instructions: ${JSON.stringify(r.instructions)}
`
      )
      .join('\n');

    const systemPrompt = `
You are a friendly, helpful, and warm AI Sous Chef (think Julia Child meets a helpful grandmother).
You are currently helping a user cook one or more recipes.
Recipe context:
${multiContext || 'None provided'}

Pantry items (things the cook likely has): ${pantryItems.join(', ') || 'Not provided'}

Mode: ${modeText}
${dietText}

Your goal is to answer questions about these recipes, offer cooking tips relevant to them, and help if they get stuck.
Prioritize clear timing cues, doneness signals, and safe food-handling notes. If multiple recipes are present, help the cook sequence steps efficiently.
If they ask something unrelated to cooking, gently steer them back to the kitchen.
`;

    const client = new OpenAI({ apiKey });

    const completion = await withTimeout(
      client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
    })
    );

    return NextResponse.json({ 
      role: 'assistant', 
      content: completion.choices[0].message.content 
    });

  } catch (error) {
    console.error('Sous Chef Error:', error);
    return NextResponse.json({ error: 'My oven is acting up! Try again in a moment.' }, { status: 500 });
  }
}
