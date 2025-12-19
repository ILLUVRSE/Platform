import Link from "next/link";
import { platformCreate, platformOperate, platformSurfaces, type NavItem } from "../lib/navigation";

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--forest)]">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-full px-2 py-1 transition hover:opacity-70">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PlatformBar() {
  return (
    <div className="border-b border-[color:var(--border)] bg-[rgba(247,243,235,0.85)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-2">
        <Link href="/" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]">
          ILLUVRSE Platform
        </Link>
        <NavGroup label="Explore" items={platformSurfaces} />
        <NavGroup label="Create" items={platformCreate} />
        <NavGroup label="Operate" items={platformOperate} />
      </div>
    </div>
  );
}
