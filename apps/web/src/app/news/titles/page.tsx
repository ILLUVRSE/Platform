import prisma from '@news/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Titles • ILLUVRSE News',
  description: 'Shows, games, and franchises with quick info and links to full profiles.',
};

export default async function TitlesIndexPage() {
  const titles = await prisma.title.findMany({
    orderBy: { releaseDate: 'desc' },
    take: 50,
  });

  const formatDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(date))
      : 'TBA';

  return (
    <main
      className="mx-auto min-h-screen max-w-6xl px-4 py-12"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
          Database
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
          Titles
        </h1>
        <p className="mt-3" style={{ color: 'var(--text)' }}>
          Shows, games, and franchises with quick info and links out to full profiles.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {titles.map((title) => (
          <Link
            key={title.id}
            href={`/titles/${title.slug}`}
            className="group overflow-hidden rounded-2xl border shadow-sm transition"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          >
            {title.posterUrl && (
              <div className="relative h-56 w-full overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
                <Image
                  src={title.posterUrl}
                  alt={title.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(min-width: 1024px) 400px, 100vw"
                />
              </div>
            )}
            <div className="p-4 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                {title.type || 'Title'} • {formatDate(title.releaseDate)}
              </p>
              <h2 className="text-xl font-semibold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
                {title.name}
              </h2>
              <p className="text-sm line-clamp-2" style={{ color: 'var(--text)' }}>
                {title.description || 'No description yet.'}
              </p>
              {title.genres && (
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  {title.genres}
                </p>
              )}
              {title.whereToWatch && (
                <p className="text-xs" style={{ color: 'var(--forest)' }}>
                  {title.whereToWatch}
                </p>
              )}
            </div>
          </Link>
        ))}
        {titles.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
          >
            No titles yet. Add some via seed or Prisma studio.
          </div>
        )}
      </div>
    </main>
  );
}
