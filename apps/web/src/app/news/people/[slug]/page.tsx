import prisma from '@news/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const person = await prisma.person.findUnique({ where: { slug: params.slug } });
  if (!person) return { title: 'Profile not found • ILLUVRSE News' };
  const description = person.bio || `${person.name} profile on ILLUVRSE News.`;
  return {
    title: `${person.name} • ILLUVRSE News`,
    description,
    openGraph: {
      title: `${person.name} • ILLUVRSE News`,
      description,
    },
    twitter: {
      card: 'summary',
      title: `${person.name} • ILLUVRSE News`,
      description,
    },
  };
}

export default async function PersonPage({ params }: { params: { slug: string } }) {
  const person = await prisma.person.findUnique({
    where: { slug: params.slug },
    include: {
      credits: {
        include: { title: true },
      },
    },
  });

  if (!person) {
    notFound();
  }

  return (
    <main
      className="mx-auto min-h-screen max-w-5xl px-4 py-12"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <div className="grid gap-8 md:grid-cols-[200px,1fr]">
        <div className="h-48 w-full rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }} />
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
            Profile
          </p>
          <h1 className="text-4xl font-black" style={{ color: 'var(--forest)' }}>
            {person.name}
          </h1>
          <p className="text-sm leading-7" style={{ color: 'var(--text)' }}>
            {person.bio || 'No bio yet.'}
          </p>
          {person.birthDate && (
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              Born {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(person.birthDate))}
            </p>
          )}
        </div>
      </div>

      <section
        className="mt-10 rounded-2xl border p-6 shadow-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--muted)' }}>
          Credits
        </h2>
        <div className="mt-4 space-y-3">
          {person.credits.map((credit) => (
            <div
              key={credit.id}
              className="flex items-center justify-between rounded-xl border px-4 py-3"
              style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                  {credit.title.name}
                </p>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  {credit.role}
                  {credit.character ? ` • ${credit.character}` : ''}
                </p>
              </div>
              <Link
                href={`/titles/${credit.title.slug}`}
                className="text-xs uppercase tracking-[0.18em]"
                style={{ color: 'var(--forest)' }}
              >
                View title
              </Link>
            </div>
          ))}
          {person.credits.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No credits yet. Add titles and connect roles from the admin.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
