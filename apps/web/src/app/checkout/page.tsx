import { CheckoutForm } from "./CheckoutForm";
import { ManifestViewer } from "../../components/ManifestViewer";

export default function CheckoutPage() {
  const sha = "d3be:11ff...9ae1";
  return (
    <div className="space-y-6 rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
      <h1 className="text-3xl font-semibold">Checkout (demo)</h1>
      <p className="text-slate-200/90">
        Validate the signed manifest, request Finance authorization, and release delivery after
        audit passes. This demo calls `/api/marketplace/checkout` and displays verification.
      </p>
      <CheckoutForm sha={sha} />
      <div className="grid gap-4 md:grid-cols-2">
        <ManifestViewer sha={sha} />
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200/80">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Finance + delivery</div>
          <p className="mt-2">
            Checkout calls Finance for a receipt and simulates an encrypted delivery blob with a proof. In production this will hit Finance/HSM + ArtifactPublisher.
          </p>
        </div>
      </div>
    </div>
  );
}
