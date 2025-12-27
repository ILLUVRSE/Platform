import type { CSSProperties } from "react";
import Link from "next/link";
import { Card, PageSection, Pill, ProofCard, StatBadge } from "@illuvrse/ui";
import type { MarketplaceListing } from "@illuvrse/contracts";
import { ManifestViewer } from "@/components/ManifestViewer";
import { buildMetadata, buildJsonLd } from "@/lib/metadata";
import { AddToCartButton, MarketplaceCartDock } from "./MarketplaceCart";

const title = "Marketplace | Signed ACE agents and add-ons";
const description =
  "Browse Kernel-signed ACE agents with proofs, checkout receipts, and artifact delivery.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/marketplace"
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/marketplace",
  type: "CollectionPage"
});

const heroStyles: CSSProperties = {
  background: "linear-gradient(135deg, #f7f3eb 0%, #ffffff 45%, #dfeee7 100%)",
  boxShadow: "0 28px 70px -48px rgba(33,49,45,0.45)"
};

const categoryTabs = [
  "Featured",
  "ACE agents",
  "Add-ons",
  "Bundles",
  "Personality",
  "Cosmetic"
];

const sortOptions = ["Featured", "Newest", "Price: Low to High", "Price: High to Low", "Rating"];

const activeFilters = ["Signed", "Ready", "Under $100"];

const filterSections = [
  {
    title: "Type",
    name: "type",
    type: "checkbox",
    options: ["ACE agents", "Add-ons", "Bundles", "Packs"]
  },
  {
    title: "Capabilities",
    name: "capabilities",
    type: "checkbox",
    options: ["Generator", "Catalog", "Memory", "Dialogue", "Visual", "Audio"]
  },
  {
    title: "Availability",
    name: "availability",
    type: "checkbox",
    options: ["Ready", "Canary", "Preview"]
  },
  {
    title: "Verification",
    name: "verification",
    type: "checkbox",
    options: ["Kernel-signed", "Ledger proof", "Sandbox preview"]
  },
  {
    title: "Price",
    name: "price",
    type: "radio",
    options: ["Under $25", "$25-$50", "$50-$100", "$100+"]
  }
];

const ratingStars = [1, 2, 3, 4, 5];

const badgeStyles: Record<string, string> = {
  Signed: "border-teal-200 bg-teal-50 text-teal-800",
  New: "border-amber-200 bg-amber-50 text-amber-800",
  "Best Seller": "border-[color:var(--forest)] bg-[color:var(--forest)] text-white",
  "Top Rated": "border-slate-200 bg-slate-100 text-slate-700",
  Limited: "border-slate-900 bg-slate-900 text-white",
  Preview: "border-slate-200 bg-white text-slate-600"
};

const imageThemes = {
  forest: {
    gradient: "linear-gradient(140deg, rgba(47,107,88,0.2), rgba(247,243,235,0.9))",
    accent: "radial-gradient(circle, rgba(47,107,88,0.55) 0%, rgba(47,107,88,0) 70%)"
  },
  gold: {
    gradient: "linear-gradient(140deg, rgba(240,209,154,0.45), rgba(255,255,255,0.9))",
    accent: "radial-gradient(circle, rgba(240,209,154,0.75) 0%, rgba(240,209,154,0) 70%)"
  },
  teal: {
    gradient: "linear-gradient(140deg, rgba(47,107,88,0.12), rgba(223,238,231,0.95))",
    accent: "radial-gradient(circle, rgba(47,107,88,0.45) 0%, rgba(47,107,88,0) 70%)"
  },
  slate: {
    gradient: "linear-gradient(140deg, rgba(15,23,42,0.12), rgba(247,243,235,0.95))",
    accent: "radial-gradient(circle, rgba(15,23,42,0.35) 0%, rgba(15,23,42,0) 70%)"
  }
};

