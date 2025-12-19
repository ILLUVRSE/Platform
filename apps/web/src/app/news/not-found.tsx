import Link from 'next/link';
import prisma from '@news/lib/prisma';

export default async function NotFound() {
  let recent: { slug: string; title: string }[] = [];
  try {
    recent = await prisma.article.findMany({
      where: { published: true, status: 'published', publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
      take: 4,
      select: { slug: true, title: true },
    });
  } catch {
    recent = [];
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-slate-100">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] px-10 py-12 shadow-[0_20px_80px_-60px_rgba(0,0,0,0.9)]">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">404</p>
        <h1 className="mt-3 text-3xl font-black">Page not found</h1>
        <p className="mt-2 text-sm text-slate-300">
          The link might be broken or the page moved. Here&apos;s fresh reading while you&apos;re here.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/news"
            className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-200/30"
          >
            Go home
          </Link>
        </div>
        {recent.length > 0 && (
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            {recent.map((item) => (
              <Link
                key={item.slug}
                href={`/news/articles/${item.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:-translate-y-0.5"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-amber-100/80">Recent</p>
                <p className="mt-1 text-sm font-semibold text-white group-hover:opacity-80">{item.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
