import Link from "next/link";
import { Card, PageSection, Pill, ProofCard, StatBadge } from "@illuvrse/ui";
import type { MarketplaceListing } from "@illuvrse/contracts";
import { ManifestViewer } from "@/components/ManifestViewer";

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
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-gold-500/20 text-gold-400">Marketplace</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Buy ACE agents and add-ons</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
          Curated ACE agents with Kernel-signed manifests, sandbox previews, and Finance-backed delivery proofs. Add-on packs extend appearance, personality, and abilities.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/playground"
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
          >
            Try preview sandbox
          </Link>
          <Link
            href="/developers#marketplace"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
          >
            Listing schema
          </Link>
        </div>
      </section>

      <PageSection eyebrow="Catalog" title="Featured ACE agents">
        {listing ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              key={listing.sku}
              title={listing.sku}
              body={
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-900">
                      {listing.price} {listing.currency}
                    </span>
                    <Pill className="bg-slate-100 text-slate-700">{listing.status}</Pill>
                  </div>
                  <div className="font-mono text-[12px] text-slate-700">SHA {listing.sha256}</div>
                  <div className="flex items-center gap-2 text-[12px] text-slate-600">
                    <span>Signed manifest</span>
                    {listing.signed && <span className="text-teal-600">●</span>}
                  </div>
                </div>
              }
              footer={
                <Link
                  href="/checkout"
                  className="text-sm font-semibold text-teal-700 underline underline-offset-4"
                >
                  View listing
                </Link>
              }
            />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No listing available (upstream not reachable).
          </div>
        )}
      </PageSection>

      <PageSection eyebrow="Proofs" title="Show the manifest before checkout">
        <div className="grid gap-6 lg:grid-cols-2">
          <ProofCard
            sha={listing?.proof?.sha256 ?? "d3be:11ff...9ae1"}
            signer={listing?.proof?.signer ?? "Kernel multisig"}
            timestamp={listing?.proof?.timestamp ?? "2025-02-03 14:48 UTC"}
            ledgerLink="/developers#ledger"
            policyVerdict={listing?.proof?.policyVerdict ?? "SentinelNet PASS"}
          />
          <Card
            title="Checkout with Finance + ArtifactPublisher"
            body={
              <div className="space-y-3">
                <p>Finance issues receipts linked to the manifest hash; ArtifactPublisher delivers encrypted payloads post-audit.</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <StatBadge label="Sandbox previews" value="Enabled" variant="success" />
                  <StatBadge label="Audit per order" value="Yes" variant="neutral" />
                  <StatBadge label="Delivery" value="Encrypted" variant="warning" />
                </div>
                {listing?.manifest ? (
                  // @ts-expect-error Server Component
                  <ManifestViewer manifest={listing.manifest as any} />
                ) : (
                  <div className="text-sm text-slate-600">Manifest not available from listing.</div>
                )}
              </div>
            }
          />
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
  );
}
