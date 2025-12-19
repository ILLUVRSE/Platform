const sections = [
  { title: 'People', copy: 'Actors, directors, writers—connected to every title they touch.', href: '/people' },
  { title: 'Titles', copy: 'Films, shows, and games with cast lists, release data, and where to watch.', href: '/titles' },
  { title: 'Articles', copy: 'Coverage linked to the people and titles they mention.', href: '/articles' },
];

export default function DatabasePage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 text-slate-100">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Data</p>
        <h1 className="text-4xl font-black tracking-tight text-white">ILLUVRSE Database</h1>
        <p className="mt-3 text-slate-300">
          The culture graph: titles, people, and the stories that connect them. The richer the data,
          the smarter your recs and searches get.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <a
            key={section.title}
            href={section.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_16px_60px_-40px_rgba(0,0,0,0.8)] transition hover:border-amber-200/50"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
              {section.title}
            </p>
            <p className="mt-2 text-sm text-slate-300 group-hover:text-white">{section.copy}</p>
            <span className="mt-3 inline-flex text-[11px] uppercase tracking-[0.18em] text-amber-100">
              View →
            </span>
          </a>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-200/10 via-white/5 to-transparent p-6 shadow-[0_20px_60px_-45px_rgba(251,191,36,0.9)]">
        <h2 className="text-xl font-semibold text-white">Roadmap</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          <li>• Link articles to people/titles for smarter recommendations.</li>
          <li>• Add search across people, titles, and tags. (Titles index now live.)</li>
          <li>• Ship profile and title pages with cast/crew rolls. (Titles have detail view.)</li>
        </ul>
      </div>
    </main>
  );
}
