import Link from "next/link";
import { topNavItems } from "../lib/navigation";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[rgba(247,243,235,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-[color:var(--forest)]">
          <img src="/logo.png" alt="ILLUVRSE" className="h-10 w-auto" />
          <span>ILLUVRSE</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[color:var(--forest)] md:flex">
          {topNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:opacity-70 underline-offset-4"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="hidden rounded-full border px-4 py-2 text-sm text-[color:var(--forest)] transition hover:opacity-80 md:inline-flex"
            style={{ borderColor: "var(--border)", background: "var(--panel)" }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--black)] shadow-card transition hover:opacity-95"
            style={{ background: "linear-gradient(90deg, #ffffff, #f7f3eb)", border: "1px solid var(--border)" }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
