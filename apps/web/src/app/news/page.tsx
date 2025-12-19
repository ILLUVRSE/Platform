import Link from 'next/link';
import type { Prisma } from '@illuvrse/db';
import Script from 'next/script';
import prisma from '@news/lib/prisma';
import { HeroSpotlight, TagChip, ArticleCard as UiArticleCard, ChannelGrid } from '@news/components/ui';

type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: { author: true; tags: true; source: true } }>;

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ tag?: string; region?: string; lang?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : { tag: undefined };
  const selectedTag = resolvedParams?.tag;
  const regionParam = resolvedParams?.region?.toUpperCase() || "WORLD";
  const langParam = resolvedParams?.lang || undefined;

  const [articles, topTags, spotlightPeople, spotlightTitles, videos] = await Promise.all([
    prisma.article.findMany({
      where: {
        published: true,
        status: 'published',
        publishedAt: {
          lte: new Date(),
        },
        ...(regionParam && regionParam !== "WORLD"
          ? {
              countryCode: regionParam,
            }
          : {}),
        ...(langParam
          ? {
              OR: [{ locale: langParam }, { locale: { startsWith: `${langParam}-` } }],
            }
          : {}),
        ...(selectedTag
          ? {
              tags: {
                some: {
                  slug: selectedTag,
                },
              },
            }
          : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: 30,
      include: { author: true, tags: true, source: true },
    }),
    prisma.tag.findMany({
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
      take: 8,
      include: {
        _count: {
          select: { articles: true },
        },
      },
    }),
    prisma.person.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { credits: true },
    }),
    prisma.title.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 6,
      include: { credits: true },
    }),
    prisma.video.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    }),
  ]);

  const [featured, ...rest] = articles;
  const hasTag = (a: ArticleWithRelations, slug: string) =>
    a.tags.some((t) => t.slug.toLowerCase() === slug.toLowerCase());
  const getTimestamp = (article: ArticleWithRelations) =>
    (article.publishedAt ?? article.createdAt).getTime();
  const getReadTime = (article: ArticleWithRelations) => {
    const words = article.content?.split(/\s+/).length || 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min`;
  };

  const trending = rest
    .map((a) => ({ ...a, tagScore: a.tags.length }))
    .sort((a, b) => b.tagScore - a.tagScore || getTimestamp(b) - getTimestamp(a))
    .slice(0, 4);

  const news = articles.filter((a) => hasTag(a, 'news')).slice(0, 6);
  const features = articles.filter((a) => hasTag(a, 'feature')).slice(0, 6);
  const latest = rest.slice(0, 9);
  const now = new Date();
  const newThisWeek = articles.filter((a) => {
    const diff = now.getTime() - new Date(a.publishedAt ?? a.createdAt).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  });

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(date),
    );

  const getExcerpt = (article: ArticleWithRelations) => {
    if (article.excerpt) return article.excerpt;
    return article.content.length > 200
      ? `${article.content.substring(0, 200)}…`
      : article.content;
  };

  const channelRows =
    videos.length > 0
      ? [
          {
            title: 'Watch',
            ctaLabel: 'All video',
            ctaHref: '/news/videos',
            items: videos.map((video) => ({
              title: video.title,
              href: `/news/videos/${video.slug}`,
              thumbnail: video.thumbnail ?? undefined,
              live: Boolean(video.live),
              meta: video.live ? 'Live stream' : 'Video',
              description: video.description ?? undefined,
            })),
          },
        ]
      : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const heroTags = topTags.slice(0, 5);
  const structuredData =
    featured && {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: featured.title,
      description: getExcerpt(featured),
      datePublished: (featured.publishedAt ?? featured.createdAt).toISOString(),
      author: {
        '@type': 'Person',
        name: featured.author?.name ?? 'ILLUVRSE Staff',
      },
      inLanguage: featured.locale ?? langParam ?? 'en',
      isAccessibleForFree: true,
      image: featured.coverImage,
      license: featured.license ?? 'https://creativecommons.org/licenses/by/4.0/',
      url: `${siteUrl}/news/articles/${featured.slug}`,
      mainEntityOfPage: `${siteUrl}/news/articles/${featured.slug}`,
    };

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-cream)', color: 'var(--text)' }}>
      {structuredData && (
        <Script
          id="structured-data-article"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <section className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-10 md:pt-14">
        <HeroSpotlight
          eyebrow="Today on ILLUVRSE"
          title={featured?.title ?? 'Global Public Access News Network'}
          kicker={
            featured
              ? undefined
              : 'Curated dispatches, features, lists, and a culture database with sources you trust.'
          }
          summary={featured ? getExcerpt(featured) : undefined}
          imageUrl={featured?.coverImage ?? undefined}
          imageAlt={featured?.title ?? undefined}
          tags={heroTags.map((tag) => ({
            label: `${tag.name}`,
            href: `/?tag=${tag.slug}`,
            count: tag._count.articles,
            hideCount: true,
          }))}
          primaryAction={{
            label: featured ? 'Read Spotlight' : 'Browse News',
            href: featured ? `/news/articles/${featured.slug}` : '/news',
          }}
          secondaryAction={{ label: 'Search', href: '/search' }}
          meta={
            featured && (
              <span
                className="text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--white)' }}
              >
                {formatDate(featured.publishedAt ?? featured.createdAt)}
              </span>
            )
          }
          author={featured?.author?.name ?? 'ILLUVRSE Staff'}
          dateLabel={featured ? formatDate(featured.publishedAt ?? featured.createdAt) : undefined}
          readTime={featured ? `${getReadTime(featured)} read` : undefined}
          reliability={featured?.sourceReliability ?? null}
          license={featured?.license ?? null}
          sourceName={featured?.source?.name ?? null}
          sourceUrl={featured?.sourceUrl ?? null}
          regionLabel={regionParam === 'WORLD' ? 'World' : regionParam}
          languageLabel={langParam ? langParam.toUpperCase() : featured?.locale ?? undefined}
          shareUrl={featured ? `${siteUrl}/news/articles/${featured.slug}` : `${siteUrl}/news`}
        />

        {topTags.length > 0 && (
          <div
            className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-full border px-3 py-2 md:rounded-2xl"
            style={{ borderColor: 'var(--border)', background: 'rgba(247,243,235,0.92)' }}
            aria-label="Filter stories by tag"
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--muted)' }}
            >
              Filter by tag:
            </p>
            <TagChip label="All" href="/news" active={!selectedTag} dataCy="tag-all" />
            {heroTags.map((tag) => (
              <TagChip
                key={tag.slug}
                label={tag.name}
                count={tag._count.articles}
                hideCount
                ariaLabel={`${tag.name}, ${tag._count.articles} stories`}
                href={`/?tag=${tag.slug}`}
                active={selectedTag === tag.slug}
                dataCy={`tag-${tag.slug}`}
              />
            ))}
            {topTags.length > heroTags.length && (
              <TagChip label="More tags" href="/news/search#tags" muted ariaLabel="See more tags" dataCy="tag-more" />
            )}
          </div>
        )}

        <Section title="Trending" cta={{ label: 'Explore all', href: '/search' }}>
          <div className="grid gap-4 md:grid-cols-4">
            {trending.map((article) => (
              <UiArticleCard
                key={article.id}
                title={article.title}
                href={`/news/articles/${article.slug}`}
                excerpt={getExcerpt(article)}
                dateLabel={formatDate(article.publishedAt ?? article.createdAt)}
                author={article.author?.name ?? 'ILLUVRSE Staff'}
                readTime={`${getReadTime(article)} read`}
                imageUrl={article.coverImage ?? undefined}
                license={article.license}
                reliability={article.sourceReliability}
                tags={article.tags.slice(0, 3).map((tag) => ({
                  label: tag.name,
                  href: `/?tag=${tag.slug}`,
                }))}
              />
            ))}
            {trending.length === 0 && <EmptyState message="Nothing trending yet." />}
          </div>
        </Section>

        <div className="grid gap-8 md:grid-cols-2">
          <Section title="News" cta={{ label: 'Open news', href: '/news' }}>
            <div className="grid gap-4">
              {news.map((article) => (
                <UiArticleCard
                  key={article.id}
                title={article.title}
                href={`/news/articles/${article.slug}`}
                excerpt={getExcerpt(article)}
                dateLabel={formatDate(article.publishedAt ?? article.createdAt)}
                author={article.author?.name ?? 'ILLUVRSE Staff'}
                readTime={`${getReadTime(article)} read`}
                imageUrl={article.coverImage ?? undefined}
                license={article.license}
                reliability={article.sourceReliability}
                layout="horizontal"
                tags={article.tags.slice(0, 3).map((tag) => ({
                  label: tag.name,
                  href: `/?tag=${tag.slug}`,
                }))}
                />
              ))}
              {news.length === 0 && <EmptyState message="No news yet. Publish one!" />}
            </div>
          </Section>

          <Section title="Features" cta={{ label: 'Open features', href: '/features' }}>
            <div className="grid gap-4">
              {features.map((article) => (
                <UiArticleCard
                  key={article.id}
                title={article.title}
                href={`/news/articles/${article.slug}`}
                excerpt={getExcerpt(article)}
                dateLabel={formatDate(article.publishedAt ?? article.createdAt)}
                author={article.author?.name ?? 'ILLUVRSE Staff'}
                readTime={`${getReadTime(article)} read`}
                imageUrl={article.coverImage ?? undefined}
                license={article.license}
                reliability={article.sourceReliability}
                layout="horizontal"
                tags={article.tags.slice(0, 3).map((tag) => ({
                  label: tag.name,
                  href: `/?tag=${tag.slug}`,
                }))}
                />
              ))}
              {features.length === 0 && <EmptyState message="No features yet. Publish one!" />}
            </div>
          </Section>
        </div>

        <Section title="Latest">
          <div className="grid gap-4 md:grid-cols-3">
            {latest.map((article) => (
              <UiArticleCard
                key={article.id}
                title={article.title}
                href={`/news/articles/${article.slug}`}
                excerpt={getExcerpt(article)}
                dateLabel={formatDate(article.publishedAt ?? article.createdAt)}
                author={article.author?.name ?? 'ILLUVRSE Staff'}
                readTime={`${getReadTime(article)} read`}
                imageUrl={article.coverImage ?? undefined}
                tags={article.tags.slice(0, 3).map((tag) => ({
                  label: tag.name,
                  href: `/?tag=${tag.slug}`,
                }))}
              />
            ))}
            {latest.length === 0 && <EmptyState message="No stories yet." />}
          </div>
        </Section>

        <div className="grid gap-8 md:grid-cols-3">
          <Section title="New this week" subtle>
            <div className="space-y-3">
              {newThisWeek.map((article) => (
                <UiArticleCard
                  key={article.id}
                title={article.title}
                href={`/news/articles/${article.slug}`}
                excerpt={getExcerpt(article)}
                dateLabel={formatDate(article.publishedAt ?? article.createdAt)}
                author={article.author?.name ?? 'ILLUVRSE Staff'}
                readTime={`${getReadTime(article)} read`}
                layout="horizontal"
                showBorder={false}
                tags={article.tags.slice(0, 2).map((tag) => ({
                  label: tag.name,
                    href: `/?tag=${tag.slug}`,
                  }))}
                />
              ))}
              {newThisWeek.length === 0 && <EmptyState message="Publish something fresh." />}
            </div>
          </Section>

          <Section title="People" subtle>
            <div className="space-y-3">
              {spotlightPeople.map((person) => (
                <div
                  key={person.id}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                    {person.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {person.bio?.slice(0, 80) ?? 'No bio yet'}
                  </p>
                </div>
              ))}
              {spotlightPeople.length === 0 && <EmptyState message="No profiles yet." />}
            </div>
          </Section>

          <Section title="Titles" subtle>
            <div className="space-y-3">
              {spotlightTitles.map((title) => (
                <div
                  key={title.id}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                    {title.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {title.type} {title.releaseDate ? `• ${new Date(title.releaseDate).getFullYear()}` : ''}
                  </p>
                </div>
              ))}
              {spotlightTitles.length === 0 && <EmptyState message="No titles yet." />}
            </div>
          </Section>
        </div>

        {channelRows.length > 0 && (
          <div className="rounded-3xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
            <ChannelGrid rows={channelRows} />
          </div>
        )}
      </section>
    </main>
  );
}

function Section({
  title,
  children,
  cta,
  subtle,
}: {
  title: string;
  children: React.ReactNode;
  cta?: { label: string; href: string };
  subtle?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
          {title}
        </h2>
        {cta && (
          <Link href={cta.href} className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
            {cta.label}
          </Link>
        )}
      </div>
      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: 'var(--border)',
          background: subtle ? 'var(--panel)' : 'var(--panel)',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm" style={{ color: 'var(--muted)' }}>
      {message}
    </p>
  );
}
