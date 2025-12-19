import prisma from '@news/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = await prisma.title.findUnique({ where: { slug: params.slug } });
  if (!title) return { title: 'Title not found • ILLUVRSE News' };
  const description = title.description || `Learn about ${title.name} on ILLUVRSE News.`;
  return {
    title: `${title.name} • ILLUVRSE News`,
    description,
    openGraph: {
      title: `${title.name} • ILLUVRSE News`,
      description,
      images: title.posterUrl ? [title.posterUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title.name} • ILLUVRSE News`,
      description,
      images: title.posterUrl ? [title.posterUrl] : undefined,
    },
  };
}

export default async function TitlePage({ params }: { params: { slug: string } }) {
  const title = await prisma.title.findUnique({
    where: { slug: params.slug },
    include: {
      credits: {
        include: { person: true },
      },
    },
  });

  if (!title) {
    notFound();
  }

  const formatDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(date))
      : 'TBA';

  return (
    <main
      className="mx-auto min-h-screen max-w-5xl px-4 py-12"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <div className="grid gap-8 md:grid-cols-[240px,1fr]">
        {title.posterUrl && (
          <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border)' }}>
            <Image
              src={title.posterUrl}
              alt={title.name}
              width={640}
              height={960}
              className="h-auto w-full object-cover"
              sizes="(min-width: 768px) 240px, 60vw"
            />
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
            {title.type || 'Title'} • {formatDate(title.releaseDate)}
          </p>
          <h1 className="text-4xl font-black leading-tight" style={{ color: 'var(--forest)' }}>
            {title.name}
          </h1>
          <p className="text-sm leading-7" style={{ color: 'var(--text)' }}>
            {title.description || 'No description yet.'}
          </p>
          {title.genres && (
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              {title.genres}
            </p>
          )}
          {title.whereToWatch && (
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--forest)' }}
            >
              Watch/Play: {title.whereToWatch}
            </div>
          )}
        </div>
      </div>

      <section
        className="mt-10 rounded-2xl border p-6 shadow-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--muted)' }}>
          Cast & Crew
        </h2>
        <div className="mt-4 space-y-3">
          {title.credits.map((credit) => (
            <div
              key={credit.id}
              className="flex items-center justify-between rounded-xl border px-4 py-3"
              style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                  {credit.person.name}
                </p>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  {credit.role}
                  {credit.character ? ` • ${credit.character}` : ''}
                </p>
              </div>
              <Link
                href={`/people/${credit.person.slug}`}
                className="text-xs uppercase tracking-[0.18em]"
                style={{ color: 'var(--forest)' }}
              >
                View profile
              </Link>
            </div>
          ))}
          {title.credits.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No credits yet. Add people and connect them to this title.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
