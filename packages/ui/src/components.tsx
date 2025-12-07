import type { ReactNode } from "react";

type Classable = { className?: string };

export function PageSection({
  title,
  eyebrow,
  cta,
  children,
  className,
  id
}: {
  title: string;
  eyebrow?: string;
  cta?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-slate-600/60 bg-slate-800/60 p-8 shadow-card ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <div className="mb-2 inline-flex rounded-full bg-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-teal-400">
              {eyebrow}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-cream md:text-3xl">{title}</h2>
        </div>
        {cta}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Pill({ children, className }: { children: ReactNode } & Classable) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-1 text-sm text-cream ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

export function Card({
  title,
  body,
  footer,
  className
}: {
  title: string;
  body: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-slate-600 bg-slate-800/80 p-5 shadow-card ${className ?? ""}`}
    >
      <div className="text-lg font-semibold text-cream">{title}</div>
      <div className="mt-3 flex-1 text-sm text-slate-200/90">{body}</div>
      {footer && <div className="mt-4 text-sm text-cream">{footer}</div>}
    </div>
  );
}

export function StatBadge({
  label,
  value,
  variant = "neutral"
}: {
  label: string;
  value: string;
  variant?: "neutral" | "success" | "warning";
}) {
  const styles =
    variant === "success"
      ? "bg-teal-600/30 text-teal-200 border-teal-500/60"
      : variant === "warning"
        ? "bg-gold-500/20 text-gold-400 border-gold-500/60"
        : "bg-slate-700 text-slate-200 border-slate-500";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}>
      <div className="text-[11px] uppercase tracking-[0.15em] text-slate-200/70">{label}</div>
      <div className="text-lg">{value}</div>
    </div>
  );
}

export function ProofCard({
  sha,
  signer,
  timestamp,
  ledgerLink,
  policyVerdict,
  error
}: {
  sha: string;
  signer: string;
  timestamp: string;
  ledgerLink?: string;
  policyVerdict?: string;
  error?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-4 text-sm shadow-card ${error ? "border-red-500/70 bg-red-950/50 text-red-100" : "border-slate-600 bg-slate-800/80 text-slate-200"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Artifact proof</div>
        {policyVerdict && (
          <span className="rounded-full bg-teal-600/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-teal-100">
            {policyVerdict}
          </span>
        )}
      </div>
      {error ? (
        <div className="text-[12px]">{error}</div>
      ) : (
        <>
          <div className="font-mono text-[12px] text-cream">{sha}</div>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-200/80">
            <span>Signed by {signer}</span>
            <span className="h-3 w-px bg-slate-600" />
            <span>{timestamp}</span>
            {ledgerLink && (
              <>
                <span className="h-3 w-px bg-slate-600" />
                <a className="text-teal-300 underline" href={ledgerLink}>
                  Ledger proof
                </a>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
