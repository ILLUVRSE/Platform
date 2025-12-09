import Link from "next/link";

const navItems = [
  { label: "Products", href: "/products" },
  { label: "Playground", href: "/playground" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Developers", href: "/developers" },
  { label: "About", href: "/about" }
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-slate-900">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-600 to-gold-500 shadow-card" />
          <span>ILLUVRSE</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-700 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-teal-700 hover:underline underline-offset-4">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-800 transition hover:border-teal-500/70 hover:text-teal-700 md:inline-flex"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
