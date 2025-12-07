import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-700/60 bg-slate-800/70">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6 px-4 py-8 text-sm text-slate-200">
        <div>
          <div className="text-lg font-semibold text-cream">ILLUVRSE</div>
          <p className="mt-2 max-w-xs text-slate-200/80">
            Governed platform for signed artifacts, StorySphere studio, LiveLoop, and operator
            tooling.
          </p>
        </div>
        <div className="flex gap-12">
          <NavColumn
            title="Product"
            links={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: "StorySphere", href: "/storysphere" },
              { label: "Marketplace", href: "/marketplace" }
            ]}
          />
          <NavColumn
            title="Docs"
            links={[
              { label: "Developers", href: "/developers" },
              { label: "API Reference", href: "/developers#api" },
              { label: "Status", href: "/status" }
            ]}
          />
          <NavColumn
            title="Company"
            links={[
              { label: "About / Trust", href: "/about" },
              { label: "Blog", href: "/blog" },
              { label: "Contact", href: "/contact" },
              { label: "Legal", href: "/legal" }
            ]}
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
      <div className="text-sm font-semibold text-cream">{title}</div>
      <div className="mt-3 flex flex-col gap-2 text-sm text-slate-200/80">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition hover:text-cream hover:underline underline-offset-4"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
