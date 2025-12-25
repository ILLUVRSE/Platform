/* eslint-disable @next/next/no-img-element */
import { createVideo, deleteVideo } from '@news/lib/actions';
import prisma from '@news/lib/prisma';
import { sportsAthletes, sportsLeagues, sportsTeams } from '@news/lib/sports-data';

export const dynamic = 'force-dynamic';

export default async function AdminVideosPage() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const createVideoAction = async (formData: FormData) => {
    'use server';
    await createVideo(undefined, formData);
  };
  const deleteVideoAction = async (formData: FormData) => {
    'use server';
    await deleteVideo(formData);
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
            Videos
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Add live streams or on-demand videos with HLS/MP4 URLs and thumbnails.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[360px,1fr]">
        <form
          action={createVideoAction}
          className="rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--forest)' }}>
            Add video
          </h2>
          <div className="mt-4 space-y-3">
            <Field label="Title" name="title" />
            <Field label="Slug" name="slug" />
            <Field label="Description" name="description" textarea />
            <Field label="Thumbnail URL" name="thumbnail" />
            <Field label="HLS URL (.m3u8)" name="hlsUrl" />
            <Field label="MP4 URL (fallback)" name="mp4Url" />
            <Field label="Live URL (if live stream)" name="liveUrl" />
            <Field
              label="Tags (comma separated)"
              name="tags"
              list="sports-tags"
              hint="Use league, team, and athlete tags to power Sports filters."
            />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="live" name="live" className="accent-[var(--forest)]" />
              <label htmlFor="live" className="text-sm" style={{ color: 'var(--forest)' }}>
                Live stream
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="published" name="published" className="accent-[var(--forest)]" defaultChecked />
              <label htmlFor="published" className="text-sm" style={{ color: 'var(--forest)' }}>
                Published
              </label>
            </div>
            <button
              type="submit"
              className="w-full rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ background: 'var(--sage)', color: '#fff' }}
            >
              Save
            </button>
            <datalist id="sports-tags">
              {sportsLeagues.map((league) => (
                <option key={league.id} value={league.tag} />
              ))}
              {sportsTeams.map((team) => (
                <option key={team.id} value={team.tag} />
              ))}
              {sportsAthletes.map((athlete) => (
                <option key={athlete.id} value={athlete.tag} />
              ))}
            </datalist>
          </div>
        </form>

        <div
          className="rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--forest)' }}>
            Library
          </h2>
          <div className="mt-4 space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
              >
                {video.thumbnail && (
                  <div className="h-14 w-20 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                    <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                    {video.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {video.live ? 'Live' : 'On Demand'} • {video.slug}
                  </p>
                </div>
                <form action={deleteVideoAction}>
                  <input type="hidden" name="videoId" value={video.id} />
                  <button className="text-xs uppercase tracking-[0.18em]" style={{ color: '#dc2626' }}>
                    Delete
                  </button>
                </form>
              </div>
            ))}
            {videos.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No videos yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  textarea,
  list,
  hint,
}: {
  label: string;
  name: string;
  textarea?: boolean;
  list?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          name={name}
          rows={2}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
        />
      ) : (
        <input
          name={name}
          list={list}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
        />
      )}
      {hint && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
