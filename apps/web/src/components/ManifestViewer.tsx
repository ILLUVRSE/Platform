import type { KernelVerifyResponse } from "@illuvrse/contracts";
import { ProofCard, Card } from "@illuvrse/ui";

type ManifestViewerProps = {
  sha: string;
  signature?: string;
  className?: string;
};

export async function ManifestViewer({ sha, signature, className }: ManifestViewerProps) {
  let proof: KernelVerifyResponse | null = null;
  let error: string | undefined;

  try {
    const res = await fetch("http://localhost:3000/api/kernel/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha256: sha, signature: signature ?? "stub" }),
      cache: "no-store"
    });
    if (res.ok) {
      proof = (await res.json()) as KernelVerifyResponse;
    } else {
      error = `verify failed ${res.status}`;
    }
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Card
      title="Manifest & Proof"
      className={className}
      body={
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Manifest SHA</div>
            <div className="font-mono text-[12px] text-cream">{sha}</div>
          </div>
          <ProofCard
            sha={proof?.sha256 ?? sha}
            signer={proof?.signer ?? "unknown"}
            timestamp={proof?.timestamp ?? "unknown"}
            ledgerLink={proof?.ledgerUrl}
            policyVerdict={proof?.policyVerdict}
            error={error}
          />
        </div>
      }
    />
  );
}
