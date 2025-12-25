'use server';

import { signIn } from '@news/auth';
import { AuthError } from 'next-auth';
import prisma from '@news/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@news/auth';
import { ArticleStatus } from '@illuvrse/db';
import { z } from 'zod';
import slugify from 'slugify';
import { isSafeMode } from '@news/lib/settings';

const ROLE_ADMIN = 'admin';
const ROLE_SPORTS_EDITOR = 'sports_editor';

const getSessionRole = (session: unknown) =>
  (session as { user?: { role?: string } } | null)?.user?.role;

const hasRole = (session: unknown, allowed: string[]) => {
  const role = getSessionRole(session);
  return role ? allowed.includes(role) : false;
};

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const ArticleBaseSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  pullQuote: z.string().optional(),
  sources: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
  scheduledFor: z.string().optional(),
  tags: z.string().optional(),
  articleType: z.enum(['news', 'feature']).optional(),
});

const articleRefinement = (data: z.infer<typeof ArticleBaseSchema>, ctx: z.RefinementCtx) => {
  if (data.status === 'scheduled' && !data.scheduledFor) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Scheduled posts need a date/time',
      path: ['scheduledFor'],
    });
  }
};

const ArticleSchema = ArticleBaseSchema.superRefine(articleRefinement);

interface CreateArticleState {
    errors?: {
        title?: string[];
        slug?: string[];
        content?: string[];
        excerpt?: string[];
        status?: string[];
        scheduledFor?: string[];
    };
    message?: string;
}

function tagsToArray(tagsString: string | undefined) {
  if (!tagsString) return [] as { name: string; slug: string }[];
  return tagsString
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      slug: slugify(name, { lower: true, strict: true }).slice(0, 60),
    }));
}

function parseSources(s: string): { name: string; url: string }[] {
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => ({
          name: typeof item.name === 'string' ? item.name : '',
          url: typeof item.url === 'string' ? item.url : '',
        }))
        .filter((item) => item.name && item.url);
    }
  } catch {
    return [];
  }
  return [];
}

export async function createArticle(prevState: CreateArticleState | undefined, formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
      return { message: 'Unauthorized' };
  }
  if (!hasRole(session, [ROLE_ADMIN])) {
    return { message: 'Forbidden' };
  }

  // Fetch user ID from email since session might not have ID depending on config
  // For better performance, we should put ID in session, but looking up by email is safe enough for MVP.
  const user = await prisma.user.findUnique({
      where: { email: session.user.email }
  });

  if (!user) {
      return { message: 'User not found' };
  }

  const validatedFields = ArticleSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    content: formData.get('content'),
    excerpt: formData.get('excerpt') ?? undefined,
    coverImage: formData.get('coverImage') ?? undefined,
    pullQuote: formData.get('pullQuote') ?? undefined,
    sources: formData.get('sources') ?? undefined,
    status: formData.get('status') ?? 'draft',
    scheduledFor: formData.get('scheduledFor') ?? undefined,
    tags: formData.get('tags') ?? undefined,
    articleType: formData.get('articleType') ?? undefined,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Article.',
    };
  }

  const {
    title,
    slug,
    content,
    excerpt,
    status,
    scheduledFor,
    tags,
    coverImage,
    pullQuote,
    sources,
    articleType,
  } = validatedFields.data;

  const scheduledDate =
    status === 'scheduled' && scheduledFor ? new Date(scheduledFor as string) : null;
  const published = status === 'published';
  const publishedAt = published
    ? new Date()
    : status === 'scheduled' && scheduledDate
      ? scheduledDate
      : null;

  const tagList = tagsToArray(tags);
  if (articleType) {
    const typeTag = {
      name: articleType === 'news' ? 'News' : 'Feature',
      slug: slugify(articleType),
    };
    if (!tagList.find((t) => t.slug === typeTag.slug)) {
      tagList.push(typeTag);
    }
  }

  try {
    await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage: coverImage || null,
        pullQuote: pullQuote || null,
        sources: sources ? parseSources(sources) : [],
        status,
        published,
        publishedAt,
        scheduledFor: scheduledDate,
        authorId: user.id,
        tags:
          tagList.length > 0
            ? {
                connectOrCreate: tagList.map((tag) => ({
                  where: { slug: tag.slug },
                  create: { name: tag.name, slug: tag.slug },
                })),
              }
            : undefined,
      },
    });
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to Create Article.',
    };
  }

  revalidatePath('/');
  redirect('/admin/dashboard');
}

