import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { RegionLanguageBar } from "@news/components/global-controls";
import { AlertBanner } from "@news/components/alert-banner";

const base = "/news";
const navLinks = [
  { href: `${base}`, label: "Home" },
  { href: `${base}/news`, label: "News" },
  { href: `${base}/features`, label: "Features" },
  { href: `${base}/radio`, label: "Radio" },
  { href: `${base}/live`, label: "Live Stream" },
  { href: `${base}/videos`, label: "Video" },
];

export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)', color: 'var(--text)' }}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <AlertBanner />
      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{ borderBottom: `1px solid var(--border)`, background: 'rgba(247,243,235,0.95)' }}
        role="banner"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href={base} className="flex items-center" aria-label="ILLUVRSE News Home">
            <Image src="/logo.png" alt="ILLUVRSE logo" width={160} height={184} className="h-16 w-auto" priority />
            <span className="sr-only">ILLUVRSE News — Public Access Network</span>
          </Link>
          <div className="flex flex-1 items-center justify-end gap-3">
            <nav
              className="hidden items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--forest)]/80 md:flex"
              role="navigation"
              aria-label="Primary"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:opacity-70"
                  style={{ color: 'var(--forest)' }}
                >
                  {link.label}
                </Link>
              ))}
              <Link href={`${base}/open-data`} className="hover:opacity-70" style={{ color: 'var(--forest)' }}>
                Open Data
              </Link>
            </nav>
            <RegionLanguageBar />
            <Link
              href={`${base}/search`}
              className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition"
              style={{
                border: `1px solid var(--border)`,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(247,243,235,0.9))',
                color: 'var(--forest)',
              }}
              aria-label="Open search"
              data-cy="nav-search"
            >
              Search
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" role="main">
        {children}
      </main>

      <footer
        className="mt-16"
        style={{ borderTop: `1px solid var(--border)`, background: 'rgba(247,243,235,0.9)' }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className="group rounded-2xl border p-5 transition"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            >
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                Desk
              </p>
              <h2 className="mt-1 text-xl font-bold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
                News
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
                Drop quick hits, scoops, and dispatches with your own art and copy.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`${base}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{ color: 'var(--forest)' }}
                >
                  Open the page →
                </Link>
                <Link
                  href={`${base}/admin/articles/create?type=news`}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition"
                  style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--forest)' }}
                >
                  Write News
                </Link>
              </div>
            </div>

            <div
              className="group rounded-2xl border p-5 transition"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            >
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                Desk
              </p>
              <h2 className="mt-1 text-xl font-bold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
                Features
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
                Longform space for essays, interviews, and deep dives—fully editable.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`${base}/features`}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{ color: 'var(--forest)' }}
                >
                  Open the page →
                </Link>
                <Link
                  href={`${base}/admin/articles/create?type=feature`}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition"
                  style={{ border: `1px solid var(--border)`, background: 'var(--cream)', color: 'var(--forest)' }}
                >
                  Write Feature
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-black" style={{ color: 'var(--forest)' }}>
                ILLUVRSE News — Global Public Access News Network
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Public-access reporting with open data, regional desks, and verifiable sources.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em]">
              <Link href={`${base}/admin/login`} style={{ color: 'var(--forest)' }} className="hover:opacity-70">
                Admin
              </Link>
              <Link href={`${base}/radio`} style={{ color: 'var(--forest)' }} className="hover:opacity-70">
                Radio
              </Link>
              <Link href={`${base}/open-data`} style={{ color: 'var(--forest)' }} className="hover:opacity-70">
                Open Data
              </Link>
              <Link href={`${base}/openai-key`} style={{ color: 'var(--forest)' }} className="hover:opacity-70">
                OpenAI API Key
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
