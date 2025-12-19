export const revalidate = 300;

const endpoints = [
  { path: "/news/api/public/articles?region=&lang=", desc: "List articles with license, geo, and reliability metadata." },
  { path: "/news/api/public/titles?region=&lang=", desc: "Titles catalog with regional availability and language." },
  { path: "/news/api/public/people?region=&lang=", desc: "People index with localized bios." },
  { path: "/news/api/sources/:slug", desc: "Source profile with reliability and fetch timestamps." },
];

export default function OpenDataPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12" style={{ background: "var(--cream)", color: "var(--text)" }}>
      <header className="mb-10 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--forest)" }}>
          Open Data
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--forest)" }}>
          Public API & Open Data
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Region- and language-aware endpoints with license and source reliability metadata. Rate-limited; contact admin for scoped tokens.
        </p>
      </header>

      <div className="space-y-4">
        {endpoints.map((ep) => (
          <div key={ep.path} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
            <code className="block text-sm font-mono" style={{ color: "var(--forest)" }}>
              {ep.path}
            </code>
            <p className="mt-1 text-sm" style={{ color: "var(--text)" }}>
              {ep.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
