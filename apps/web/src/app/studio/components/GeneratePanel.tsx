"use client";

import { useEffect, useState } from "react";
import { Card, Pill } from "@illuvrse/ui";

type Job = {
  id: string;
  prompt: string;
  status: string;
};

export function GeneratePanel() {
  const [prompt, setPrompt] = useState("neon harbor at dawn");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/studio/api/v1/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs ?? []))
      .catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/studio/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration: 7, publishToLiveLoop: true })
      });
      const data = await res.json();
      const newJob: Job = { id: data.jobId ?? `job-${Date.now()}`, prompt, status: data.status };
      setJobs((prev) => [newJob, ...prev]);
    } catch (e) {
      // ignore for demo
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Generate preview"
      body={
        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <label className="text-slate-200/80">Prompt</label>
            <textarea
              className="w-full rounded-xl border border-slate-600 bg-slate-900/60 p-3 text-cream outline-none focus:border-teal-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-2 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Generate 7s preview"}
          </button>
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Recent jobs</div>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2"
                >
                  <div>
                    <div className="text-cream">{job.prompt}</div>
                    <div className="text-[12px] text-slate-200/70">{job.id}</div>
                  </div>
                  <Pill className="bg-slate-700 text-slate-200 capitalize">{job.status}</Pill>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
