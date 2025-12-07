import { NextResponse } from "next/server";
import type { MarketplaceListing } from "@illuvrse/contracts";
import { callUpstream } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";

export async function POST(request: Request) {
  const listing = ((await request.json().catch(() => ({}))) as MarketplaceListing) ?? {};
  if (!listing.sha256) {
    return NextResponse.json({ error: "sha256 required" }, { status: 400 });
  }

  const config = loadConfig();
  const upstream = config.marketplaceUrl;
  const upstreamRes = await callUpstream({
    baseUrl: upstream,
    path: "/checkout",
    method: "POST",
    body: listing,
    tokenEnv: "MARKETPLACE_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }

  // Simulate Finance receipt + delivery proof
  const financeRes = await fetch("http://localhost:3000/api/finance/receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha256: listing.sha256, amount: listing.price, currency: listing.currency })
  }).catch(() => null);
  const financeJson = financeRes && financeRes.ok ? await financeRes.json() : {};

  return NextResponse.json({
    ...listing,
    status: "ready",
    receipt: {
      id: `rcpt-${Date.now()}`,
      sha256: listing.sha256,
      signed: true
    },
    finance: financeJson
  });
}
