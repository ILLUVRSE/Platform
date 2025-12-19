import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@news/lib/prisma';
import { VerificationBadge } from '@news/components/ui';

export const revalidate = 60;

export default async function StationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const station = await prisma.station.findUnique({
    where: { slug: resolved.slug },
  });

  if (!station) {
    notFound();
  }

  const tone =
    station.status === 'online'
      ? { bg: '#dcfce7', text: '#166534', label: 'Online' }
      : station.status === 'offline'
        ? { bg: '#fee2e2', text: '#991b1b', label: 'Offline' }
        : { bg: '#fef08a', text: '#854d0e', label: 'Unknown' };

  const lastChecked = station.lastCheckedAt
    ? new Date(station.lastCheckedAt).toLocaleString()
    : 'Unknown';
  const readAttributes = [
    station.countryCode && `Country ${station.countryCode}`,
    station.region && `Region ${station.region}`,
    station.city && `City ${station.city}`,
    station.language && `Language ${station.language}`,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
          Station profile
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
          {station.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          {readAttributes}
        </div>
      </header>

      <section className="mb-6 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: tone.bg, color: tone.text }}>
            {tone.label}
          </span>
          <VerificationBadge reliability={tone.label === 'Online' ? 90 : tone.label === 'Offline' ? 10 : 50} label="Health" size="sm" />
          {station.websiteUrl && (
            <a href={station.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold uppercase tracking-[0.18em] underline" style={{ color: 'var(--forest)' }}>
              Source site →
            </a>
          )}
          <a href={station.streamUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold uppercase tracking-[0.18em] underline" style={{ color: 'var(--forest)' }}>
            Open stream
          </a>
        </div>
        <p className="mt-3 text-sm" style={{ color: 'var(--text)' }}>
          {station.notes || 'No description provided.'}
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Last checked: {lastChecked} • Failures: {station.failureCount ?? 0}
        </p>
      </section>

      <section className="mb-6 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              Stream details
            </p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Format and playback links.
            </p>
          </div>
          <Link href="/news/radio" className="text-xs font-semibold uppercase tracking-[0.18em] underline" style={{ color: 'var(--forest)' }}>
            Back to radio
          </Link>
        </div>
        <div className="mt-3 grid gap-2 text-sm" style={{ color: 'var(--text)' }}>
          <p>Stream URL: <a href={station.streamUrl} className="underline" target="_blank" rel="noopener noreferrer">{station.streamUrl}</a></p>
          {station.bitrate && <p>Bitrate: {station.bitrate} kbps</p>}
          {station.codec && <p>Codec: {station.codec}</p>}
          <p>Status: {tone.label}</p>
        </div>
      </section>

      <section className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
          Schedule & notes
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
          Schedule metadata is not provided yet. Contact the station for current programming and licensing. Reuse this stream only with permission from the broadcaster.
        </p>
      </section>
    </main>
  );
}
