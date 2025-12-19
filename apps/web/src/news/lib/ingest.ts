import prisma from '@news/lib/prisma';
import { ArticleStatus } from '@illuvrse/db';

type ParsedItem = {
  title: string;
  link: string;
  guid: string;
  pubDate: Date;
  description: string;
};

const sourceThumbs: Record<string, string> = {
  'bbc-world': 'https://images.unsplash.com/photo-1504712598893-24159a89200e?auto=format&fit=crop&w=1400&q=80',
  'npr-world': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
  'un-news': 'https://images.unsplash.com/photo-1526402460680-5cb1ab8a7706?auto=format&fit=crop&w=1400&q=80',
  'aljazeera-world': 'https://images.unsplash.com/photo-1504788363733-507549153474?auto=format&fit=crop&w=1400&q=80',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const cleanCdata = (text = '') => text.replace('<![CDATA[', '').replace(']]>', '');
const stripHtml = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const decodeEntities = (text = '') =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

function parseItems(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const matches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of matches) {
    const pick = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? decodeEntities(cleanCdata(m[1]).trim()) : null;
    };
    const title = pick('title');
    const link = pick('link');
    const guid = pick('guid') || link;
    const pubDate = pick('pubDate');
    const description = pick('description') || pick('summary');
    if (!title || !link) continue;
    items.push({
      title,
      link,
      guid: guid || link || title,
      pubDate: pubDate ? new Date(pubDate) : new Date(),
      description: description || '',
    });
  }
  return items;
}

async function ensureAuthor() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found; seed an admin user first.');
  return user;
}

export async function ingestSource(sourceId: string, publish = false) {
  const author = await ensureAuthor();
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source || !source.feedUrl) {
    throw new Error('Source not found or missing feedUrl');
  }

  let created = 0;
  let updated = 0;

  try {
    const res = await fetch(source.feedUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const xml = await res.text();
    const items = parseItems(xml).slice(0, 20);

    for (const item of items) {
      const originId = item.guid || item.link;
      const slug = slugify(item.title);
      const summary = stripHtml(item.description || item.title);
      const tags = [
        'News',
        source.region || source.countryCode || 'World',
        source.language ? `Lang:${source.language}` : null,
        summary.length > 220 ? 'Feature' : 'News',
      ]
        .filter(Boolean)
        .map((t) => String(t));

      const tagConnect = tags.map((name) => ({
        where: { slug: slugify(name) },
        create: { name, slug: slugify(name) },
      }));

      const data = {
        title: item.title,
        slug,
        content: summary,
        excerpt: summary.slice(0, 280),
        summary,
        coverImage: sourceThumbs[source.slug] || sourceThumbs[source.slug?.toLowerCase()] || sourceThumbs['bbc-world'],
        sourceUrl: item.link,
        originId,
        published: publish,
        publishedAt: publish ? item.pubDate : null,
        status: publish ? ArticleStatus.published : ArticleStatus.draft,
        authorId: author.id,
        sourceId: source.id,
        locale: source.language || null,
        countryCode: source.countryCode || null,
        region: source.region || null,
        license: source.license || 'CC-BY-4.0',
        sourceReliability: source.reliability ?? null,
        tags: { connectOrCreate: tagConnect },
      };

      const existing = await prisma.article.findUnique({ where: { originId } });
      if (existing) {
        await prisma.article.update({
          where: { originId },
          data,
        });
        updated += 1;
      } else {
        await prisma.article.create({ data });
        created += 1;
      }
    }

    await prisma.source.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date(), failureCount: 0 },
    });

    await prisma.ingestLog.create({
      data: {
        sourceId: source.id,
        status: 'success',
        message: `Created ${created}, updated ${updated}`,
      },
    });

    return { created, updated, source: source.name };
  } catch (error) {
    await prisma.source.update({
      where: { id: sourceId },
      data: { failureCount: { increment: 1 } },
    });
    await prisma.ingestLog.create({
      data: {
        sourceId,
        status: 'error',
        message: error instanceof Error ? error.message : 'Ingest failed',
      },
    });
    if (error instanceof Error) throw error;
    throw new Error('Ingest failed');
  }
}

export async function ingestAllActive(publish = false) {
  const sources = await prisma.source.findMany({
    where: { active: true, feedUrl: { not: null } },
    select: { id: true, name: true },
  });
  const results = [];
  for (const src of sources) {
    try {
      const result = await ingestSource(src.id, publish);
      results.push({ source: src.name, ...result, status: 'ok' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed';
      results.push({ source: src.name, status: 'error', message });
    }
  }
  return results;
}
