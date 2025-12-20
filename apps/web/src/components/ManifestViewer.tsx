import type { AceAgentManifest, KernelVerifyResponse } from "@illuvrse/contracts";
import { ProofCard, Card } from "@illuvrse/ui";
import crypto from "crypto";

type ManifestViewerProps = {
  manifest: AceAgentManifest;
  className?: string;
};

function computeSha(manifest: AceAgentManifest): string {
  const { signing: _omit, ...rest } = manifest;
  const payload = JSON.stringify(rest);
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function summarize(manifest: AceAgentManifest) {
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    capabilities: manifest.capabilities.join(", "),
    triggers: manifest.triggers?.map((t) => t.type).join(", ") ?? "none",
    runtime: manifest.runtime.container.image,
  };
}

export async function ManifestViewer({ manifest, className }: ManifestViewerProps) {
  const sha = computeSha(manifest);
  let proof: KernelVerifyResponse | null = null;
  let error: string | undefined;
  let policy: any = null;

  try {
    const res = await fetch("/api/kernel/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha256: sha, signature: manifest.signing?.proof?.signature ?? "stub-signature" }),
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

  try {
    const policyRes = await fetch("/api/sentinel/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest }),
      cache: "no-store"
    });
    if (policyRes.ok) {
      policy = await policyRes.json();
    }
  } catch (e) {
    // ignore policy errors for display
  }

  const summary = summarize(manifest);

  return (
    <Card
      title="Manifest & Proof"
      className={className}
      body={
        <div className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Identity</div>
              <div className="font-semibold text-slate-900">
                {summary.name} <span className="text-slate-500">({summary.version})</span>
              </div>
              <div className="text-xs text-slate-500">{summary.id}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Runtime</div>
              <div className="font-mono text-[12px] text-slate-900">{summary.runtime}</div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Capabilities</div>
              <div className="text-slate-900">{summary.capabilities}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Triggers</div>
              <div className="text-slate-900">{summary.triggers}</div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Manifest SHA</div>
            <div className="font-mono text-[12px] text-slate-900 break-all">{sha}</div>
          </div>
          <ProofCard
            sha={proof?.sha256 ?? sha}
            signer={proof?.signer ?? "unknown"}
            timestamp={proof?.timestamp ?? "unknown"}
            ledgerLink={proof?.ledgerUrl}
            policyVerdict={proof?.policyVerdict}
            error={error}
          />
          {policy ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Policy verdict</div>
              <div className="text-slate-900 text-sm">
                {policy.verdict} · {policy.severity}
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                {policy.rules?.map((rule: any) => (
                  <div key={rule.id} className="flex items-center justify-between gap-2">
                    <span>{rule.id}</span>
                    <span className="font-semibold text-teal-700">{rule.result}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Manifest JSON</div>
            <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-900">
              {JSON.stringify(manifest, null, 2)}
            </pre>
          </div>
        </div>
      }
    />
  );
}
