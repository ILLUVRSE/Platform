"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StorySidebar } from "@/components/storysphere/StorySidebar";
import { StoryWorkspace } from "@/components/storysphere/StoryWorkspace";
import { RightPanel } from "@/components/storysphere/RightPanel";
import { JobStatusBar } from "@/components/storysphere/JobStatusBar";
import { mockJobs, mockStories, mockStoryData } from "@/components/storysphere/mockData";
import type { StoryData } from "@/components/storysphere/types";

export default function StorySpherePage() {
  const [storyMap, setStoryMap] = useState<Record<string, StoryData>>(mockStoryData);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(mockStories[0]?.id || "");
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const selected: StoryData | null = useMemo(() => storyMap[selectedStoryId] || null, [storyMap, selectedStoryId]);

  function handleExport() {
    setExportStatus("Export queued → FFmpeg worker (stub).");
    setTimeout(() => setExportStatus(null), 3500);
  }

  if (!selected) {
    return (
      <div className="space-y-6">
        <StorySphereHeader />
        <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center space-y-3 bg-black/20">
          <p className="text-2xl font-serif font-semibold">Create your first Story</p>
          <p className="text-white/70">Start from a prompt, blank timeline, or import footage.</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/create"
              className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold"
            >
              New story from prompt
            </Link>
            <button className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5">New blank timeline</button>
            <button className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5">Import footage</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StorySphereHeader exportStatus={exportStatus} />

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr_360px] gap-4">
        <StorySidebar
          stories={mockStories}
          selectedId={selectedStoryId}
          onSelect={(id) => {
            setSelectedStoryId(id);
            setSelectedClipId(null);
          }}
          onNew={() => setSelectedStoryId(mockStories[0]?.id || "")}
        />

        <StoryWorkspace
          story={selected.summary}
          timeline={selected.timeline}
          assets={selected.assets}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onExport={handleExport}
        />

        <RightPanel
          story={selected.summary}
          timeline={selected.timeline}
          selectedClipId={selectedClipId}
          onChangeAspect={(preset) => {
            setStoryMap((prev) => {
              const next = { ...prev };
              const current = next[selectedStoryId];
              if (!current) return prev;
              next[selectedStoryId] = {
                ...current,
                summary: { ...current.summary, resolution: preset.label },
                timeline: {
                  ...current.timeline,
                  render: {
                    ...current.timeline.render,
                    resolution: { width: preset.width, height: preset.height },
                  },
                },
              };
              return next;
            });
          }}
        />
      </div>

      <JobStatusBar jobs={mockJobs} />
    </div>
  );
}

function StorySphereHeader({ exportStatus }: { exportStatus?: string | null }) {
  return (
    <header className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="uppercase text-xs tracking-[0.3em] text-white/60">StorySphere</p>
          <h1 className="text-3xl font-serif font-bold">Prompt-to-video editor for Illuvrse</h1>
          <p className="text-white/75 max-w-3xl">
            Generate frame sequences, arrange them on the CapCut-style timeline, and render to MP4 without leaving this
            workspace.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/create"
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold"
          >
            New story from prompt
          </Link>
          <a
            href="http://127.0.0.1:8188/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5"
          >
            Open ComfyUI canvas
          </a>
          <button className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5">Upload media</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 font-semibold">
          ✅ ComfyUI online (127.0.0.1:8188)
        </span>
        <span className="px-3 py-1 rounded-full bg-white/10 text-white/80">FFmpeg render node: stubbed</span>
        {exportStatus && <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-100">{exportStatus}</span>}
      </div>
    </header>
  );
}
