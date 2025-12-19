import Link from "next/link";

const navItems = [
  { label: "Studio", href: "/studio" },
  { label: "LiveLoop", href: "/studio/liveloop" },
  { label: "Player", href: "/studio/player" },
  { label: "GameGrid", href: "/studio/gamegrid" },
  { label: "Library", href: "/studio/library" },
  { label: "Settings", href: "/studio/settings" }
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[rgba(247,243,235,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/studio" className="flex items-center gap-3 text-lg font-semibold text-[color:var(--forest)]">
          <img src="/logo.png" alt="ILLUVRSE" className="h-10 w-auto" />
          <span>StorySphere</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[color:var(--forest)]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition hover:bg-[var(--panel)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/studio/jobs"
          className="rounded-full border px-4 py-2 text-sm font-semibold text-[color:var(--forest)] transition hover:opacity-80"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          Jobs
        </Link>
      </div>
    </header>
  );
}
