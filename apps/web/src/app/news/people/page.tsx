import prisma from '@news/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'People • ILLUVRSE News',
  description: 'Cast, crew, and creators across the titles you cover.',
};

export default async function PeopleIndexPage() {
  const people = await prisma.person.findMany({
    orderBy: { name: 'asc' },
    take: 50,
    include: { credits: { include: { title: true } } },
  });

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
          People
        </h1>
        <p className="mt-3" style={{ color: 'var(--text)' }}>
          Cast, crew, and creators across the titles you cover. Click through for credits.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/people/${person.slug}`}
            className="group rounded-2xl border p-5 shadow-sm transition"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          >
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              {person.credits.length} credits
            </p>
            <h2 className="mt-1 text-xl font-semibold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
              {person.name}
            </h2>
            <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--text)' }}>
              {person.bio || 'No bio yet.'}
            </p>
            {person.credits.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {person.credits.slice(0, 3).map((credit) => (
                  <span
                    key={credit.id}
                    className="rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.16em]"
                    style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--forest)' }}
                  >
                    {credit.title?.name ?? 'Title'}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
        {people.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
          >
            No people yet. Add profiles and link credits from the admin.
          </div>
        )}
      </div>
    </main>
  );
}
