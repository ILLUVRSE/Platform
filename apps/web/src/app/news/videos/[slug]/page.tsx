import Link from 'next/link';
import prisma from '@news/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const video = await prisma.video.findUnique({ where: { slug: params.slug } });
  if (!video) return { title: 'Video not found • ILLUVRSE News' };
  const description = video.description || `${video.title} on ILLUVRSE News`;
  return {
    title: `${video.title} • ILLUVRSE Video`,
    description,
    openGraph: {
      title: `${video.title} • ILLUVRSE Video`,
      description,
      images: video.thumbnail ? [video.thumbnail] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${video.title} • ILLUVRSE Video`,
      description,
      images: video.thumbnail ? [video.thumbnail] : undefined,
    },
  };
}

export default async function VideoPage({ params }: { params: { slug: string } }) {
  const video = await prisma.video.findUnique({
    where: { slug: params.slug },
  });

  if (!video) {
    notFound();
  }

  return (
    <main
      className="mx-auto min-h-screen max-w-5xl px-4 py-12"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
        {video.live ? 'Live Stream' : 'On Demand'}
      </p>
      <h1 className="text-3xl font-black leading-tight md:text-4xl" style={{ color: 'var(--forest)' }}>
        {video.title}
      </h1>
      {video.tags && (
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
          {video.tags}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
        <span className="rounded-full border px-2 py-1" style={{ borderColor: 'var(--border)' }}>
          License: {video.license || 'TBD'}
        </span>
        <span className="rounded-full border px-2 py-1" style={{ borderColor: 'var(--border)' }}>
          Captions: {video.captionsUrl ? 'Available' : 'Add captions'}
        </span>
        <span className="rounded-full border px-2 py-1" style={{ borderColor: 'var(--border)' }}>
          Region: {video.countryCode || video.region || 'Global'}
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <VideoPlayer video={video} />
      </div>

      {video.description && (
        <p className="mt-4 text-sm leading-7" style={{ color: 'var(--text)' }}>
          {video.description}
        </p>
      )}
    </main>
  );
}

function VideoPlayer({ video }: { video: { hlsUrl: string | null; mp4Url: string | null; liveUrl: string | null; live: boolean; thumbnail: string | null } }) {
  const src = video.live ? video.liveUrl || video.hlsUrl : video.hlsUrl || video.mp4Url;
  if (!src) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm" style={{ color: 'var(--muted)' }}>
        <p className="font-semibold" style={{ color: 'var(--forest)' }}>
          Playback not configured yet.
        </p>
        <p>We&apos;re prepping the stream. Check back shortly or browse the library.</p>
        <Link
          href="/news/videos"
          className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}
        >
          View videos
        </Link>
      </div>
    );
  }

  const isHls = src.endsWith('.m3u8');

  if (isHls) {
    return (
      <video
        key={src}
        controls
        poster={video.thumbnail || undefined}
        className="h-full w-full bg-black"
      >
        <source src={src} type="application/x-mpegURL" />
        Your browser does not support HLS playback.
      </video>
    );
  }

  return (
    <video
      key={src}
      controls
      poster={video.thumbnail || undefined}
      className="h-full w-full bg-black"
    >
      <source src={src} type="video/mp4" />
      Your browser does not support MP4 playback.
    </video>
  );
}
