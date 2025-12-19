import prisma from '@news/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { NewsCardActions } from '@news/components/news/news-card-actions';
import { LicenseModal } from '@news/components/news/license-modal';
import { SourcesDisclosure } from '@news/components/news/sources-disclosure';
import { VerificationBadge } from '@news/components/ui';

export const metadata = {
  title: 'News | ILLUVRSE — Global Public Access News Network',
  description:
    'Region-aware news desk with verified sources, licensing guidance, and transparency for every story.',
  alternates: {
    canonical: '/news',
    languages: {
      'en': '/news?lang=en',
      'es': '/news?lang=es',
      'fr': '/news?lang=fr',
    },
  },
};

export const revalidate = 60;

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ region?: string; lang?: string; verified?: string; q?: string; sort?: string; start?: string; end?: string; page?: string }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const regionParam = resolved?.region?.toUpperCase() || 'WORLD';
  const langParam = resolved?.lang || undefined;
  const verifiedOnly = resolved?.verified === 'true';
  const searchQuery = resolved?.q?.trim();
  const sortParam = resolved?.sort || 'newest';
  const startDate = resolved?.start ? new Date(resolved.start) : undefined;
  const endDate = resolved?.end ? new Date(resolved.end) : undefined;
  const page = Math.max(1, Number(resolved?.page) || 1);
  const pageSize = 12;

  const where = {
    published: true,
    status: 'published',
    publishedAt: { lte: new Date() },
    tags: { some: { slug: 'news' } },
    ...(regionParam && regionParam !== 'WORLD' ? { countryCode: regionParam } : {}),
    ...(langParam
      ? {
          OR: [{ locale: langParam }, { locale: { startsWith: `${langParam}-` } }],
        }
      : {}),
    ...(verifiedOnly ? { sourceReliability: { gte: 80 } } : {}),
    ...(startDate ? { publishedAt: { gte: startDate } } : {}),
    ...(endDate ? { publishedAt: { lte: endDate } } : {}),
    ...(searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { excerpt: { contains: searchQuery, mode: 'insensitive' } },
            { content: { contains: searchQuery, mode: 'insensitive' } },
          ],
        }
      : {}),
  } as const;

  const orderBy =
    sortParam === 'verified'
      ? [{ sourceReliability: 'desc' }, { publishedAt: 'desc' }]
      : sortParam === 'updated'
        ? [{ updatedAt: 'desc' }]
        : sortParam === 'trending'
          ? [{ tags: { _count: 'desc' } }, { publishedAt: 'desc' }]
          : [{ publishedAt: 'desc' }];

  const [totalCount, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: { author: true, tags: true, source: true },
    }),
  ]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(date),
    );
  const formatUpdated = (publishedAt?: Date | null, updatedAt?: Date | null) => {
    if (!publishedAt || !updatedAt) return null;
    const delta = updatedAt.getTime() - publishedAt.getTime();
    return delta > 10 * 60 * 1000 ? `Updated ${formatDate(updatedAt)}` : null;
  };
  const readTime = (content?: string | null) => {
    if (!content) return '1 min';
    const words = content.split(/\s+/).length;
    return `${Math.max(1, Math.round(words / 200))} min read`;
  };
  const hasMore = totalCount > page * pageSize;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const queryWithoutPage = new URLSearchParams();
  if (regionParam) queryWithoutPage.set('region', regionParam);
  if (langParam) queryWithoutPage.set('lang', langParam);
  if (verifiedOnly) queryWithoutPage.set('verified', 'true');
  if (searchQuery) queryWithoutPage.set('q', searchQuery);
  if (sortParam) queryWithoutPage.set('sort', sortParam);
  if (resolved?.start) queryWithoutPage.set('start', resolved.start);
  if (resolved?.end) queryWithoutPage.set('end', resolved.end);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
      <Script
        id="news-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'News',
            description: 'Rapid-fire updates, verified sources, zero fluff. Fresh posts land here first.',
            inLanguage: langParam ?? 'en',
            isAccessibleForFree: true,
            url: `${siteUrl}/news`,
          }),
        }}
      />
      <div className="mb-6 space-y-2" data-cy="news-header">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
          News desk
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
          News
        </h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--text)' }}>
          Rapid-fire updates with verified sources and clear licensing. Filter by region, language, and verification to get what you need.
        </p>
      </div>

      <form
        className="mb-8 grid gap-3 rounded-2xl border p-4 md:grid-cols-[2fr_2fr_1fr] md:items-end"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        method="get"
        role="search"
        aria-label="Filter news"
        data-cy="news-filters"
      >
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
            Date range
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                name="start"
                defaultValue={resolved?.start}
                className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
                data-cy="filter-start"
              />
              <input
                type="date"
                name="end"
                defaultValue={resolved?.end}
                className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}
                data-cy="filter-end"
              />
            </div>
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
              <option value="updated">Recently updated</option>
              <option value="trending">Trending</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
            Search news desk
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search headlines, sources, tags"
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
        </div>

        <div className="flex flex-wrap items-center gap-3 md:col-span-3">
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:-translate-y-0.5"
            data-cy="filters-apply"
          >
            Apply filters
          </button>
          <Link
            href="/news"
            className="text-xs font-semibold uppercase tracking-[0.18em] underline"
            style={{ color: 'var(--forest)' }}
            data-cy="filters-reset"
          >
            Clear filters
          </Link>
          <span className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }} aria-live="polite">
            Showing {articles.length} of {totalCount} stories
          </span>
        </div>
      </form>

      <div className="space-y-4">
        {articles.map((item) => (
          <article
            key={item.id}
            className="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            data-cy="news-card"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-5">
              {item.coverImage && (
                <div className="overflow-hidden rounded-xl border md:w-64" style={{ borderColor: 'var(--border)' }}>
                  <Link href={`/news/articles/${item.slug}`} aria-label={item.title}>
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      width={640}
                      height={360}
                      className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                      sizes="(min-width: 1024px) 420px, 100vw"
                      priority={false}
                    />
                  </Link>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  <span>{formatDate(item.publishedAt ?? item.createdAt)}</span>
                  {formatUpdated(item.publishedAt, item.updatedAt) && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b91c1c' }}>
                      Updated
                    </span>
                  )}
                  <span style={{ color: 'var(--forest)' }}>News</span>
                  <span>{readTime(item.content)}</span>
                  {item.locale && <span>{item.locale.toUpperCase()}</span>}
                  {item.countryCode && <span>{item.countryCode}</span>}
                </div>
                <h2 className="text-2xl font-bold leading-tight transition hover:text-[var(--forest)]" style={{ color: 'var(--forest)' }}>
                  <Link href={`/news/articles/${item.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]">
                    {item.title}
                  </Link>
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                  {item.excerpt || `${item.content.slice(0, 160)}…`}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
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
                  <Link
                    href={`/transparency?article=${item.slug}`}
                    className="underline"
                    aria-label="View transparency log"
                  >
                    Transparency
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    dataCy="card-license"
                  />
                </div>

                <SourcesDisclosure
                  sources={item.sources as unknown}
                  fallbackName={item.source?.name ?? null}
                  fallbackUrl={item.sourceUrl ?? item.source?.homepageUrl ?? null}
                  reliability={item.sourceReliability ?? null}
                  dataCy="card-sources"
                />

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1" aria-label="Tags">
                    {item.tags.slice(0, 4).map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/news?tag=${tag.slug}`}
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

                <div className="pt-2">
                  <NewsCardActions
                    url={`${siteUrl}/news/articles/${item.slug}`}
                    title={item.title}
                    sourceName={item.source?.name ?? undefined}
                    dataCy="card-actions"
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
        {articles.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
            data-cy="news-empty"
          >
            No results. Try clearing filters, widening the date range, or checking another region. You can also follow a tag to be notified when it updates.
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Link
            href={`/news?${new URLSearchParams({ ...Object.fromEntries(queryWithoutPage.entries()), page: String(page + 1) }).toString()}`}
            className="rounded-full bg-[var(--forest)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest)]"
            aria-label="Load more news"
            data-cy="load-more"
          >
            Load more
          </Link>
        </div>
      )}
    </main>
  );
}