const reviewSnippets = [
  {
    name: "Ops Guild",
    role: "Control-room team",
    rating: 5,
    verified: true,
    quote: "Signed manifests and receipts cut audit prep time in half."
  },
  {
    name: "Studio 9",
    role: "StorySphere creators",
    rating: 4,
    verified: true,
    quote: "Preview sandboxes let us test bundles before production drops."
  },
  {
    name: "Kernel Partner",
    role: "Compliance lead",
    rating: 5,
    verified: false,
    quote: "The ledger trail keeps every artifact accountable."
  }
];

const qaPairs = [
  {
    question: "How are manifests verified?",
    answer: "Kernel signs the manifest hash and SentinelNet evaluates policy before listing."
  },
  {
    question: "What do I receive after checkout?",
    answer: "Finance issues a receipt tied to the manifest hash and ArtifactPublisher delivers the encrypted package."
  },
  {
    question: "Can I preview before purchase?",
    answer: "Yes. Signed listings include sandbox previews and manifest metadata."
  }
];

type CatalogItem = {
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  status: MarketplaceListing["status"];
  signed: boolean;
  sha?: string;
  tags?: string[];
  badges?: string[];
  rating: number;
  reviews: number;
  capabilities: string[];
  runtime: string;
  category: string;
  image: {
    gradient: string;
    accent: string;
  };
};

const fallbackCatalog: CatalogItem[] = [
  {
    sku: "agent.sentinel.scout",
    name: "Sentinel Scout Agent",
    description: "Perimeter monitor with digest alerts and anomaly sweeps.",
    price: 64,
    currency: "USD",
    status: "ready",
    signed: true,
    sha: "1c3d:90af...e220",
    tags: ["Monitoring", "Digest"],
    badges: ["Signed", "Best Seller"],
    rating: 4.8,
    reviews: 214,
    capabilities: ["Monitoring", "Digest", "Alerting"],
    runtime: "illuvrse/agent-sentinel:stable",
    category: "Agent",
    image: imageThemes.forest
  },
  {
    sku: "bundle.lore.architect",
    name: "Lore Architect Bundle",
    description: "Narrative arcs, memory packs, and plot threading tools.",
    price: 89,
    currency: "USD",
    status: "ready",
    signed: true,
    sha: "7b11:3a9d...c991",
    tags: ["Story", "Memory"],
    badges: ["Signed", "New"],
    rating: 4.7,
    reviews: 96,
    capabilities: ["Story", "Memory", "Worldbuilding"],
    runtime: "illuvrse/bundle-lore:stable",
    category: "Bundle",
    image: imageThemes.gold
  },
  {
    sku: "addon.persona.matrix",
    name: "Persona Matrix Add-on",
    description: "Adaptive dialog traits and tone presets for companions.",
    price: 24,
    currency: "USD",
    status: "canary",
    signed: false,
    sha: "8ae1:110b...77aa",
    tags: ["Personality", "Dialogue"],
    badges: ["New", "Preview"],
    rating: 4.3,
    reviews: 58,
    capabilities: ["Dialogue", "Tone", "Traits"],
    runtime: "illuvrse/addon-persona:beta",
    category: "Add-on",
    image: imageThemes.teal
  },
  {
    sku: "agent.ops.runbook",
    name: "Ops Runbook Agent",
    description: "Runbook generation with audit-ready escalation paths.",
    price: 72,
    currency: "USD",
    status: "ready",
    signed: true,
    sha: "3c2a:81d4...82fd",
    tags: ["Operations", "Compliance"],
    badges: ["Signed", "Top Rated"],
    rating: 4.6,
    reviews: 88,
    capabilities: ["Operations", "Compliance", "Escalation"],
    runtime: "illuvrse/agent-ops:stable",
    category: "Agent",
    image: imageThemes.slate
  },
  {
    sku: "addon.nebula.cosmetic",
    name: "Nebula Cosmetic Pack",
    description: "Skins, particle FX, and holographic UI overlays.",
    price: 18,
    currency: "USD",
    status: "ready",
    signed: true,
    sha: "6f8a:ea21...10cb",
    tags: ["Skins", "Visual"],
    badges: ["Signed"],
    rating: 4.2,
    reviews: 61,
    capabilities: ["Skins", "Visual", "Particles"],
    runtime: "illuvrse/pack-nebula:1.2",
    category: "Pack",
    image: imageThemes.gold
  },
  {
    sku: "bundle.voice.studio",
    name: "Voice Studio Bundle",
    description: "Voice filters, ambience layers, and broadcast presets.",
    price: 42,
    currency: "USD",
    status: "ready",
    signed: true,
    sha: "2ad1:0f7c...e34a",
    tags: ["Audio", "Broadcast"],
    badges: ["Signed", "Limited"],
    rating: 4.5,
    reviews: 42,
    capabilities: ["Audio", "Voice", "Broadcast"],
    runtime: "illuvrse/bundle-voice:1.0",
    category: "Bundle",
    image: imageThemes.teal
  },
  {
    sku: "agent.chronicle.archivist",
    name: "Chronicle Archivist",
    description: "Archive curator for StorySphere releases and metadata.",
    price: 88,
    currency: "USD",
    status: "preview",
    signed: true,
    sha: "4d92:5c8b...6b91",
    tags: ["Archive", "Catalog"],
    badges: ["Signed", "Preview"],
    rating: 4.1,
    reviews: 22,
    capabilities: ["Archive", "Catalog", "Metadata"],
    runtime: "illuvrse/agent-chronicle:dev",
    category: "Agent",
    image: imageThemes.slate
  }
];

