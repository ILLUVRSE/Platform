export default function ListsPage() {
  const items = [
    { title: 'Top 10 soundtracks to replay', type: 'List' },
    { title: 'Quiz: Can you guess the film from the frame?', type: 'Quiz' },
    { title: 'Directors to watch this year', type: 'List' },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 text-slate-100">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Desk</p>
        <h1 className="text-4xl font-black tracking-tight text-white">Lists & Quizzes</h1>
        <p className="mt-3 text-slate-300">
          Quick hits you can skim, share, and argue about.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_16px_60px_-40px_rgba(0,0,0,0.8)] md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                {item.type}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">{item.title}</h2>
            </div>
            <p className="mt-3 text-sm text-amber-100 md:mt-0">Coming soon →</p>
          </div>
        ))}
      </div>
    </main>
  );
}
