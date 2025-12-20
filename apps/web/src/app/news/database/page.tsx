const sections = [
  { title: 'People', copy: 'Actors, directors, writers—connected to every title they touch.', href: '/people' },
  { title: 'Titles', copy: 'Films, shows, and games with cast lists, release data, and where to watch.', href: '/titles' },
  { title: 'Articles', copy: 'Coverage linked to the people and titles they mention.', href: '/articles' },
];

export default function DatabasePage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 text-slate-900">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700/80">Data</p>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">ILLUVRSE Database</h1>
        <p className="mt-3 text-slate-600">
          The culture graph: titles, people, and the stories that connect them. The richer the data,
          the smarter your recs and searches get.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <a
            key={section.title}
            href={section.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.25)] transition hover:border-amber-300"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              {section.title}
            </p>
            <p className="mt-2 text-sm text-slate-600 group-hover:text-slate-900">
              {section.copy}
            </p>
            <span className="mt-3 inline-flex text-[11px] uppercase tracking-[0.18em] text-amber-700">
              View →
            </span>
          </a>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-amber-200/60 bg-amber-50 p-6 shadow-[0_20px_60px_-45px_rgba(251,191,36,0.35)]">
        <h2 className="text-xl font-semibold text-slate-900">Roadmap</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>• Link articles to people/titles for smarter recommendations.</li>
          <li>• Add search across people, titles, and tags. (Titles index now live.)</li>
          <li>• Ship profile and title pages with cast/crew rolls. (Titles have detail view.)</li>
        </ul>
      </div>
    </main>
  );
}
