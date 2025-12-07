import Link from "next/link";

const navItems = [
  { label: "Studio", href: "/" },
  { label: "LiveLoop", href: "/liveloop" },
  { label: "Player", href: "/player" },
  { label: "GameGrid", href: "/gamegrid" },
  { label: "Library", href: "/library" },
  { label: "Settings", href: "/settings" }
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/80 bg-slate-800/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-cream">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-600 to-gold-500 shadow-card" />
          <span>StorySphere</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-200">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition hover:bg-slate-700/70 hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/jobs"
          className="rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
        >
          Jobs
        </Link>
      </div>
    </header>
  );
}