const parseJsonResponse = (raw: string) => {
  try {
    const match = raw.trim();
    return JSON.parse(match);
  } catch {
    const jsonStart = raw.indexOf('{');
    if (jsonStart >= 0) {
      try {
        return JSON.parse(raw.slice(jsonStart));
      } catch {
        //
      }
    }
    throw new Error('AI response parse failed');
  }
};

export async function generateAiArticle(
  _prevState: { message?: string } | undefined,
  formData: FormData,
) {
  'use server';

  const topic = formData.get('topic')?.toString().trim();
  const articleType = formData.get('articleType')?.toString();
  const tagsInput = formData.get('tags')?.toString();
  const tone = formData.get('tone')?.toString()?.trim() || 'clear and confident';

  if (!topic || !articleType) {
    return { message: 'Please provide both topic and article type.' };
  }

  const session = await auth();
  if (!session?.user?.email) {
    return { message: 'Sign in first to publish AI stories.' };
  }
  if (!hasRole(session, [ROLE_ADMIN])) {
    return { message: 'Forbidden' };
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { message: 'User not found' };

  if (await isSafeMode()) {
    return { message: 'Safe mode is enabled. AI generation is currently blocked.' };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { message: 'Set OPENAI_API_KEY in your environment first.' };
  }

  const prompt = `
You are an editor for a culture publication. Write a ${
    articleType === 'news' ? 'brief news dispatch' : 'features-style overview'
  } about this topic: "${topic}". Keep tone ${tone} and include at least three sections where each starts with a headline (###). Respond with valid JSON structured as:
{
  "title": "Short descriptive headline",
  "excerpt": "One-sentence summary",
  "pullQuote": "Quote capturing vibe",
  "body": "Markdown with headings",
  "tags": ["tag1","tag2",...],
  "sources": [
    { "name": "Source name", "url": "https://..." }
  ]
}
Do not add extra text outside the JSON.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are a sharp culture reporter.' }, { role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { message: `OpenAI error: ${errorText}` };
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return { message: 'OpenAI returned empty response.' };
  }

  let parsed;
  try {
    parsed = parseJsonResponse(content);
  } catch {
    return { message: 'Failed to parse AI response. Try again.' };
  }

  const title = parsed.title?.slice(0, 180) ?? topic;
  const excerpt = parsed.excerpt?.slice(0, 240) ?? `Fresh dispatch on ${topic}.`;
  const pullQuote = parsed.pullQuote?.slice(0, 180) ?? excerpt;
  const body = parsed.body ?? parsed.content ?? `### ${topic}\n- Draft under construction.`;
  const suggestedTags = Array.isArray(parsed.tags)
    ? parsed.tags
    : [];
  const sourceLinks = Array.isArray(parsed.sources) && parsed.sources.length > 0
    ? parsed.sources
    : [{ name: 'OpenAI', url: 'https://openai.com' }];

  const tagList = new Set(
    [
      ...(tagsInput
        ? tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : []),
      ...suggestedTags,
      articleType === 'news' ? 'News' : 'Feature',
      'AI-generated',
    ].map((tag) => tag.toLowerCase()),
  );

  const slugBase = `${slugify(title, { lower: true, strict: true }).slice(0, 55)}-${Date.now()}`.slice(0, 60);

  try {
    await prisma.article.create({
      data: {
        title,
        slug: slugBase,
        content: body,
        excerpt,
        pullQuote,
        coverImage: `https://placehold.co/1200x800/1a1a1a/ffffff.png?text=${encodeURIComponent(title)}`,
        sources: sourceLinks,
        status: 'published',
        published: true,
        publishedAt: new Date(),
        authorId: user.id,
        tags: {
          connectOrCreate: Array.from(tagList).map((name) => ({
            where: { slug: slugify(name, { lower: true, strict: true }) },
            create: { name, slug: slugify(name, { lower: true, strict: true }) },
          })),
        },
      },
    });
  } catch (error) {
    console.error('AI article creation failed', error);
    return { message: 'Failed to publish generated story.' };
  }

  revalidatePath('/');
  revalidatePath('/news');
  revalidatePath('/features');
  return { message: `${articleType === 'news' ? 'News' : 'Feature'} story published!` };
}

export async function deleteArticle(formData: FormData) {
  const session = await auth();
  const isProd = process.env.NODE_ENV === 'production';
  if (!session?.user?.email && isProd) return { message: 'Unauthorized' };
  if (session?.user?.email && !hasRole(session, [ROLE_ADMIN])) return { message: 'Forbidden' };

  const id = formData.get('articleId');
  if (!id || typeof id !== 'string') return { message: 'Missing article ID' };

  await prisma.article.delete({ where: { id } });
  revalidatePath('/admin/articles');
  revalidatePath('/news');
  revalidatePath('/features');
  revalidatePath('/');
  return { message: 'Deleted' };
}

const UpdateArticleSchema = ArticleBaseSchema.extend({
  existingSlug: z.string(),
}).superRefine(articleRefinement);

export async function updateArticle(prevState: CreateArticleState | undefined, formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    return { message: 'Unauthorized' };
  }
  if (!hasRole(session, [ROLE_ADMIN])) {
    return { message: 'Forbidden' };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { message: 'User not found' };

  const validatedFields = UpdateArticleSchema.safeParse({
    existingSlug: formData.get('existingSlug'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    content: formData.get('content'),
    excerpt: formData.get('excerpt') ?? undefined,
    coverImage: formData.get('coverImage') ?? undefined,
    pullQuote: formData.get('pullQuote') ?? undefined,
    sources: formData.get('sources') ?? undefined,
    status: formData.get('status') ?? 'draft',
    scheduledFor: formData.get('scheduledFor') ?? undefined,
    tags: formData.get('tags') ?? undefined,
    articleType: formData.get('articleType') ?? undefined,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Article.',
    };
  }

  const {
    existingSlug,
    title,
    slug,
    content,
    excerpt,
    status,
    scheduledFor,
    tags,
    coverImage,
    pullQuote,
    sources,
    articleType,
  } = validatedFields.data;

  const scheduledDate =
    status === 'scheduled' && scheduledFor ? new Date(scheduledFor as string) : null;
  const published = status === 'published';
  const publishedAt = published
    ? new Date()
    : status === 'scheduled' && scheduledDate
      ? scheduledDate
      : null;

  const tagList = tagsToArray(tags);
  if (articleType) {
    const typeTag = {
      name: articleType === 'news' ? 'News' : 'Feature',
      slug: slugify(articleType, { lower: true, strict: true }),
    };
    if (!tagList.find((t) => t.slug === typeTag.slug)) {
      tagList.push(typeTag);
    }
  }

  try {
    await prisma.article.update({
      where: { slug: existingSlug },
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage: coverImage || null,
        pullQuote: pullQuote || null,
        sources: sources ? parseSources(sources) : [],
        status,
        published,
        publishedAt,
        scheduledFor: scheduledDate,
        authorId: user.id,
        tags:
          tagList.length > 0
            ? {
                connectOrCreate: tagList.map((tag) => ({
                  where: { slug: tag.slug },
                  create: { name: tag.name, slug: tag.slug },
                })),
              }
            : undefined,
      },
    });
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to Update Article.',
    };
  }

  revalidatePath('/admin/articles');
  revalidatePath('/');
  redirect('/admin/articles');
}

const MediaSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
});

const CreditSchema = z.object({
  personId: z.string().min(1),
  titleId: z.string().min(1),
  role: z.string().min(1),
  character: z.string().optional(),
  notes: z.string().optional(),
});

const VideoSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  hlsUrl: z.string().url().optional(),
  mp4Url: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  tags: z.string().optional(),
  live: z.boolean().optional(),
  published: z.boolean().optional(),
});

export async function createMedia(_prevState: { message?: string } | undefined, formData: FormData) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return { message: 'Unauthorized' };
  }
  if (!hasRole(session, [ROLE_ADMIN])) {
    return { message: 'Forbidden' };
  }

  const parsed = MediaSchema.safeParse({
    title: formData.get('title'),
    url: formData.get('url'),
  });

  if (!parsed.success) {
    return { message: 'Invalid fields' };
  }

  try {
    await prisma.mediaAsset.create({
      data: {
        title: parsed.data.title,
        url: parsed.data.url,
      },
    });
  } catch (error) {
    console.error(error);
    return { message: 'Failed to save media' };
  }

  revalidatePath('/admin/media');
  return { message: 'Saved' };
}

export async function createCredit(_prevState: { message?: string } | undefined, formData: FormData) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return { message: 'Unauthorized' };
  }
  if (!hasRole(session, [ROLE_ADMIN])) {
    return { message: 'Forbidden' };
  }

  const validated = CreditSchema.safeParse({
    personId: formData.get('personId'),
    titleId: formData.get('titleId'),
    role: formData.get('role'),
    character: formData.get('character') ?? undefined,
    notes: formData.get('notes') ?? undefined,
  });

  if (!validated.success) {
    return { message: 'Missing fields' };
  }

  try {
    await prisma.credit.create({
      data: validated.data,
    });
  } catch (error) {
    console.error(error);
    return { message: 'Database error creating credit' };
  }

  revalidatePath('/admin/credits');
  revalidatePath('/titles');
  revalidatePath('/people');
  return { message: 'Created' };
}

