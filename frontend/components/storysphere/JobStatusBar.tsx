import type { JobItem } from "./types";

interface Props {
  jobs: JobItem[];
}

const statusColors: Record<string, string> = {
  running: "bg-amber-400/20 text-amber-100",
  queued: "bg-white/10 text-white",
  done: "bg-emerald-400/20 text-emerald-100",
  failed: "bg-red-500/20 text-red-100",
};

export function JobStatusBar({ jobs }: Props) {
  if (!jobs.length) return null;
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3 flex items-center gap-3">
      <p className="text-xs uppercase tracking-[0.25em] text-white/60">Jobs</p>
      <div className="flex gap-2 overflow-x-auto">
        {jobs.map((job) => (
          <div key={job.id} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 min-w-[220px]">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold">{job.label}</p>
              <span className={`text-[11px] px-2 py-1 rounded-full ${statusColors[job.status] || "bg-white/10"}`}>
                {job.status}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-[var(--color-accent)]" style={{ width: `${job.progress}%` }} />
            </div>
            <p className="text-xs text-white/60 mt-1">{job.progress}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
