'use server';

import OpenAI from 'openai';

async function withTimeout<T>(promise: Promise<T>, ms = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
}

export async function scanRecipeImage(formData: FormData) {
  const files = formData.getAll('file') as File[];
  const apiKey = (formData.get('apiKey') as string) || process.env.OPENAI_API_KEY;

  if (!files || files.length === 0) {
    return { error: 'No file uploaded' };
  }
  if (!apiKey) {
    return { error: 'Missing OpenAI API key. Add one in Settings.' };
  }

  const images = await Promise.all(
    files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      return `data:${file.type};base64,${base64Image}`;
    })
  );

  try {
    const openai = new OpenAI({ apiKey });
    const response = await withTimeout(
      openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "You are a recipe OCR assistant. Extract the recipe from the attached image(s). Return ONLY a JSON object with { title: string, ingredients: [{ item: string, quantity: string, unit: string, note?: string }], instructions: string[], servings: number }. If servings is missing, estimate or default to 4. Normalize quantities to decimals (e.g., 1/2 -> 0.5). Split quantity and unit.",
            },
            ...images.map((img) => ({
              type: "image_url" as const,
              image_url: { url: img },
            })),
          ],
        },
      ],
      response_format: { type: "json_object" },
    })
    );

    const content = response.choices[0].message.content;
    if (!content) return { error: 'Failed to extract recipe' };

    return { data: JSON.parse(content) };
  } catch (error) {
    console.error("OpenAI Error:", error);
    return { error: 'Failed to scan recipe. Please check API Key.' };
  }
}

export async function generateRecipeThumbnail({
  prompt,
  apiKey: providedKey,
}: {
  prompt: string;
  apiKey?: string;
}) {
  const apiKey = providedKey || process.env.OPENAI_API_KEY;
  if (!prompt.trim()) {
    return { error: 'Please provide a prompt for the thumbnail.' };
  }
  if (!apiKey) {
    return { error: 'Missing OpenAI API key. Add one in Settings.' };
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await withTimeout(
      openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      response_format: 'b64_json',
    })
    );
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return { error: 'Failed to generate image.' };
    }
    return { imageUrl: `data:image/png;base64,${b64}` };
  } catch (error) {
    console.error('OpenAI Thumbnail Error:', error);
    return { error: 'Image generation failed. Please try again.' };
  }
}
