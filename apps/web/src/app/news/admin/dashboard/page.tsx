import { auth, signOut } from '@news/auth';
import prisma from '@news/lib/prisma';
import { AvailabilityStatus, ProposalStatus } from '@illuvrse/db';
import Link from 'next/link';
import { logAudit } from '@news/lib/audit';
import { revalidatePath } from 'next/cache';
import { executeProposal } from '@news/lib/publish';
import { getSetting, setSetting } from '@news/lib/settings';

export const dynamic = 'force-dynamic';

const INTERNAL_API_BASE = process.env.NEXT_PUBLIC_BASE_URL || '';
const internalAuthHeaders = process.env.INTERNAL_API_TOKEN ? { Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN}` } : {};

function internalFetch(path: string, init?: RequestInit) {
  return fetch(`${INTERNAL_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...internalAuthHeaders,
    },
  });
}

type HealthSnapshot = {
  dbHealthy: boolean;
  stationsOnline: number;
  stationsOffline: number;
  stationsUnknown: number;
  sourcesStale: number;
  lastHeartbeat: string;
};

type TransparencyEntry = {
  id: string;
  type: string;
  region?: string;
  actor?: string;
  message: string;
  createdAt?: string;
};

async function getHealth(): Promise<HealthSnapshot> {
  let dbHealthy = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbHealthy = false;
  }

  const [online, offline, unknown] = await Promise.all([
    prisma.station.count({ where: { status: AvailabilityStatus.online } }),
    prisma.station.count({ where: { status: AvailabilityStatus.offline } }),
    prisma.station.count({ where: { status: AvailabilityStatus.unknown } }),
  ]);

  const staleThreshold = new Date(Date.now() - 1000 * 60 * 60 * 6); // 6 hours
  const sourcesStale = await prisma.source.count({
    where: {
      OR: [{ lastFetchedAt: { lt: staleThreshold } }, { lastFetchedAt: null }],
    },
  });

  return {
    dbHealthy,
    stationsOnline: online,
    stationsOffline: offline,
    stationsUnknown: unknown,
    sourcesStale,
    lastHeartbeat: new Date().toISOString(),
  };
}

async function getIngests() {
  const sources = await prisma.source.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 8,
  });
  return sources.map((s) => {
    const stale = !s.lastFetchedAt || new Date(s.lastFetchedAt) < new Date(Date.now() - 1000 * 60 * 60 * 6);
    return {
      id: s.id,
      name: s.name,
      region: s.region ?? 'WORLD',
      language: s.language ?? '—',
      reliability: s.reliability ?? 50,
      lastFetchedAt: s.lastFetchedAt ? new Date(s.lastFetchedAt).toISOString() : null,
      status: stale ? 'stale' : 'healthy',
    };
  });
}

