import { updateArticleStatus } from '@news/lib/actions';
import prisma from '@news/lib/prisma';
import Link from 'next/link';
import DeleteForm from './delete-form';

export const dynamic = 'force-dynamic';

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: true },
    take: 50,
  });
  const updateStatusAction = async (formData: FormData) => {
    'use server';
    await updateArticleStatus(undefined, formData);
  };

  const formatDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat('en', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date(date))
      : '—';

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
            Articles
          </h1>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full border-collapse text-sm">
          <thead
            className="text-left uppercase tracking-[0.16em]"
            style={{ background: 'var(--panel)', color: 'var(--muted)' }}
          >
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="font-semibold" style={{ color: 'var(--forest)' }}>
                    {article.title}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>
                    {article.slug}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ border: `1px solid var(--border)`, background: 'var(--panel)', color: 'var(--forest)' }}
                  >
                    {article.status}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>
                  {article.author?.name ?? '—'}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>
                  {formatDate(article.publishedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <form action={updateStatusAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="articleId" value={article.id} />
                      <select
                        name="status"
                        defaultValue={article.status}
                        className="rounded-lg px-2 py-1 text-xs outline-none"
                        style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--text)' }}
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="published">Published</option>
                      </select>
                      <input
                        type="datetime-local"
                        name="scheduledFor"
                        className="rounded-lg px-2 py-1 text-xs outline-none"
                        style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--text)' }}
                        defaultValue={
                          article.scheduledFor
                            ? new Date(article.scheduledFor).toISOString().slice(0, 16)
                            : ''
                        }
                      />
                      <button
                        type="submit"
                        className="rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition"
                        style={{ background: 'var(--sage)', color: '#fff' }}
                      >
                        Save
                      </button>
                    </form>
                    <Link
                      href={`/news/articles/${article.slug}`}
                      className="text-xs uppercase tracking-[0.18em]"
                      style={{ color: 'var(--forest)' }}
                    >
                      View
                    </Link>
                    <Link
                      href={`/news/admin/articles/${article.slug}/edit`}
                      className="text-xs uppercase tracking-[0.18em]"
                      style={{ color: 'var(--forest)' }}
                    >
                      Edit
                    </Link>
                    <DeleteForm id={article.id} />
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center" style={{ color: 'var(--muted)' }}>
                  No articles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
