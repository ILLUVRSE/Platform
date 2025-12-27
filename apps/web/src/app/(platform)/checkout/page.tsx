import { CheckoutForm } from "./CheckoutForm";
import { ManifestViewer } from "@/components/ManifestViewer";
import type { AceAgentManifest } from "@illuvrse/contracts";
import crypto from "crypto";
import { buildMetadata, buildJsonLd } from "@/lib/metadata";

const title = "Checkout | Marketplace demo";
const description =
  "Demo checkout flow for signed manifests, Finance receipts, and ArtifactPublisher delivery.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/checkout",
  noIndex: true
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/checkout",
  type: "WebPage"
});

const checkoutManifest: AceAgentManifest = {
  id: "agent.grid-analyst.bundle",
  name: "Grid Analyst Bundle",
  version: "1.0.0",
  archetype: "Analyst",
  capabilities: ["catalog", "assistant", "monitor"],
  triggers: [{ type: "http", path: "/metrics", method: "POST" }],
  runtime: { container: { image: "illuvrse/grid-analyst:latest" } },
  metadata: { owner: "marketplace", region: "us-west-2" }
};

const sha = crypto
  .createHash("sha256")
  .update(JSON.stringify({ ...checkoutManifest, signing: undefined }))
  .digest("hex");

export default function CheckoutPage() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <h1 className="text-3xl font-semibold">Checkout (demo)</h1>
        <p className="text-slate-700">
          Validate the signed manifest, send a Stripe payment, request a Finance receipt, and
          release an encrypted artifact link after proofs pass. This demo calls
          `/api/marketplace/checkout`, then surfaces payment status, manifest proof, encrypted
          delivery metadata, and post-purchase verification.
        </p>
        <CheckoutForm sha={sha} />
        <div className="grid gap-4 md:grid-cols-2">
          {/* @ts-expect-error Server Component */}
          <ManifestViewer manifest={checkoutManifest} />
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Finance + delivery</div>
            <p className="mt-2">
              Checkout calls Finance for a receipt and simulates an encrypted delivery blob with a
              proof. In production this will hit Finance/HSM + ArtifactPublisher and return a
              download token that can be verified before decryption.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