async function getJobQueue() {
  const scheduled = await prisma.article.count({ where: { status: 'scheduled' } });
  const drafts = await prisma.article.count({ where: { status: 'draft' } });
  const publishedToday = await prisma.article.count({
    where: { publishedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  });

  return [
    { id: 'translation-queue', type: 'translation', status: 'queued', count: scheduled, note: 'Scheduled translations' },
    { id: 'fact-check', type: 'fact-check', status: 'queued', count: drafts, note: 'Drafts pending fact-check' },
    { id: 'openai-refresh', type: 'ai-refresh', status: 'idle', count: publishedToday, note: 'Published today' },
  ];
}

async function getTransparencyFeed() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/news/api/transparency`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    return (data.entries || []) as TransparencyEntry[];
  } catch {
    return [];
  }
}

async function safeGetProposals() {
  try {
    // @ts-expect-error prisma might not have been migrated yet; guard to avoid runtime crash.
    if (!prisma.proposal) return [];
    return prisma.proposal.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const [health, ingests, jobs, transparency, proposals, ingestLogs, safeMode, tokens] = await Promise.all([
    getHealth(),
    getIngests(),
    getJobQueue(),
    getTransparencyFeed(),
    safeGetProposals(),
    internalFetch('/news/api/internal/ingest/logs', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => d.logs || [])
      .catch(() => []),
    getSetting('safe_mode'),
    internalFetch('/news/api/internal/api-tokens', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => d.tokens || [])
      .catch(() => []),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
            Admin
          </p>
          <h1 className="text-3xl font-black" style={{ color: 'var(--forest)' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            System health, ingest status, queues, alerts, and quick links.
          </p>
        </div>
        <form
          action={async () => {
            'use server';
            await signOut();
          }}
        >
          <button
            className="flex h-[44px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold uppercase tracking-[0.16em]"
            style={{ background: 'var(--panel)', border: `1px solid var(--border)`, color: 'var(--forest)' }}
          >
            Sign Out
          </button>
        </form>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                System Health
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                {health.dbHealthy ? 'Healthy' : 'Issues detected'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Last heartbeat {new Date(health.lastHeartbeat).toLocaleTimeString()}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{
                background: health.dbHealthy ? '#dcfce7' : '#fee2e2',
                color: health.dbHealthy ? '#166534' : '#991b1b',
                border: `1px solid ${health.dbHealthy ? '#16653420' : '#991b1b20'}`,
              }}
            >
              DB {health.dbHealthy ? 'OK' : 'Down'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
              <p>Online</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>
                {health.stationsOnline}
              </p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
              <p>Offline</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>
                {health.stationsOffline}
              </p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
              <p>Unknown</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>
                {health.stationsUnknown}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
            Stale sources: {health.sourcesStale}
          </div>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Job Queue
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                AI / Translations / Fact-check
              </h2>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                    {job.type}
                  </p>
                  <p className="font-semibold" style={{ color: 'var(--forest)' }}>
                    {job.note}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
                    {job.status}
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                    {job.count}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Approvals
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                Pending proposals
              </h2>
            </div>
            <Link href="/news/admin/articles" className="text-xs font-semibold uppercase tracking-[0.16em] underline" style={{ color: 'var(--forest)' }}>
              Manage
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            {proposals.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No proposals yet.
              </p>
            )}
            {proposals.map((p) => (
              <div key={p.id} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
                  {p.type} {p.region ? `• ${p.region}` : ''} {p.language ? `• ${p.language}` : ''}
                </p>
                <p className="font-semibold" style={{ color: 'var(--forest)' }}>
                  {p.status === ProposalStatus.pending ? 'Needs approval' : p.status}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Approvals: {p.approvers.length}/{p.requiredApprovals}
                </p>
                {p.status === ProposalStatus.pending && (
                  <div className="mt-2 flex gap-2">
                    <form
                      action={async () => {
                        'use server';
                        const approvers = Array.from(new Set([...(p.approvers || []), 'admin-dashboard']));
                        const isApproved = approvers.length >= p.requiredApprovals;
                        await prisma.proposal.update({
                          where: { id: p.id },
                          data: {
                            approvers,
                            status: isApproved ? ProposalStatus.approved : ProposalStatus.pending,
                          },
                        });
                        await logAudit({
                          action: 'proposal.approve',
                          entityId: p.id,
                          entityType: 'proposal',
                          summary: `Proposal ${p.id} approved by admin-dashboard`,
                          metadata: { approvers },
                        });
                        if (isApproved) {
                          await executeProposal(p.id);
                        }
                        revalidatePath('/admin/dashboard');
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full bg-[var(--forest)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
                      >
                        Approve
                      </button>
                    </form>
                    <form
                      action={async () => {
                        'use server';
                        await prisma.proposal.update({
                          where: { id: p.id },
                          data: { status: ProposalStatus.rejected, reason: 'Rejected via dashboard' },
                        });
                        await logAudit({
                          action: 'proposal.reject',
                          entityId: p.id,
                          entityType: 'proposal',
                          summary: `Proposal ${p.id} rejected via dashboard`,
                        });
                        revalidatePath('/admin/dashboard');
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border p-4 shadow-sm lg:col-span-2" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Ingest Status
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                Recent sources
              </h2>
            </div>
            <Link href="/news/admin/articles" className="text-xs font-semibold uppercase tracking-[0.16em] underline" style={{ color: 'var(--forest)' }}>
              Open ingest log
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full border-collapse text-sm">
              <thead className="text-left text-[11px] uppercase tracking-[0.14em]" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Region</th>
                  <th className="px-3 py-2">Lang</th>
                  <th className="px-3 py-2">Reliability</th>
                  <th className="px-3 py-2">Last fetched</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {ingests.map((source) => (
                  <tr key={source.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-3 py-2 font-semibold" style={{ color: 'var(--forest)' }}>
                      {source.name}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                      {source.region}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                      {source.language}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                      {source.reliability}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                      {source.lastFetchedAt ? new Date(source.lastFetchedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{
                          background: source.status === 'stale' ? '#fef08a' : '#dcfce7',
                          color: source.status === 'stale' ? '#854d0e' : '#166534',
                          border: `1px solid ${source.status === 'stale' ? '#854d0e20' : '#16653420'}`,
                        }}
                      >
                        {source.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {ingests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                      No sources found. Add sources to start ingesting feeds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Audit / Transparency
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                Recent actions
              </h2>
            </div>
            <Link href="/news/transparency" className="text-xs font-semibold uppercase tracking-[0.16em] underline" style={{ color: 'var(--forest)' }}>
              Transparency
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            {transparency.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No recent audit entries.
              </p>
            )}
            {transparency.map((entry: TransparencyEntry) => (
              <div key={entry.id} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
                  {entry.type} • {entry.region ?? 'WORLD'}
                </p>
                <p className="font-semibold" style={{ color: 'var(--forest)' }}>
                  {entry.message}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {entry.actor} • {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Ingest Logs
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                Recent ingest activity
              </h2>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full border-collapse text-sm">
              <thead className="text-left text-[11px] uppercase tracking-[0.14em]" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {ingestLogs.map((log: { id: string; sourceName: string; status: string; message?: string; createdAt?: string }) => (
                  <tr key={log.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-3 py-2 font-semibold" style={{ color: 'var(--forest)' }}>
                      {log.sourceName}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{
                          background: log.status === 'success' ? '#dcfce7' : '#fee2e2',
                          color: log.status === 'success' ? '#166534' : '#991b1b',
                          border: `1px solid ${log.status === 'success' ? '#16653420' : '#991b1b20'}`,
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                      {log.message}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                    </td>
                  </tr>
                ))}
                {ingestLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                      No ingest logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/news/admin/articles/create"
          className="block rounded-lg border p-6 shadow-sm transition hover:-translate-y-1"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--forest)' }}>
            Create Article
          </h5>
          <p className="font-normal" style={{ color: 'var(--text)' }}>
            Write and publish a new article.
          </p>
        </Link>
        <Link
          href="/news/admin/articles"
          className="block rounded-lg border p-6 shadow-sm transition hover:-translate-y-1"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--forest)' }}>
            Manage Articles
          </h5>
          <p className="font-normal" style={{ color: 'var(--text)' }}>
            Status updates, scheduling, and quick edits.
          </p>
        </Link>
        <Link
          href="/news/admin/credits"
          className="block rounded-lg border p-6 shadow-sm transition hover:-translate-y-1"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--forest)' }}>
            Manage Credits
          </h5>
          <p className="font-normal" style={{ color: 'var(--text)' }}>
            Link people to titles with roles and characters.
          </p>
        </Link>
        <Link
          href="/news/admin/videos"
          className="block rounded-lg border p-6 shadow-sm transition hover:-translate-y-1"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--forest)' }}>
            Videos
          </h5>
          <p className="font-normal" style={{ color: 'var(--text)' }}>
            Add live streams and on-demand videos.
          </p>
        </Link>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Safe Mode
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                {safeMode === 'on' ? 'Enabled' : 'Disabled'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Blocks publish/alert execution and AI generation when ON.
              </p>
            </div>
            <form
              action={async () => {
                'use server';
                const session = await auth();
                const next = safeMode === 'on' ? 'off' : 'on';
                await setSetting('safe_mode', next);
                await logAudit({
                  action: 'safeMode.toggle',
                  actor: session?.user?.email ?? 'admin',
                  summary: `Safe mode turned ${next}`,
                  metadata: { enabled: next === 'on' },
                });
                revalidatePath('/admin/dashboard');
              }}
            >
              <button
                type="submit"
                className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ border: '1px solid var(--border)', color: 'var(--forest)' }}
              >
                Toggle
              </button>
            </form>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <form
              action={async () => {
                'use server';
                await internalFetch('/news/api/internal/ingest', { method: 'POST' });
                revalidatePath('/admin/dashboard');
              }}
            >
              <button className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}>
                Run Ingest
              </button>
            </form>
            <form
              action={async () => {
                'use server';
                await internalFetch('/news/api/internal/health/streams', { method: 'POST' });
                revalidatePath('/admin/dashboard');
              }}
            >
              <button className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}>
                Check Streams
              </button>
            </form>
            <form
              action={async () => {
                'use server';
                await internalFetch('/news/api/internal/publish/scheduled', { method: 'POST' });
                revalidatePath('/admin/dashboard');
              }}
            >
              <button className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'var(--border)', color: 'var(--forest)' }}>
                Run Scheduled Publish
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                API Tokens
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
                Manage tokens
              </h2>
            </div>
          </div>
          <form
            action={async () => {
              'use server';
              await internalFetch('/news/api/internal/api-tokens', { method: 'POST' });
              revalidatePath('/admin/dashboard');
            }}
          >
            <button className="rounded-full bg-[var(--forest)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
              Create token
            </button>
          </form>
          <div className="mt-3 space-y-2 text-sm">
            {tokens.length === 0 && <p style={{ color: 'var(--muted)' }}>No tokens.</p>}
            {tokens.map((t: { id: string; label?: string; active?: boolean; rateLimit?: number; usageCount?: number }) => (
              <div key={t.id} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <p className="font-semibold" style={{ color: 'var(--forest)' }}>
                  {t.label || 'Token'} ({t.active ? 'active' : 'inactive'})
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Limit: {t.rateLimit} • Usage: {t.usageCount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
