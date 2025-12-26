import { Card, PageSection, Pill } from "@illuvrse/ui";
import { jobs as defaultJobs } from "@studio/lib/jobsData";
import { readJson } from "@studio/lib/dataLoader";
import { store } from "@studio/lib/store";
import { Suspense } from "react";

async function loadJobs() {
  const stored = await store.getJobs();
  if (stored?.length) return stored;
  const data = await readJson<{ jobs: typeof defaultJobs }>("data/jobs.json", { jobs: defaultJobs });
  return data.jobs ?? defaultJobs;
}

export default function JobsPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-slate-100 text-slate-700">Jobs</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Generation queue</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
          Track StorySphere generation jobs. Previews run fast; finals run with proofs and attach to
          LiveLoop when approved.
        </p>
      </section>

      <Suspense fallback={<div>Loading jobs…</div>}>
        <JobsSection />
      </Suspense>
    </div>
  );
}

async function JobsSection() {
  const jobs = await loadJobs();
  return (
    <PageSection eyebrow="Queue" title="Recent jobs">
      <div className="grid gap-4 md:grid-cols-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            title={job.id}
            body={
              <div className="text-sm text-slate-700 space-y-2">
                <div className="font-semibold text-slate-900">{job.prompt}</div>
                <div>Status: {job.status}</div>
                {job.proof ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Proof</div>
                    <div className="text-slate-900 text-[12px] font-mono break-all">{job.proof.sha}</div>
                    <div className="text-[12px] text-teal-700">Signer: {job.proof.signer} · {job.proof.status}</div>
                  </div>
                ) : (
                  <div className="text-[12px] text-slate-500">Proof pending</div>
                )}
                {job.proofSha && (
                  <div className="text-[12px] font-mono text-slate-700 break-words">proofSha: {job.proofSha}</div>
                )}
                {job.policyVerdict && <div className="text-[12px] text-emerald-700">{job.policyVerdict}</div>}
              </div>
            }
          />
        ))}
      </div>
    </PageSection>
  );
}
