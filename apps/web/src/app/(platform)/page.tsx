import type { CSSProperties } from "react";
import Link from "next/link";
import { surfaceUrls } from "@/lib/navigation";
import { buildMetadata, buildJsonLd } from "@/lib/metadata";
import SearchHero from "./SearchHero";
import SearchCommandCenter from "./SearchCommandCenter";
import SearchTrustPanel from "./SearchTrustPanel";
import SearchPreviewPanel from "./SearchPreviewPanel";

const title = "ILLUVRSE Search | Private, trust-first discovery";
const description =
  "ILLUVRSE Search is a calm entry point to the open web, powered by DuckDuckGo with quick jumps into the ILLUVRSE platform.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/"
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/",
  type: "WebSite",
  extra: {
    potentialAction: {
      "@type": "SearchAction",
      target: "https://duckduckgo.com/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
});

const quickJumps = [
  {
    title: "StorySphere Studio",
    description: "Prompt to MP4 workspace for creators and studios.",
    href: "/studio",
    tag: "Create"
  },
  {
    title: "LiveLoop",
    description: "Always-on playlists with signed artifact proofs.",
    href: "/liveloop",
    tag: "Stream"
  },
  {
    title: "Marketplace",
    description: "List and deliver signed artifacts with checkout.",
    href: "/marketplace",
    tag: "Ship"
  },
  {
    title: "ILLUVRSE News",
    description: "Signals, features, and the live desk.",
    href: "/news",
    tag: "Read"
  },
  {
    title: "GridStock",
    description: "Market terminal, portfolio views, and trading play.",
    href: surfaceUrls.gridstock,
    tag: "Trade"
  },
  {
    title: "Mom's Kitchen",
    description: "Recipes, meal planning, and AI assisted menus.",
    href: surfaceUrls.food,
    tag: "Cook"
  }
];

const searchStyles: CSSProperties = {
  "--search-ink": "#132b25",
  "--search-forest": "#1b6350",
  "--search-glow": "#f0d19a",
  "--search-mist": "#e6efe6",
  "--search-sand": "#f4efe6"
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-12" style={searchStyles}>
        <section className="relative overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:var(--search-sand)] p-8 shadow-card md:p-12">
          <div className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--search-mist),transparent_70%)] opacity-80 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--search-glow),transparent_70%)] opacity-80 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_45%,rgba(255,255,255,0.7)_55%,transparent_75%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <SearchHero />
            <div className="space-y-4">
              <SearchCommandCenter />
              <SearchTrustPanel />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
              Preview
            </div>
            <h2 className="text-2xl font-semibold text-[color:var(--text)]">
              Rich results before you click
            </h2>
            <p className="text-sm text-[color:var(--muted)]">
              Action-ready previews with sources, trust badges, and fast jumps into ILLUVRSE.
            </p>
          </div>
          <SearchPreviewPanel />
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
                Jump points
              </div>
              <h2 className="text-2xl font-semibold text-[color:var(--text)]">
                Launch deeper ILLUVRSE surfaces
              </h2>
            </div>
            <Link
              href="/products"
              className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--search-forest)] transition hover:border-[color:var(--search-forest)] hover:text-[color:var(--search-forest)]"
            >
              View all products
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickJumps.map((jump) => (
              <Link
                key={jump.title}
                href={jump.href}
                className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white p-5 shadow-card transition hover:border-[color:var(--search-forest)]"
              >
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,var(--search-mist),transparent_70%)] opacity-70" />
                <div className="relative space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    <span className="h-2 w-2 rounded-full bg-[color:var(--search-forest)]" />
                    {jump.tag}
                  </div>
                  <div className="text-lg font-semibold text-[color:var(--search-ink)] group-hover:text-[color:var(--search-forest)]">
                    {jump.title}
                  </div>
                  <p className="text-sm text-[color:var(--muted)]">{jump.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
