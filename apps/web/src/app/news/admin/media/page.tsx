/* eslint-disable @next/next/no-img-element */
import { createMedia } from '@news/lib/actions';
import prisma from '@news/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const createMediaAction = async (formData: FormData) => {
    'use server';
    await createMedia(undefined, formData);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Admin</p>
          <h1 className="text-3xl font-black text-white">Media Library</h1>
          <p className="text-sm text-slate-400">
            Paste remote image URLs to keep a reusable list. Full uploads can be added later.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <form action={createMediaAction} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-lg font-semibold text-white">Add media</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400" htmlFor="title">
                Label
              </label>
              <input
                id="title"
                name="title"
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400" htmlFor="url">
                Image URL
              </label>
              <input
                id="url"
                name="url"
                type="url"
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <button className="mt-3 w-full rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:-translate-y-0.5">
              Save
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Library</h2>
          <div className="mt-4 space-y-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
              >
                <div className="h-12 w-16 overflow-hidden rounded-lg bg-white/5">
                  <img src={asset.url} alt={asset.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{asset.title}</p>
                  <p className="text-xs text-slate-400 truncate">{asset.url}</p>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <p className="text-sm text-slate-400">No media yet. Add a URL to get started.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