const statusStyles: Record<MarketplaceListing["status"], string> = {
  ready: "border-teal-200 bg-teal-50 text-teal-800",
  canary: "border-amber-200 bg-amber-50 text-amber-800",
  preview: "border-slate-200 bg-slate-100 text-slate-700"
};

async function fetchListing(): Promise<MarketplaceListing | null> {
  try {
    const res = await fetch(`${process.env.MARKETPLACE_URL ?? ""}/listing`, { cache: "no-store" });
    if (res.ok) return (await res.json()) as MarketplaceListing;
  } catch {
    // ignore
  }
  try {
    const res = await fetch("http://localhost:3000/api/marketplace/listing", { cache: "no-store" });
    if (res.ok) return (await res.json()) as MarketplaceListing;
  } catch {
    // ignore
  }
  return null;
}

export default async function MarketplacePage() {
  const listing = await fetchListing();
  const manifest = listing?.manifest as {
    name?: unknown;
    description?: unknown;
    capabilities?: unknown;
    runtime?: { container?: { image?: unknown } };
  } | undefined;
  const manifestCapabilities = Array.isArray(manifest?.capabilities)
    ? manifest.capabilities.filter((cap): cap is string => typeof cap === "string")
    : [];
  const manifestRuntime =
    typeof manifest?.runtime?.container?.image === "string"
      ? manifest.runtime.container.image
      : "illuvrse/agent-grid:dev";
  const listingTheme =
    listing?.status === "canary"
      ? imageThemes.gold
      : listing?.status === "preview"
        ? imageThemes.slate
        : imageThemes.forest;
  const liveItem: CatalogItem | null = listing
    ? {
        sku: listing.sku,
        name: typeof manifest?.name === "string" ? manifest.name : listing.sku,
        description:
          typeof manifest?.description === "string"
            ? manifest.description
            : "Kernel-signed ACE agent with sandbox previews and delivery proofs.",
        price: listing.price,
        currency: listing.currency,
        status: listing.status,
        signed: listing.signed,
        sha: listing.sha256,
        tags: ["Kernel-signed", "Sandbox preview"],
        badges: listing.signed ? ["Signed", "Top Rated"] : ["Preview"],
        rating: 4.8,
        reviews: 128,
        capabilities: manifestCapabilities.length ? manifestCapabilities : ["Generator", "Catalog"],
        runtime: manifestRuntime,
        category: "ACE agent",
        image: listingTheme
      }
    : null;
  const catalog = liveItem
    ? [liveItem, ...fallbackCatalog.filter((item) => item.sku !== liveItem.sku)]
    : fallbackCatalog;
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-12">
        <section
          className="relative overflow-hidden rounded-[32px] border border-[color:var(--border)] p-8 md:p-12"
          style={heroStyles}
        >
          <div className="pointer-events-none absolute -left-20 top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.8),transparent_70%)] opacity-90 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,107,88,0.18),transparent_70%)] blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_48%,rgba(255,255,255,0.65)_55%,transparent_78%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--forest)]" />
                Marketplace drop
              </div>
              <div>
                <Pill className="bg-gold-500/20 text-gold-400">Marketplace</Pill>
                <h1 className="mt-4 text-4xl font-semibold text-[color:var(--text)] md:text-5xl">
                  Shop Kernel-signed ACE agents, bundles, and add-ons.
                </h1>
                <p className="mt-3 max-w-2xl text-lg text-[color:var(--muted)]">
                  Verified manifests, sandbox previews, and Finance-backed delivery proofs in a storefront layout built for operators.
                </p>
              </div>
              <form className="space-y-4" role="search">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3 rounded-full border border-[color:var(--border)] bg-white px-4 py-3 shadow-card focus-within:border-[color:var(--forest)] focus-within:ring-2 focus-within:ring-[color:var(--forest)]/20">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-[color:var(--forest)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 21l-4.35-4.35" />
                      <circle cx="11" cy="11" r="7" />
                    </svg>
                    <input
                      type="search"
                      placeholder="Search agents, add-ons, bundles"
                      aria-label="Search marketplace"
                      className="w-full bg-transparent text-base text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-[color:var(--forest)] px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:opacity-90"
                  >
                    Search
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  <span>Browse</span>
                  {categoryTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-[color:var(--forest)] transition hover:border-[color:var(--forest)] hover:text-[color:var(--forest)]"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </form>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/playground"
                  className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
                >
                  Try preview sandbox
                </Link>
                <Link
                  href="/developers#marketplace"
                  className="rounded-full border border-[color:var(--border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[color:var(--forest)] transition hover:border-teal-500/70"
                >
                  Listing schema
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/85 p-5 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Storefront highlights
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
                    <span>Signed manifests</span>
                    <span className="rounded-full bg-[color:var(--panel)] px-2 py-1 text-xs font-semibold text-[color:var(--forest)]">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
                    <span>Sandbox previews</span>
                    <span className="rounded-full bg-[color:var(--panel)] px-2 py-1 text-xs font-semibold text-[color:var(--forest)]">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/70 px-3 py-2">
                    <span>Delivery proofs</span>
                    <span className="rounded-full bg-[color:var(--panel)] px-2 py-1 text-xs font-semibold text-[color:var(--forest)]">
                      Finance receipts
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Popular signals
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3 text-[color:var(--text)]">
                    <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      New this week
                    </div>
                    <div className="mt-2 text-lg font-semibold">6 drops</div>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3 text-[color:var(--text)]">
                    <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      Signed ratio
                    </div>
                    <div className="mt-2 text-lg font-semibold">92%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Marketplace catalog
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                {catalog.length} items found
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--text)]">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Sort
                </span>
                <select className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-sm text-[color:var(--text)]">
                  {sortOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  View
                </span>
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]"
                >
                  Grid
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]"
                >
                  List
                </button>
              </div>
              <button
                type="button"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)] lg:hidden"
              >
                Filters
              </button>
              <MarketplaceCartDock buttonClassName="shadow-card" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[color:var(--forest)]">Filters</div>
              <button
                type="button"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]"
              >
                Clear
              </button>
            </div>
            <div className="mt-4 space-y-6">
              {filterSections.map((section) => (
                <fieldset key={section.title} className="space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    {section.title}
                  </legend>
                  <div className="space-y-2">
                    {section.options.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type={section.type}
                          name={section.name}
                          className="h-4 w-4 rounded border-slate-300 accent-[color:var(--forest)]"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            {listing ? null : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Live listing unavailable. Showing curated preview catalog.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              <span>Active filters</span>
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-[color:var(--forest)]"
                >
                  {filter}
                </span>
              ))}
              <button
                type="button"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-[11px] font-semibold text-[color:var(--forest)]"
              >
                Clear all
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {catalog.map((item) => {
                const capabilityPreview =
                  item.capabilities.length > 2
                    ? `${item.capabilities.slice(0, 2).join(", ")} +${item.capabilities.length - 2}`
                    : item.capabilities.join(", ");
                return (
                  <div
                    key={item.sku}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <div className="absolute inset-0" style={{ background: item.image.gradient }} />
                      <div
                        className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-80"
                        style={{ background: item.image.accent }}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.35),transparent_60%)]" />
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {item.badges?.map((badge) => (
                          <span
                            key={badge}
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${badgeStyles[badge] ?? "border-slate-200 bg-white text-slate-600"}`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <div className="absolute right-4 top-4 rounded-full border border-[color:var(--border)] bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]">
                        {item.category}
                      </div>
                      <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusStyles[item.status]}`}
                        >
                          {item.status}
                        </span>
                        <span className="rounded-full border border-[color:var(--border)] bg-white/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]">
                          {item.signed ? "Signed" : "Preview"}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/85 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                        <div className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--forest)]">
                          <div className="flex flex-wrap justify-center gap-2">
                            <AddToCartButton
                              item={{
                                sku: item.sku,
                                name: item.name,
                                price: item.price,
                                currency: item.currency,
                                category: item.category,
                                image: item.image
                              }}
                              className="rounded-full bg-[color:var(--forest)] px-4 py-2 text-white shadow-card transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              Add to cart
                            </AddToCartButton>
                            <button
                              type="button"
                              className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-[color:var(--forest)] transition hover:border-[color:var(--forest)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              Preview
                            </button>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-[color:var(--forest)] transition hover:border-[color:var(--forest)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-[color:var(--forest)] transition hover:border-[color:var(--forest)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              Compare
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {item.sku}
                      </div>
                      <Link
                        href="/checkout"
                        className="mt-2 text-lg font-semibold text-slate-900 transition hover:text-[color:var(--forest)]"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-2 text-sm text-slate-700 line-clamp-2">{item.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-semibold text-slate-900">${item.price}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {item.currency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {ratingStars.map((star) => (
                              <svg
                                key={star}
                                viewBox="0 0 20 20"
                                className={`h-4 w-4 ${item.rating >= star ? "text-amber-400" : "text-slate-200"}`}
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M10 15.27l4.18 2.2-1.12-4.73L17 7.97l-4.9-.42L10 3 7.9 7.55 3 7.97l3.94 4.77-1.12 4.73L10 15.27z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{item.rating.toFixed(1)}</span>
                          <span className="text-xs text-slate-500">({item.reviews})</span>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Capabilities
                          </span>
                          <span className="text-slate-900">{capabilityPreview}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Runtime
                          </span>
                          <span className="truncate font-mono text-[11px] text-slate-900" title={item.runtime}>
                            {item.runtime}
                          </span>
                        </div>
                      </div>
                      {item.tags ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                          {item.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-slate-200 px-2 py-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {item.sha ? (
                        <div className="mt-3 font-mono text-[11px] text-slate-700">SHA {item.sha}</div>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between border-t border-[color:var(--border)] bg-[color:var(--panel)]/70 px-5 py-3 text-xs text-slate-700">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Encrypted delivery
                      </span>
                      <div className="flex items-center gap-2">
                        <AddToCartButton
                          item={{
                            sku: item.sku,
                            name: item.name,
                            price: item.price,
                            currency: item.currency,
                            category: item.category,
                            image: item.image
                          }}
                          className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)] md:hidden"
                        >
                          Quick add
                        </AddToCartButton>
                        <Link
                          href="/checkout"
                          className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700"
                        >
                          View listing
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <PageSection eyebrow="Trust" title="Proofs, receipts, and reviews">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      Trust module
                    </div>
                    <h3 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                      Kernel-verified delivery chain
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      Every listing ships with signed manifests, policy checks, and Finance-backed receipts.
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]">
                    {listing?.signed ? "Verified" : "Preview"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatBadge
                    label="Signed manifest"
                    value={listing?.signed ? "Kernel verified" : "Preview"}
                    variant={listing?.signed ? "success" : "neutral"}
                  />
                  <StatBadge
                    label="Policy checks"
                    value={listing?.proof?.policyVerdict ?? "SentinelNet PASS"}
                    variant="success"
                  />
                  <StatBadge label="Receipt chain" value="Finance issued" variant="neutral" />
                  <StatBadge label="Delivery" value="Encrypted" variant="warning" />
                </div>
                <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Proof summary
                  </div>
                  <div className="mt-3">
                    <ProofCard
                      sha={listing?.proof?.sha256 ?? "d3be:11ff...9ae1"}
                      signer={listing?.proof?.signer ?? "Kernel multisig"}
                      timestamp={listing?.proof?.timestamp ?? "2025-02-03 14:48 UTC"}
                      ledgerLink={listing?.proof?.ledgerUrl ?? "/developers#ledger"}
                      policyVerdict={listing?.proof?.policyVerdict ?? "SentinelNet PASS"}
                    />
                  </div>
                </div>
                <details className="mt-4 rounded-xl border border-[color:var(--border)] bg-white/70 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[color:var(--forest)]">
                    View manifest and policy details
                  </summary>
                  <div className="mt-4">
                    {listing?.manifest ? (
                      // @ts-expect-error Server Component
                      <ManifestViewer manifest={listing.manifest as any} className="border-0 bg-transparent p-0 shadow-none" />
                    ) : (
                      <div className="text-sm text-slate-600">Manifest not available from listing.</div>
                    )}
                  </div>
                </details>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      Verified reviews
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                      Operator ratings
                    </h3>
                  </div>
                  <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)]">
                    4.7 avg
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {reviewSnippets.map((review) => (
                    <div
                      key={review.name}
                      className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{review.name}</div>
                          <div className="text-xs text-slate-500">{review.role}</div>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${review.verified ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                        >
                          {review.verified ? "Verified" : "Guest"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {ratingStars.map((star) => (
                            <svg
                              key={star}
                              viewBox="0 0 20 20"
                              className={`h-4 w-4 ${review.rating >= star ? "text-amber-400" : "text-slate-200"}`}
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M10 15.27l4.18 2.2-1.12-4.73L17 7.97l-4.9-.42L10 3 7.9 7.55 3 7.97l3.94 4.77-1.12 4.73L10 15.27z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{review.rating.toFixed(1)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">"{review.quote}"</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)] transition hover:border-[color:var(--forest)]"
                >
                  Read all reviews
                </button>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-5 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Q&amp;A</div>
                <h3 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                  Common operator questions
                </h3>
                <div className="mt-4 space-y-3">
                  {qaPairs.map((qa) => (
                    <div
                      key={qa.question}
                      className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4"
                    >
                      <div className="text-sm font-semibold text-slate-900">{qa.question}</div>
                      <p className="mt-2 text-sm text-slate-700">{qa.answer}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--forest)] transition hover:border-[color:var(--forest)]"
                >
                  Ask a question
                </button>
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection eyebrow="Add-ons" title="Bundles and packs">
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              title="Cosmetic packs"
              body={<p className="text-sm text-slate-700">Skins, armor sets, particle effects, emotes, voice filters.</p>}
            />
            <Card
              title="Personality/ability packs"
              body={<p className="text-sm text-slate-700">Trait packs, ability modules, memory expansions, lore fragments, seasonal bundles.</p>}
            />
          </div>
        </PageSection>
      </div>
    </>
  );
}
