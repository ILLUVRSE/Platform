import { createCredit, deleteCredit } from '@news/lib/actions';
import prisma from '@news/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminCreditsPage() {
  const [people, titles, credits] = await Promise.all([
    prisma.person.findMany({ orderBy: { name: 'asc' } }),
    prisma.title.findMany({ orderBy: { name: 'asc' } }),
    prisma.credit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { person: true, title: true },
    }),
  ]);
  const createCreditAction = async (formData: FormData) => {
    'use server';
    await createCredit(undefined, formData);
  };
  const deleteCreditAction = async (formData: FormData) => {
    'use server';
    await deleteCredit(formData);
  };

  return (
    <main
      className="mx-auto max-w-6xl px-4 py-10"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
            Admin
          </p>
          <h1 className="text-3xl font-black" style={{ color: 'var(--forest)' }}>
            Credits
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Connect people to titles with roles and characters.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[360px,1fr]">
        <form
          action={createCreditAction}
          className="rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--forest)' }}>
            Add credit
          </h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                Person
              </label>
              <select
                name="personId"
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              >
                <option value="">Select person</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                Title
              </label>
              <select
                name="titleId"
                required
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              >
                <option value="">Select title</option>
                {titles.map((title) => (
                  <option key={title.id} value={title.id}>
                    {title.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                Role
              </label>
              <input
                name="role"
                required
                placeholder="Actor, Director, Writer…"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                Character (optional)
              </label>
              <input
                name="character"
                placeholder="Grogu, Eleven…"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                Notes (optional)
              </label>
              <textarea
                name="notes"
                rows={2}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ background: 'var(--sage)', color: '#fff' }}
            >
              Save credit
            </button>
          </div>
        </form>

        <div
          className="rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--forest)' }}>
            Recent credits
          </h2>
          <div className="mt-4 space-y-3">
            {credits.map((credit) => (
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
                  <p className="text-xs" style={{ color: 'var(--forest)' }}>
                    {credit.title.name}
                  </p>
                </div>
                <form action={deleteCreditAction}>
                  <input type="hidden" name="creditId" value={credit.id} />
                  <button className="text-xs uppercase tracking-[0.18em]" style={{ color: '#dc2626' }}>
                    Delete
                  </button>
                </form>
              </div>
            ))}
            {credits.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No credits yet. Add one to connect people and titles.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
