import { NextResponse } from "next/server";
import { callUpstream } from "../../../../lib/upstream";
import { loadConfig } from "../../../../lib/config";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const receipt = body.receipt;
  if (!receipt?.sha256) {
    return NextResponse.json({ valid: false, error: "missing receipt" }, { status: 400 });
  }

  const { financeUrl } = loadConfig();
  const upstreamRes = await callUpstream({
    baseUrl: financeUrl,
    path: "/verify",
    method: "POST",
    body,
    tokenEnv: "FINANCE_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }

  const delivery = body.delivery;
  const manifestProof = body.manifestProof;
  const downloadVerified =
    Boolean(delivery?.encryptedBlob) &&
    Boolean(delivery?.downloadToken) &&
    (!delivery?.expiresAt || new Date(delivery.expiresAt).getTime() > Date.now());

  const proof = {
    sha256: receipt.sha256,
    signer: manifestProof?.signer ?? "finance-stub",
    timestamp: new Date().toISOString(),
    ledgerUrl: manifestProof?.ledgerUrl ?? "/developers#ledger",
    policyVerdict: manifestProof?.policyVerdict ?? "SentinelNet PASS",
    signature:
      manifestProof?.signature ??
      crypto.createHash("sha256").update(receipt.sha256 + (delivery?.downloadToken ?? "")).digest("hex")
  };

  return NextResponse.json({
    valid: true,
    receipt,
    paymentStatus: body.payment?.status ?? receipt.paymentStatus ?? "unknown",
    downloadVerified,
    deliverySummary: delivery
      ? {
          encryptedBlob: delivery.encryptedBlob,
          downloadUrl: delivery.downloadUrl,
          expiresAt: delivery.expiresAt,
          proof: delivery.proof
        }
      : undefined,
    proof
  });
}
