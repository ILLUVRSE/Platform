import { NextResponse } from "next/server";
import type { MarketplaceListing } from "@illuvrse/contracts";
import { callUpstream } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";

export async function GET() {
  const config = loadConfig();
  const upstream = config.marketplaceUrl;
  const upstreamRes = await callUpstream<MarketplaceListing>({
    baseUrl: upstream,
    path: "/listing",
    tokenEnv: "MARKETPLACE_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }

  const listing: MarketplaceListing = {
    sku: "agent-bundle-grid-analyst",
    price: 49,
    currency: "USD",
    sha256: "d3be:11ff...9ae1",
    status: "ready",
    signed: true,
    manifest: {
      id: "agent.bundle.grid.analyst",
      name: "Grid Analyst Bundle",
      version: "0.1.0",
      capabilities: ["generator", "catalog"],
      runtime: { container: { image: "illuvrse/agent-grid:dev" } }
    },
    proof: {
      sha256: "d3be:11ff...9ae1",
      signer: "kernel-multisig",
      timestamp: new Date().toISOString(),
      policyVerdict: "SentinelNet PASS",
      ledgerUrl: "/developers#ledger"
    }
  };

  return NextResponse.json(listing);
}
