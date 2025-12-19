import Link from "next/link";

function normalizeUrl(url: string) {
  if (url.length > 1 && url.endsWith("/")) return url.slice(0, -1);
  return url;
}

const platformBase = normalizeUrl(process.env.NEXT_PUBLIC_PLATFORM_URL ?? "");
const foodBase = normalizeUrl(process.env.NEXT_PUBLIC_FOOD_URL ?? "");
const gridstockBase = normalizeUrl(process.env.NEXT_PUBLIC_GRIDSTOCK_URL ?? "");

function platformLink(path: string) {
  return platformBase ? `${platformBase}${path}` : path;
}

const links = [
  { label: "ILLUVRSE", href: platformLink("/") },
  { label: "ACE", href: platformLink("/ace/create") },
  { label: "Playground", href: platformLink("/playground") },
  { label: "StorySphere", href: platformLink("/storysphere") },
  { label: "News", href: platformLink("/news") },
  { label: "Food", href: foodBase || "/" },
  { label: "GridStock", href: gridstockBase || platformLink("/gridstock") }
];

export function PlatformBar() {
  return (
    <div className="border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2 text-[12px] text-stone-600">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Platform
        </span>
        {links.map((link) => (
          <Link key={link.label} href={link.href} className="rounded-full px-2 py-1 transition hover:text-primary">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
