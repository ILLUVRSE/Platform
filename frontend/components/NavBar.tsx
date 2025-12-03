// frontend/components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/livelLoop", label: "LiveLoop" },
  { href: "/library", label: "Library" },
  { href: "/series", label: "Series" },
  { href: "/movies", label: "Movies" },
  { href: "/gamegrid", label: "GameGrid" },
  { href: "/storysphere", label: "StorySphere" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-[var(--background)]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] border border-white/15 flex items-center justify-center text-lg font-semibold text-[var(--color-cream)]">
            ⌁
          </div>
          <div>
            <div className="text-lg font-semibold">Illuvrse</div>
            <div className="text-xs opacity-70">Personal studio</div>
          </div>
        </div>
        <nav className="flex items-center gap-3 flex-wrap text-sm font-medium">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-full transition-colors border border-transparent ${
                  active
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                    : "hover:border-white/20 hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
