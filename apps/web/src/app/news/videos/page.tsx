import Image from 'next/image';
import Link from 'next/link';
import { Prisma } from '@illuvrse/db';
import prisma from '@news/lib/prisma';

export const revalidate = 60;
const pageSize = 12;
const days = (n: number) => n * 24 * 60 * 60 * 1000;
const NOW = Date.now();

const formatDate = (date: Date | null) =>
  date ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date) : 'New';

const extractTags = (videos: { tags: string | null }[]) =>
  Array.from(
    new Set(
      videos
        .flatMap((video) => (video.tags ? video.tags.split(',') : []))
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

export default async function VideosPage({
  searchParams,
}: {
  searchParams?: Promise<{ tag?: string; range?: string; page?: string; region?: string }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const tagFilter = resolved?.tag ? decodeURIComponent(resolved.tag) : undefined;
  const rangeDays = resolved?.range ? Number(resolved.range) || undefined : undefined;
  const page = Math.max(1, resolved?.page ? Number(resolved.page) || 1 : 1);
  const skip = (page - 1) * pageSize;
  const now = NOW;
  const regionParam = resolved?.region?.toUpperCase() || 'WORLD';

  const baseVodWhere: Prisma.VideoWhereInput = {
    live: false,
    published: true,
    ...(tagFilter
      ? {
          tags: {
            contains: tagFilter,
            mode: 'insensitive',
          },
        }
      : {}),
    ...(rangeDays
      ? {
          publishedAt: {
            gte: new Date(now - days(rangeDays)),
          },
        }
      : {}),
  };

  const recentCutoff = new Date(now - days(45));
  const recentWhere: Prisma.VideoWhereInput = {
    ...baseVodWhere,
    ...(baseVodWhere.publishedAt ? { publishedAt: baseVodWhere.publishedAt } : { publishedAt: { gte: recentCutoff } }),
  };

  const [live, vods, totalVodCount, recentCount, tagUniverse] = await Promise.all([
    prisma.video.findMany({
      where: {
        live: true,
        published: true,
        ...(regionParam && regionParam !== 'WORLD' ? { countryCode: regionParam } : {}),
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.video.findMany({
      where: baseVodWhere,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.video.count({ where: baseVodWhere }),
    prisma.video.count({ where: recentWhere }),
    prisma.video.findMany({ where: { published: true }, select: { tags: true }, take: 200 }),
  ]);

  const tags = extractTags(tagUniverse).slice(0, 12);
  const totalVideos = live.length + totalVodCount;
  const totalPages = Math.max(1, Math.ceil(totalVodCount / pageSize));
  const featuredVod = vods[0];
  const onDemand = featuredVod ? vods.slice(1) : vods;

  const currentSearch = new URLSearchParams();
  if (tagFilter) currentSearch.set('tag', tagFilter);
  if (rangeDays) currentSearch.set('range', String(rangeDays));
  if (page > 1) currentSearch.set('page', String(page));
  if (regionParam) currentSearch.set('region', regionParam);

  const buildQuery = (next: Partial<{ tag: string | undefined; range: number | undefined; page: number | undefined }>) => {
    const params = new URLSearchParams(currentSearch);
    if (next.tag !== undefined) {
      if (next.tag) {
        params.set('tag', next.tag);
      } else {
        params.delete('tag');
      }
    }
    if (next.range !== undefined) {
      if (next.range) {
        params.set('range', String(next.range));
      } else {
        params.delete('range');
      }
    }
    if (next.page !== undefined) {
      if (next.page > 1) {
        params.set('page', String(next.page));
      } else {
        params.delete('page');
      }
    } else {
      params.delete('page');
    }
    const query = params.toString();
    return query ? `?${query}` : '';
  };

  return (
    <main
      className="mx-auto min-h-screen max-w-6xl px-4 py-12"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <section
        className="relative overflow-hidden rounded-3xl border px-6 py-8 shadow-sm md:px-10"
        style={{
          borderColor: 'var(--border)',
          background: 'linear-gradient(135deg, #f7f3eb 0%, #e8f0ea 38%, #fce7de 100%)',
          color: 'var(--forest)',
          boxShadow: '0 18px 48px -28px rgba(62,95,80,0.35)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-16 -top-32 h-72 w-72 rounded-full bg-[#5b8f7b]/20 blur-3xl" />
          <div className="absolute right-[-120px] bottom-[-140px] h-80 w-80 rounded-full bg-[#ec5a48]/16 blur-3xl" />
        </div>
        <div className="relative grid gap-8 md:grid-cols-[2fr,1.1fr] md:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: 'var(--forest)' }}>Video Desk</span>
              <span className="rounded-full bg-[#ec5a48] px-2 py-[2px] text-white">Live & VOD</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl" style={{ color: 'var(--forest)' }}>
                ILLUVRSE Video
              </h1>
              <p className="max-w-2xl text-base md:text-lg" style={{ color: 'var(--text)' }}>
                Global public-access broadcasts, festival dispatches, deep-dive interviews, and specials captured for replay.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/news/live"
                className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:-translate-y-[2px]"
                style={{ borderColor: 'var(--forest)', background: 'rgba(62,95,80,0.1)', color: 'var(--forest)', boxShadow: '0 14px 38px -26px rgba(62,95,80,0.4)' }}
              >
                Open Live Stream
              </Link>
              <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.65)', color: 'var(--muted)' }}>
                Archive ready • {totalVideos} videos
              </span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                <span className="font-semibold" style={{ color: 'var(--forest)' }}>
                  Tags in rotation:
                </span>
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/videos${buildQuery({ tag, page: 1 })}`}
                    className="rounded-full border px-3 py-1 transition hover:-translate-y-0.5"
                    style={
                      tagFilter === tag
                        ? { borderColor: 'var(--sage)', background: 'rgba(91,143,123,0.12)', color: 'var(--forest)' }
                        : { borderColor: 'var(--border)', background: 'rgba(255,255,255,0.65)', color: 'var(--text)' }
                    }
                  >
                    {tag}
                  </Link>
                ))}
                {(tagFilter || rangeDays || regionParam !== 'WORLD') && (
                  <Link
                    href="/news/videos"
                    className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.65)', color: 'var(--muted)' }}
                  >
                    Clear filters
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="grid gap-3 rounded-2xl border bg-white/50 p-4 backdrop-blur" style={{ borderColor: 'var(--border)' }}>
            <StatBlock label="Live right now" value={live.length} accent="#ec5a48" />
            <div className="grid gap-3 sm:grid-cols-2">
              <StatBlock label="On-demand" value={totalVodCount} accent="#3e5f50" subtle />
              <StatBlock label="New this month" value={recentCount} accent="#5b8f7b" subtle />
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3 text-xs uppercase tracking-[0.2em]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <span>Archive</span>
              <span className="rounded-full bg-[#3e5f50] px-3 py-1 text-white">
                {totalVideos} videos
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-white/60 px-4 py-3 text-xs uppercase tracking-[0.2em]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--forest)' }}>
          Filter:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span>Date</span>
          {[30, 90, 365].map((range) => (
            <Link
              key={range}
              href={`/videos${buildQuery({ range, page: 1 })}`}
              className="rounded-full border px-3 py-1 transition"
              style={
                rangeDays === range
                  ? { borderColor: 'var(--sage)', background: 'rgba(91,143,123,0.12)', color: 'var(--forest)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              Last {range}d
            </Link>
          ))}
          <Link
            href={`/videos${buildQuery({ range: undefined, page: 1 })}`}
            className="rounded-full border px-3 py-1 transition"
            style={
              !rangeDays
                ? { borderColor: 'var(--sage)', background: 'rgba(91,143,123,0.12)', color: 'var(--forest)' }
                : { borderColor: 'var(--border)', color: 'var(--text)' }
            }
          >
            All time
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--forest)' }}>
          <span>Page {page}</span>
          <span style={{ color: 'var(--muted)' }}>/ {totalPages}</span>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
        <form action="/videos" method="GET" className="flex flex-wrap items-center gap-3">
          {tagFilter && <input type="hidden" name="tag" value={tagFilter} />}
          {rangeDays && <input type="hidden" name="range" value={rangeDays} />}
          <input type="hidden" name="page" value="1" />
          <label className="flex items-center gap-2">
            <span>Region</span>
            <select
              defaultValue={regionParam}
              name="region"
              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--forest)' }}
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
          <button
            type="submit"
            className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-[1px]"
            style={{ borderColor: 'var(--forest)', color: 'var(--forest)', background: 'rgba(62,95,80,0.08)' }}
          >
            Apply
          </button>
        </form>
      </section>

      <section className="mt-10 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
              Broadcast
            </p>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
              Live Now
            </h2>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-[#ec5a48] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white sm:inline-flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            Streaming
          </span>
        </div>
        {live.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {live.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.slug}`}
                className="group relative overflow-hidden rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-[3px] hover:shadow-lg"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
              >
                {video.thumbnail && (
                  <div className="relative h-56 w-full overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      priority
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-[#ec5a48] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm">
                      <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-white" />
                      Live
                    </span>
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                    <span>Happening now</span>
                    <span className="rounded-full bg-[#ec5a48]/10 px-2 py-[3px] font-semibold" style={{ color: '#b42318' }}>
                      Tap to watch
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--forest)' }}>
                    {video.title}
                  </h3>
                  <p className="text-sm leading-6 line-clamp-2" style={{ color: 'var(--text)' }}>
                    {video.description || 'Live stream in progress.'}
                  </p>
                  {video.tags && (
                    <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                      {video.tags}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm shadow-sm md:flex md:items-center md:justify-between" style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}>
            <div className="space-y-1">
              <p className="text-base font-semibold" style={{ color: 'var(--forest)' }}>
                No live broadcasts right now.
              </p>
              <p>Check back soon or head to Live Stream for continuous feeds.</p>
            </div>
            <Link
              href="/news/live"
              className="mt-3 inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:-translate-y-[2px] md:mt-0"
              style={{ borderColor: 'var(--forest)', color: 'var(--forest)', background: 'rgba(62,95,80,0.08)' }}
            >
              Go to Live Stream →
            </Link>
          </div>
        )}
      </section>

      <section id="on-demand" className="mt-12 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
              Library
            </p>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
              On Demand
            </h2>
          </div>
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
            {totalVodCount} available to stream
          </span>
        </div>

        {featuredVod && (
          <Link
            href={`/videos/${featuredVod.slug}`}
            className="group relative grid overflow-hidden rounded-3xl border shadow-sm transition duration-200 hover:-translate-y-[3px] hover:shadow-lg lg:grid-cols-[1.1fr,0.9fr]"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          >
            {featuredVod.thumbnail && (
              <div className="relative h-64 w-full overflow-hidden border-b lg:h-full lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--border)' }}>
                <Image
                  src={featuredVod.thumbnail}
                  alt={featuredVod.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
                  <span className="h-2 w-2 rounded-full bg-[#3e5f50]" />
                  Feature pick
                </div>
              </div>
            )}
            <div className="flex flex-col justify-center space-y-3 px-6 py-5">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                <span>Latest drop</span>
                {featuredVod.publishedAt && (
                  <span className="rounded-full bg-white px-3 py-[3px] font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--forest)' }}>
                    {formatDate(featuredVod.publishedAt)}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-semibold leading-tight group-hover:opacity-85" style={{ color: 'var(--forest)' }}>
                {featuredVod.title}
              </h3>
              <p className="text-sm leading-7 line-clamp-3" style={{ color: 'var(--text)' }}>
                {featuredVod.description || 'Watch now.'}
              </p>
              {featuredVod.tags && (
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  {featuredVod.tags}
                </p>
              )}
            </div>
          </Link>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {onDemand.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.slug}`}
              className="group overflow-hidden rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-[2px] hover:shadow-md"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            >
              {video.thumbnail && (
                <div className="relative h-44 w-full overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  {video.publishedAt && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)', border: '1px solid var(--border)' }}>
                      {formatDate(video.publishedAt)}
                    </span>
                  )}
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
                  {video.title}
                </h3>
                <p className="text-sm leading-6 line-clamp-2" style={{ color: 'var(--text)' }}>
                  {video.description || 'Watch now.'}
                </p>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  <span>{video.tags || 'Illuvrse Video'}</span>
                  <span className="rounded-full bg-white px-2 py-[3px]" style={{ border: '1px solid var(--border)', color: 'var(--forest)' }}>
                    Play
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {onDemand.length === 0 && (
            <div
              className="rounded-2xl border p-6 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
            >
              No videos yet. Add some in Admin → Videos or clear filters.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border bg-white/60 px-4 py-3 text-xs uppercase tracking-[0.2em]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <Link
              aria-disabled={page === 1}
              href={`/videos${buildQuery({ page: Math.max(1, page - 1) })}`}
              className="rounded-full border px-4 py-2 font-semibold transition disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--forest)', pointerEvents: page === 1 ? 'none' : 'auto', opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Prev
            </Link>
            <span>
              Page {page} of {totalPages}
            </span>
            <Link
              aria-disabled={page >= totalPages}
              href={`/videos${buildQuery({ page: Math.min(totalPages, page + 1) })}`}
              className="rounded-full border px-4 py-2 font-semibold transition disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--forest)', pointerEvents: page >= totalPages ? 'none' : 'auto', opacity: page >= totalPages ? 0.4 : 1 }}
            >
              Next →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function StatBlock({ label, value, accent, subtle }: { label: string; value: number; accent: string; subtle?: boolean }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border px-4 py-3"
      style={{
        borderColor: 'var(--border)',
        background: subtle ? 'rgba(255,255,255,0.8)' : 'rgba(236,90,72,0.08)',
        color: 'var(--text)',
      }}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
        <p className="text-xl font-semibold" style={{ color: 'var(--forest)' }}>
          {value}
        </p>
      </div>
      <span className="h-9 w-9 rounded-full" style={{ background: accent, boxShadow: '0 12px 26px -18px rgba(62,95,80,0.8)' }} />
    </div>
  );
}
