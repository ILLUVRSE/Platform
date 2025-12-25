"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Pill } from "@illuvrse/ui";

type Job = {
  id: string;
  prompt: string;
  status: string;
};

export function GeneratePanel() {
  const searchParams = useSearchParams();
  const promptFromQuery = searchParams.get("prompt")?.trim();
  const [prompt, setPrompt] = useState(promptFromQuery || "neon harbor at dawn");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (promptFromQuery) {
      setPrompt(promptFromQuery);
    }
  }, [promptFromQuery]);

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
            <label className="text-slate-700">Prompt</label>
            <textarea
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-teal-500"
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
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent jobs</div>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <div className="text-slate-900">{job.prompt}</div>
                    <div className="text-[12px] text-slate-500">{job.id}</div>
                  </div>
                  <Pill className="bg-slate-100 text-slate-700 capitalize">{job.status}</Pill>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