export async function deleteCredit(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { message: 'Unauthorized' };
  if (!hasRole(session, [ROLE_ADMIN])) return { message: 'Forbidden' };

  const id = formData.get('creditId');
  if (!id || typeof id !== 'string') return { message: 'Missing credit ID' };

  await prisma.credit.delete({ where: { id } });
  revalidatePath('/admin/credits');
  revalidatePath('/titles');
  revalidatePath('/people');
}

export async function createVideo(_prevState: { message?: string } | undefined, formData: FormData) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return { message: 'Unauthorized' };
  }
  if (!hasRole(session, [ROLE_ADMIN, ROLE_SPORTS_EDITOR])) {
    return { message: 'Forbidden' };
  }

  const parsed = VideoSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? undefined,
    thumbnail: formData.get('thumbnail') ?? undefined,
    hlsUrl: formData.get('hlsUrl') ?? undefined,
    mp4Url: formData.get('mp4Url') ?? undefined,
    liveUrl: formData.get('liveUrl') ?? undefined,
    tags: formData.get('tags') ?? undefined,
    live: Boolean(formData.get('live')),
    published: formData.get('published') ? true : false,
  });

  if (!parsed.success) {
    return { message: 'Invalid fields' };
  }

  try {
    await prisma.video.create({
      data: {
        ...parsed.data,
        publishedAt: parsed.data.published ? new Date() : null,
      },
    });
  } catch (error) {
    console.error(error);
    return { message: 'Failed to save video' };
  }

  revalidatePath('/news/admin/videos');
  revalidatePath('/news/videos');
  return { message: 'Saved' };
}

export async function deleteVideo(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { message: 'Unauthorized' };
  if (!hasRole(session, [ROLE_ADMIN, ROLE_SPORTS_EDITOR])) return { message: 'Forbidden' };

  const id = formData.get('videoId');
  if (!id || typeof id !== 'string') return { message: 'Missing video ID' };

  await prisma.video.delete({ where: { id } });
  revalidatePath('/news/admin/videos');
  revalidatePath('/news/videos');
}

export async function updateArticleStatus(
  _prevState: { message?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return { message: 'Unauthorized' };
  }
  if (!hasRole(session, [ROLE_ADMIN])) {
    return { message: 'Forbidden' };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { message: 'User not found' };

  const articleId = formData.get('articleId')?.toString();
  const status = formData.get('status')?.toString() as ArticleStatus | undefined;
  const scheduledFor = formData.get('scheduledFor')?.toString();

  if (!articleId || !status) {
    return { message: 'Missing fields' };
  }

  const scheduledDate =
    status === 'scheduled' && scheduledFor ? new Date(scheduledFor as string) : null;
  const published = status === 'published';
  const publishedAt =
    status === 'published'
      ? new Date()
      : status === 'scheduled' && scheduledDate
        ? scheduledDate
        : null;

  try {
    await prisma.article.update({
      where: { id: articleId },
      data: {
        status,
        published,
        publishedAt,
        scheduledFor: scheduledDate,
      },
    });
  } catch (error) {
    console.error(error);
    return { message: 'Failed to update status' };
  }

  revalidatePath('/admin/articles');
  revalidatePath('/');
  return { message: 'Updated' };
}
