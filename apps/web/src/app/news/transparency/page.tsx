export const revalidate = 300;

async function fetchEntries() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/news/api/transparency`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.entries || [];
}

export default async function TransparencyPage() {
  const [entries, audits] = await Promise.all([
    fetchEntries(),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/news/api/audit`, { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => ({ entries: [] })),
  ]);
  const auditEntries = audits.entries || [];
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12" style={{ background: "var(--cream)", color: "var(--text)" }}>
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--forest)" }}>
          Transparency
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--forest)" }}>
          Public Transparency Log
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Key actions (alerts, ingest, verification) are logged for public accountability.
        </p>
      </header>

      <div className="space-y-3">
        {entries.map((entry: any) => (
          <div key={entry.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              <span>{entry.type} • {entry.region}</span>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--forest)" }}>
              {entry.message}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              By {entry.actor}
            </p>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--muted)" }}>
            No transparency entries yet.
          </div>
        )}
        {auditEntries.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--forest)" }}>
              Audit log (latest)
            </p>
            {auditEntries.map((entry: any) => (
              <div key={entry.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  <span>{entry.type ?? 'action'} • {entry.region ?? 'WORLD'}</span>
                  <span>{entry.createdAt}</span>
                </div>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--forest)" }}>
                  {entry.message}
                </p>
                {entry.actor && <p className="text-xs" style={{ color: "var(--muted)" }}>By {entry.actor}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
