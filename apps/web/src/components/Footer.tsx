import Link from "next/link";
import { footerNav } from "../lib/navigation";

export function Footer() {
  return (
    <footer className="border-t bg-[color:var(--panel)]" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6 px-4 py-8 text-sm text-[color:var(--text)]">
        <div>
          <div className="text-lg font-semibold text-[color:var(--forest)]">ILLUVRSE</div>
          <p className="mt-2 max-w-xs text-[color:var(--muted)]">
            Governed platform for signed artifacts, StorySphere studio, LiveLoop, and operator
            tooling.
          </p>
        </div>
        <div className="flex gap-12">
          <NavColumn
            title="Product"
            links={footerNav.product}
          />
          <NavColumn
            title="Docs"
            links={footerNav.docs}
          />
          <NavColumn
            title="Company"
            links={footerNav.company}
          />
        </div>
      </div>
    </footer>
  );
}

function NavColumn({
  title,
  links
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-[140px]">
      <div className="text-sm font-semibold text-[color:var(--forest)]">{title}</div>
      <div className="mt-3 flex flex-col gap-2 text-sm text-[color:var(--muted)]">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition hover:opacity-80 underline-offset-4"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
