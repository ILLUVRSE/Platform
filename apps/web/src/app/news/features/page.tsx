import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import Script from 'next/script';
import prisma from '@news/lib/prisma';
import { HeroSpotlight, VerificationBadge } from '@news/components/ui';
import { LicenseModal } from '@news/components/news/license-modal';
import { SourcesDisclosure } from '@news/components/news/sources-disclosure';
import { FeatureCardActions } from '@news/components/features/feature-card-actions';

export const metadata: Metadata = {
  title: 'Features | ILLUVRSE — Global Public Access News Network',
  description: 'Longform features, interviews, and investigations with verifiable sources and clear licensing.',
  alternates: {
    canonical: '/news/features',
    languages: {
      en: '/news/features?lang=en',
      es: '/news/features?lang=es',
      fr: '/news/features?lang=fr',
    },
  },
};

export const revalidate = 60;

const lengthBuckets = {
  short: { label: 'Short (≤4 min)', max: 4 },
  medium: { label: 'Medium (5-8 min)', min: 5, max: 8 },
  long: { label: 'Long (9+ min)', min: 9 },
};

const cleanExcerpt = (text?: string | null) => {
  if (!text) return '';
  return text.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
};

const estimateRead = (content?: string | null) => {
  const words = content?.split(/\s+/).length || 0;
  return Math.max(2, Math.round(words / 200));
};

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    region?: string;
    lang?: string;
    verified?: string;
    q?: string;
    sort?: string;
    start?: string;
    end?: string;
    tag?: string;
    author?: string;
    length?: string;
    page?: string;
  }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const regionParam = resolved?.region?.toUpperCase() || 'WORLD';
  const langParam = resolved?.lang || undefined;
  const verifiedOnly = resolved?.verified === 'true';
  const searchQuery = resolved?.q ? resolved.q.toLowerCase().trim() : undefined;
  const sortParam = resolved?.sort || 'newest';
  const startDate = resolved?.start ? new Date(resolved.start) : undefined;
  const endDate = resolved?.end ? new Date(resolved.end) : undefined;
  const tagParam = resolved?.tag || undefined;
  const authorParam = resolved?.author || undefined;
  const lengthParam = resolved?.length as keyof typeof lengthBuckets | undefined;
  const page = Math.max(1, Number(resolved?.page) || 1);
  const pageSize = 10;

  const [articlesRaw, topTags, authors] = await Promise.all([
    prisma.article.findMany({
      where: {
        published: true,
        status: 'published',
        publishedAt: { lte: new Date() },
        tags: { some: { slug: 'feature' } },
        ...(regionParam && regionParam !== 'WORLD' ? { countryCode: regionParam } : {}),
        ...(langParam
          ? {
              OR: [{ locale: langParam }, { locale: { startsWith: `${langParam}-` } }],
            }
          : {}),
        ...(authorParam ? { authorId: authorParam } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      include: { author: true, tags: true, source: true },
    }),
    prisma.tag.findMany({
      orderBy: { articles: { _count: 'desc' } },
      take: 10,
      include: { _count: { select: { articles: true } } },
    }),
    prisma.user.findMany({
      where: {
        articles: {
          some: {
            published: true,
            status: 'published',
            tags: { some: { slug: 'feature' } },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const filtered = articlesRaw
    .filter((a) => !tagParam || a.tags.some((t) => t.slug === tagParam))
    .filter((a) => (verifiedOnly ? typeof a.sourceReliability === 'number' && a.sourceReliability >= 80 : true))
    .filter((a) => (startDate ? (a.publishedAt ?? a.createdAt) >= startDate : true))
    .filter((a) => (endDate ? (a.publishedAt ?? a.createdAt) <= endDate : true))
    .filter((a) => {
      if (!lengthParam) return true;
      const minutes = estimateRead(a.content);
      if (lengthParam === 'short') return minutes <= lengthBuckets.short.max;
      if (lengthParam === 'medium') return minutes >= (lengthBuckets.medium.min ?? 0) && minutes <= (lengthBuckets.medium.max ?? minutes);
      if (lengthParam === 'long') return minutes >= (lengthBuckets.long.min ?? minutes);
      return true;
    })
    .filter((a) => {
      if (!searchQuery) return true;
      const haystack = `${a.title} ${a.excerpt ?? ''} ${a.content}`.toLowerCase();
      return haystack.includes(searchQuery);
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortParam === 'verified') {
      return (b.sourceReliability ?? 0) - (a.sourceReliability ?? 0) || ((b.publishedAt ?? b.createdAt).getTime() - (a.publishedAt ?? a.createdAt).getTime());
    }
    if (sortParam === 'updated') {
      return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
    }
    if (sortParam === 'picks') {
      return ((b.sourceReliability ?? 0) - (a.sourceReliability ?? 0)) || ((b.tags.length) - (a.tags.length));
    }
    if (sortParam === 'long') {
      return estimateRead(b.content) - estimateRead(a.content);
    }
    if (sortParam === 'trending') {
      return b.tags.length - a.tags.length || ((b.publishedAt ?? b.createdAt).getTime() - (a.publishedAt ?? a.createdAt).getTime());
    }
    return (b.publishedAt ?? b.createdAt).getTime() - (a.publishedAt ?? a.createdAt).getTime();
  });

  const totalCount = sorted.length;
  const hero = sorted[0];
  const heroOffset = hero ? 1 : 0;
  const startIndex = (page - 1) * pageSize + heroOffset;
  const pagedCards = sorted.slice(startIndex, startIndex + pageSize);
  const hasMore = totalCount > startIndex + pagedCards.length;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(date),
    );

  const structuredData =
    hero && {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Features',
      hasPart: [
        {
          '@type': 'Article',
          headline: hero.title,
          author: hero.author?.name,
          datePublished: hero.publishedAt ?? hero.createdAt,
          image: hero.coverImage,
          inLanguage: hero.locale ?? langParam ?? 'en',
          license: hero.license,
          url: `${siteUrl}/news/articles/${hero.slug}`,
        },
      ],
      url: `${siteUrl}/news/features`,
    };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
      {structuredData && (
        <Script id="features-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}

      <div className="mb-6 space-y-2" data-cy="features-header">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
          Features desk
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
          Features
        </h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--text)' }}>
          Essays, interviews, investigations, and longform reporting with verifiable sources and clear licensing.
        </p>
      </div>

      {hero && (
        <div className="mb-8">
          <HeroSpotlight
            eyebrow="Feature of the day"
            title={hero.title}
            kicker={hero.excerpt ? cleanExcerpt(hero.excerpt) : undefined}
            summary={cleanExcerpt(hero.content.slice(0, 240))}
            imageUrl={hero.coverImage ?? undefined}
            imageAlt={hero.title}
            primaryAction={{ label: 'Read feature', href: `/news/articles/${hero.slug}` }}
            secondaryAction={{ label: 'Print', href: `/news/articles/${hero.slug}?print=1` }}
            author={hero.author?.name ?? 'ILLUVRSE Staff'}
            dateLabel={formatDate(hero.publishedAt ?? hero.createdAt)}
            readTime={`${estimateRead(hero.content)} min read`}
            reliability={hero.sourceReliability ?? null}
            license={hero.license ?? null}
            sourceName={hero.source?.name ?? null}
            sourceUrl={hero.sourceUrl ?? hero.source?.homepageUrl ?? null}
            regionLabel={regionParam === 'WORLD' ? 'World' : regionParam}
            languageLabel={hero.locale?.toUpperCase() ?? langParam?.toUpperCase()}
            shareUrl={`${siteUrl}/news/articles/${hero.slug}`}
          />
        </div>
      )}

      <div className="mb-8 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
          Editorial note
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text)' }}>
          Longform features are curated for depth and transparency. Each story shows verification and licensing so you can trust and reuse the work.
        </p>
      </div>

      <form
        className="sticky top-16 z-10 mb-8 grid gap-3 rounded-2xl border p-4 md:grid-cols-2 lg:grid-cols-3"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        method="get"
        role="search"
        aria-label="Filter features"
        data-cy="features-filters"
      >
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Region
          <select
            name="region"
            defaultValue={regionParam}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
            data-cy="filter-region"
          >
            <option value="WORLD">World</option>
            <option value="NA">North America</option>
            <option value="EU">Europe</option>
            <option value="AS">Asia</option>
            <option value="AF">Africa</option>
            <option value="SA">South America</option>
            <option value="OC">Oceania</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Language
          <select
            name="lang"
            defaultValue={langParam}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
            data-cy="filter-lang"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
            <option value="zh">中文</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Topic tag
          <select
            name="tag"
            defaultValue={tagParam}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
            data-cy="filter-tag"
          >
            <option value="">All topics</option>
            {topTags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.name} ({tag._count.articles})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Author
          <select
            name="author"
            defaultValue={authorParam}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
            data-cy="filter-author"
          >
            <option value="">Any author</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? 'Staff'}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Length
          <select
            name="length"
            defaultValue={lengthParam}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
            data-cy="filter-length"
          >
            <option value="">Any length</option>
            <option value="short">{lengthBuckets.short.label}</option>
            <option value="medium">{lengthBuckets.medium.label}</option>
            <option value="long">{lengthBuckets.long.label}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Sort
          <select
            name="sort"
            defaultValue={sortParam}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
            data-cy="filter-sort"
          >
            <option value="newest">Newest</option>
            <option value="verified">Most verified</option>
            <option value="picks">Editor picks</option>
            <option value="long">Longest reads</option>
            <option value="trending">Trending</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Search features
          <input
            type="search"
            name="q"
            defaultValue={resolved?.q}
            placeholder="Search headlines, tags, sources"
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
            data-cy="filter-search"
          />
        </label>

        <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          <input
            type="checkbox"
            name="verified"
            value="true"
            defaultChecked={verifiedOnly}
            className="h-4 w-4 rounded border text-[var(--forest)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)]"
            data-cy="filter-verified"
          />
          Verified only
        </label>

        <div className="flex flex-wrap items-center gap-3 lg:col-span-3">
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:-translate-y-0.5"
            data-cy="filters-apply"
          >
            Apply filters
          </button>
          <Link
            href="/news/features"
            className="text-xs font-semibold uppercase tracking-[0.18em] underline"
            style={{ color: 'var(--forest)' }}
            data-cy="filters-reset"
          >
            Clear filters
          </Link>
          <span className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }} aria-live="polite">
            Showing {Math.min(pagedCards.length + (page === 1 ? heroOffset : 0), totalCount)} of {totalCount} features
          </span>
        </div>
      </form>

      <div className="grid gap-6 md:grid-cols-2" data-cy="features-grid">
        {pagedCards.map((item) => (
          <article
            key={item.id}
            className="group flex flex-col rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            data-cy="feature-card"
          >
            {item.coverImage && (
              <div className="mb-3 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <Link href={`/news/articles/${item.slug}`} aria-label={item.title}>
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    width={1200}
                    height={675}
                    className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
                    sizes="(min-width: 1024px) 560px, 100vw"
                    loading="lazy"
                  />
                </Link>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              <span>{formatDate(item.publishedAt ?? item.createdAt)}</span>
              <span style={{ color: 'var(--forest)' }}>Feature</span>
              <span>{estimateRead(item.content)} min</span>
              {item.locale && <span>{item.locale.toUpperCase()}</span>}
              {item.countryCode && <span>{item.countryCode}</span>}
            </div>

            <h2 className="mt-3 text-2xl font-black leading-tight transition hover:text-[var(--forest)]" style={{ color: 'var(--forest)' }}>
              <Link href={`/news/articles/${item.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]">
                {item.title}
              </Link>
            </h2>

            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {item.excerpt ? cleanExcerpt(item.excerpt) : cleanExcerpt(item.content.slice(0, 240)) + '…'}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
              <span>By {item.author?.name ?? 'ILLUVRSE Staff'}</span>
              {item.source?.name && (
                <Link
                  href={item.source?.homepageUrl || '#'}
                  target={item.source?.homepageUrl ? '_blank' : undefined}
                  rel={item.source?.homepageUrl ? 'noopener noreferrer' : undefined}
                  className="underline"
                  aria-label={`View source ${item.source.name}`}
                >
                  {item.source.name}
                </Link>
              )}
              {item.sourceUrl && (
                <Link href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline" aria-label="Open source link">
                  Source link
                </Link>
              )}
              <Link href={`/transparency?article=${item.slug}`} className="underline" aria-label="View transparency log">
                Transparency
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <VerificationBadge
                reliability={item.sourceReliability}
                label="Verification"
                sourceHref={item.source?.homepageUrl || item.sourceUrl || undefined}
                size="sm"
              />
              <LicenseModal
                license={item.license}
                title={item.title}
                author={item.author?.name}
                sourceName={item.source?.name}
                dataCy="feature-license"
              />
            </div>

            <div className="mt-3">
              <SourcesDisclosure
                sources={item.sources as unknown}
                fallbackName={item.source?.name ?? null}
                fallbackUrl={item.sourceUrl ?? item.source?.homepageUrl ?? null}
                reliability={item.sourceReliability ?? null}
                dataCy="feature-sources"
              />
            </div>

            {item.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Tags">
                {item.tags.slice(0, 4).map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/features?tag=${tag.slug}`}
                    className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
                  >
                    {tag.name}
                  </Link>
                ))}
                {item.tags.length > 4 && (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                    +{item.tags.length - 4} more
                  </span>
                )}
              </div>
            )}

            <div className="mt-4">
              <FeatureCardActions url={`${siteUrl}/news/articles/${item.slug}`} title={item.title} dataCy="feature-actions" />
            </div>
          </article>
        ))}

        {pagedCards.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
            data-cy="features-empty"
          >
            No results. Try clearing filters, widening the date range, or exploring another region.
          </div>
        )}
      </div>

      {hasMore && (() => {
        const loadMoreParams = new URLSearchParams();
        if (regionParam) loadMoreParams.set('region', regionParam);
        if (langParam) loadMoreParams.set('lang', langParam);
        if (verifiedOnly) loadMoreParams.set('verified', 'true');
        if (resolved?.q) loadMoreParams.set('q', resolved.q);
        if (sortParam) loadMoreParams.set('sort', sortParam);
        if (resolved?.start) loadMoreParams.set('start', resolved.start);
        if (resolved?.end) loadMoreParams.set('end', resolved.end);
        if (tagParam) loadMoreParams.set('tag', tagParam);
        if (authorParam) loadMoreParams.set('author', authorParam);
        if (lengthParam) loadMoreParams.set('length', lengthParam);
        loadMoreParams.set('page', String(page + 1));

        return (
          <div className="mt-8 flex justify-center">
            <Link
              href={`/features?${loadMoreParams.toString()}`}
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest)]"
              aria-label="Load more features"
              data-cy="features-load-more"
            >
              Load more
            </Link>
          </div>
        );
      })()}
    </main>
  );
}
