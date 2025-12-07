import { Card, PageSection, Pill } from "@illuvrse/ui";
import { jobs as defaultJobs } from "../../lib/jobsData";
import { readJson } from "../../lib/dataLoader";
import { Suspense } from "react";

async function loadJobs() {
  const data = await readJson<{ jobs: typeof defaultJobs }>("data/jobs.json", { jobs: defaultJobs });
  return data.jobs ?? defaultJobs;
}

export default function JobsPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-slate-700 text-cream">Jobs</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Generation queue</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
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
              <div className="text-sm text-slate-200/80">
                <div className="font-semibold text-cream">{job.prompt}</div>
                <div>Status: {job.status}</div>
              </div>
            }
          />
        ))}
      </div>
    </PageSection>
  );
}
