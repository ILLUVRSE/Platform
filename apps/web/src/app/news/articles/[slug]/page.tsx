import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import prisma from '@news/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleProgress, ShareButtons } from '@news/components/article-extras';
import { LicenseChip, VerificationBadge } from '@news/components/ui';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await prisma.article.findUnique({
    where: { slug: resolvedParams.slug },
  });
  if (!article) return { title: 'Article not found • ILLUVRSE News' };

  const description =
    article.excerpt || `${article.content.slice(0, 140)}${article.content.length > 140 ? '…' : ''}`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://illuvrse.news';
  const canonical = `${baseUrl}/news/articles/${article.slug}`;
  const cover = article.coverImage
    ? article.coverImage.startsWith('http')
      ? article.coverImage
      : `${baseUrl}${article.coverImage.startsWith('/') ? '' : '/'}${article.coverImage}`
    : undefined;

  return {
    title: `${article.title} • ILLUVRSE News`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${article.title} • ILLUVRSE News`,
      description,
      url: canonical,
      images: cover ? [{ url: cover, alt: article.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} • ILLUVRSE News`,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug) {
    notFound();
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: true, tags: true },
  });

  if (!article) {
    notFound();
  }

  let related = await prisma.article.findMany({
    where: {
      id: { not: article.id },
      published: true,
      status: 'published',
      publishedAt: { lte: new Date() },
      ...(article.tags.length > 0
        ? {
            tags: {
              some: {
                slug: { in: article.tags.map((t) => t.slug) },
              },
            },
          }
        : {}),
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    include: { author: true },
  });

  if (related.length === 0) {
    related = await prisma.article.findMany({
      where: { id: { not: article.id }, published: true, status: 'published', publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      include: { author: true },
    });
  }

  const inlineRelated = related.slice(0, 2);

  const receipts =
    (Array.isArray(article.sources) &&
      (article.sources as { name: string; url: string }[]).filter(
        (s) => typeof s.name === 'string' && typeof s.url === 'string',
      )) ||
    [];

  const getHost = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  };

  const furtherReading = receipts.slice(0, 3).map((source) => ({
    ...source,
    host: getHost(source.url),
  }));

  const tldr =
    article.excerpt ||
    (article.content.length > 240 ? `${article.content.slice(0, 240)}…` : article.content);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(date),
    );

  const wordCount = article.content.split(/\s+/).length;
  const readTimeMinutes = Math.max(2, Math.round(wordCount / 200));
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.content.slice(0, 160),
    author: article.author?.name,
    datePublished: article.publishedAt || article.createdAt,
    image: article.coverImage || undefined,
    keywords: article.tags.map((t) => t.name),
    inLanguage: article.locale || "en",
    contentLocation: article.countryCode || undefined,
    license: article.license || undefined,
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'ILLUVRSE News — Global Public Access News Network',
    },
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://illuvrse.news'}/news/articles/${article.slug}`,
  };

  const publishedOn = formatDate(article.publishedAt ?? article.createdAt);

  return (
    <main
      className="min-h-screen pb-20"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ArticleProgress />
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{ borderBottom: `1px solid var(--border)`, background: 'rgba(247,243,235,0.9)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/news" className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
            ILLUVRSE News
          </Link>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
            <span className="rounded-full px-3 py-1" style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}>
              In-depth
            </span>
            <Link
              href={`/news/api/articles/${article.slug}/sources`}
              className="rounded-full px-3 py-1 transition hover:opacity-80"
              style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}
            >
              Sources.json
            </Link>
          </div>
        </div>
      </header>

      <article className="mx-auto mt-12 max-w-5xl px-4">
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
            <span>Feature</span>
            <LicenseChip license={article.license} />
            <VerificationBadge reliability={article.sourceReliability} />
            {(article.countryCode || article.locale) && (
              <span className="rounded-full border px-2 py-1 text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}>
                {article.countryCode ?? 'World'} • {article.locale ?? 'lang'}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black leading-tight md:text-5xl" style={{ color: 'var(--forest)' }}>
            {article.title}
          </h1>
          {article.coverImage && (
            <div className="mt-5 overflow-hidden rounded-3xl border" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
              <div className="relative h-80 w-full">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  sizes="(min-width: 1024px) 960px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}
          {article.pullQuote && (
            <blockquote
              className="mt-6 rounded-2xl p-5 text-lg font-semibold italic"
              style={{ border: `1px solid var(--border)`, background: 'var(--panel)', color: 'var(--forest)' }}
            >
              “{article.pullQuote}”
            </blockquote>
          )}
          <div
            className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl px-4 py-3"
            style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}
          >
            <div className="h-10 w-10 rounded-full" style={{ background: 'var(--sage)' }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                {article.author?.name}
              </div>
              <div className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                {publishedOn}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              <span className="rounded-full px-3 py-1" style={{ border: `1px solid var(--border)` }}>
                {article.status ?? 'published'}
              </span>
              <span className="rounded-full px-3 py-1" style={{ border: `1px solid var(--border)` }}>
                {readTimeMinutes} min read
              </span>
            </div>
          </div>
        </header>

        <section
          className="mb-8 grid gap-4 rounded-2xl p-5 md:grid-cols-[2fr,1fr]"
          style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              TL;DR
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
              {tldr}
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border p-3 text-xs uppercase tracking-[0.18em]" style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--muted)' }}>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--forest)' }}>
              Verification
            </p>
            <p>Sources.json: <Link href={`/news/api/articles/${article.slug}/sources`} className="underline" style={{ color: 'var(--forest)' }}>Download</Link></p>
            <p>License: {article.license ?? 'Not set'}</p>
            <p>Reliability: {typeof article.sourceReliability === 'number' ? `${article.sourceReliability}/100` : 'Not scored'}</p>
            <p>Region/Lang: {article.countryCode ?? 'World'} / {article.locale ?? 'n/a'}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/news/api/articles/${article.slug}/text`} className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}>
                Text Only
              </Link>
              <Link href={`/news/api/articles/${article.slug}/audio`} className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}>
                Audio (TTS)
              </Link>
            </div>
          </div>
        </section>

        {article.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ border: `1px solid var(--border)`, background: 'var(--panel)', color: 'var(--forest)' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {inlineRelated.length > 0 && (
          <div
            className="mb-6 flex flex-col gap-3 rounded-2xl p-4"
            style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              Related links
            </p>
            <div className="flex flex-wrap gap-2">
              {inlineRelated.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/articles/${item.slug}`}
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5"
                  style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--forest)' }}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div
          className="prose max-w-none rounded-2xl p-6"
          style={{ border: `1px solid var(--border)`, background: 'var(--panel)', color: 'var(--text)' }}
        >
          <ReactMarkdown
            components={{
              blockquote: ({ children }) => (
                <blockquote
                  className="rounded-2xl p-4"
                  style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--forest)' }}
                >
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="rounded-md px-1.5 py-0.5" style={{ background: 'var(--cream)', color: 'var(--forest)' }}>
                  {children}
                </code>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-4"
                  style={{ color: 'var(--forest)' }}
                >
                  {children}
                </a>
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div
            className="rounded-2xl p-5"
            style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              Receipts (Sources)
            </p>
            <div className="mt-3 space-y-3">
              {receipts.length > 0 ? (
                receipts.map((item) => (
                  <Link
                    key={item.name}
                    href={item.url}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm transition"
                    style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--forest)' }}
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                      Source
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Add verified links when publishing and they will appear here.
                </p>
              )}
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              Quick facts & verification
            </p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text)' }}>
              <li>• Published {publishedOn}</li>
              <li>• {wordCount} words • {readTimeMinutes} min read</li>
              <li>• Tags: {article.tags.map((t) => t.name).join(', ') || 'None yet'}</li>
              {article.license && <li>• License: {article.license}</li>}
              {typeof article.sourceReliability === 'number' && <li>• Reliability: {article.sourceReliability}/100</li>}
              {(article.countryCode || article.region) && (
                <li>• Region: {article.countryCode ?? article.region}</li>
              )}
              {article.locale && <li>• Language: {article.locale}</li>}
            </ul>
          </div>
        </section>

        <section
          className="mt-10 rounded-2xl p-6"
          style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
                Further reading
              </p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                External reporting and official links used for this piece.
              </p>
            </div>
            <ShareButtons slug={article.slug} title={article.title} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {furtherReading.length > 0 ? (
              furtherReading.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className="group rounded-2xl border p-4 transition hover:-translate-y-1"
                  style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                    {item.host ?? 'Source'}
                  </p>
                  <p className="mt-2 text-sm font-semibold group-hover:opacity-80">{item.name}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No external links added yet.
              </p>
            )}
          </div>
        </section>

        <section
          className="mt-10 rounded-2xl p-6"
          style={{ border: `1px solid var(--border)`, background: 'var(--panel)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              Related reading
            </p>
            <Link
              href="/news"
              className="text-xs uppercase tracking-[0.18em]"
              style={{ color: 'var(--muted)' }}
            >
              Back to home
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/news/articles/${item.slug}`}
                className="group rounded-xl border p-4 transition hover:-translate-y-1"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
              >
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  {formatDate(item.createdAt)}
                </p>
                <p className="mt-1 text-sm font-semibold group-hover:opacity-80">
                  {item.title}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  {item.author?.name ?? 'ILLUVRSE Staff'}
                </p>
              </Link>
            ))}
            {related.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No related posts yet—publish more content.
              </p>
            )}
          </div>
        </section>
      </article>
    </main>
  );
}
