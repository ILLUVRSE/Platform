import prisma from '@news/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; region?: string; lang?: string; verified?: string };
}) {
  const query = searchParams.q?.toString().trim() ?? '';
  const typeFilter = searchParams.type?.toString();
  const regionParam = searchParams.region?.toString().toUpperCase() || 'WORLD';
  const langParam = searchParams.lang?.toString() || undefined;
  const verifiedOnly = searchParams.verified === 'true';
  const wantsArticles = !typeFilter || typeFilter === 'articles';
  const wantsPeople = !typeFilter || typeFilter === 'people';
  const wantsTitles = !typeFilter || typeFilter === 'titles';

  const [articles, people, titles] = query
    ? await Promise.all([
        wantsArticles
          ? prisma.article.findMany({
            where: {
              published: true,
              status: 'published',
              ...(regionParam && regionParam !== 'WORLD' ? { countryCode: regionParam } : {}),
              ...(langParam
                ? {
                    OR: [{ locale: langParam }, { locale: { startsWith: `${langParam}-` } }],
                  }
                : {}),
              ...(verifiedOnly
                ? {
                    sourceReliability: { gte: 80 },
                  }
                : {}),
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
                { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
              ],
            },
            orderBy: [
              { sourceReliability: 'desc' },
              { publishedAt: 'desc' },
            ],
            take: 20,
            include: { author: true, tags: true },
          })
          : [],
        wantsPeople
          ? prisma.person.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { bio: { contains: query, mode: 'insensitive' } },
              ],
            },
            orderBy: { name: 'asc' },
            take: 10,
            include: { credits: { include: { title: true } } },
          })
          : [],
        wantsTitles
          ? prisma.title.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            orderBy: { name: 'asc' },
            take: 10,
            include: { credits: { include: { person: true } } },
          })
          : [],
      ])
    : [[], [], []];

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(date),
    );

  return (
    <main
      className="mx-auto min-h-screen max-w-5xl px-4 py-12"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
        Search
      </p>
      <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
        Search ILLUVRSE News
      </h1>
      <p className="mt-3" style={{ color: 'var(--text)' }}>
        Articles, people, and titles. More data sources will surface as the database fills in.
      </p>

      <form
        action="/search"
        className="mt-6 rounded-2xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <label className="sr-only" htmlFor="q">
          Search query
        </label>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Search by title, person, or keyword"
            className="w-full rounded-xl px-4 py-2 text-sm outline-none"
            style={{ background: 'var(--cream)', border: `1px solid var(--border)`, color: 'var(--text)' }}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
            {[
              { label: 'All', value: '' },
              { label: 'Articles', value: 'articles' },
              { label: 'People', value: 'people' },
              { label: 'Titles', value: 'titles' },
            ].map((option) => (
              <label
                key={option.label}
                className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1"
                style={{ border: `1px solid var(--border)`, background: option.value === typeFilter ? 'rgba(91,143,123,0.15)' : 'var(--cream)', color: 'var(--forest)' }}
              >
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  defaultChecked={option.value === (typeFilter ?? '')}
                  className="accent-[var(--forest)]"
                />
                {option.label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
            <label className="flex items-center gap-2">
              <span style={{ color: 'var(--muted)' }}>Region</span>
              <select
                name="region"
                defaultValue={regionParam}
                className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-cream,var(--cream))]"
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
            <label className="flex items-center gap-2">
              <span style={{ color: 'var(--muted)' }}>Lang</span>
              <select
                name="lang"
                defaultValue={langParam}
                className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-cream,var(--cream))]"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--forest)' }}
              >
                <option value="">Any</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="zh">中文</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-full px-3 py-1" style={{ border: `1px solid var(--border)`, background: verifiedOnly ? 'rgba(91,143,123,0.15)' : 'var(--cream)', color: 'var(--forest)' }}>
              <input type="checkbox" name="verified" value="true" defaultChecked={verifiedOnly} className="accent-[var(--forest)]" />
              Verified only
            </label>
          </div>
          <button
            className="rounded-xl px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition md:ml-auto"
            style={{ background: 'var(--sage)', color: '#fff', boxShadow: '0 10px 20px -12px rgba(62,95,80,0.4)' }}
          >
            Search
          </button>
        </div>
      </form>

      {query && (
        <div className="mt-6 space-y-6">
          <SectionTitle title="Articles" count={articles.length} />
          {articles.length === 0 && (
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
            >
              No articles for “{query}”.
            </div>
          )}
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/articles/${article.slug}`}
              className="group block rounded-2xl border p-5 transition"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            >
              <div
                className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--muted)' }}
              >
                <span>{formatDate(article.createdAt)}</span>
                <span style={{ color: 'var(--forest)' }}>Article</span>
              </div>
              <p className="mt-2 text-lg font-semibold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
                {article.title}
              </p>
              <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--text)' }}>
                {article.excerpt || article.content.substring(0, 140)}…
              </p>
              {article.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.18em]"
                      style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--forest)' }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}

          <SectionTitle title="People" count={people.length} />
          {people.length === 0 && (
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
            >
              No people for “{query}”.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.slug}`}
                className="group rounded-2xl border p-4 transition"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
              >
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  Person
                </p>
                <p className="text-lg font-semibold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
                  {person.name}
                </p>
                <p className="mt-1 text-sm line-clamp-2" style={{ color: 'var(--text)' }}>
                  {person.bio || '—'}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  {person.credits.length} credits
                </p>
              </Link>
            ))}
          </div>

          <SectionTitle title="Titles" count={titles.length} />
          {titles.length === 0 && (
            <div
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
            >
              No titles for “{query}”.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {titles.map((title) => (
              <Link
                key={title.id}
                href={`/titles/${title.slug}`}
                className="group rounded-2xl border p-4 transition"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
              >
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  {title.type || 'Title'}
                </p>
                <p className="text-lg font-semibold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
                  {title.name}
                </p>
                <p className="mt-1 text-sm line-clamp-2" style={{ color: 'var(--text)' }}>
                  {title.description || '—'}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  {title.credits.length} credits
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
        {title}
      </h2>
      <span className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
        {count}
      </span>
    </div>
  );
}
