"use client";

import { useMemo, useState } from "react";
import type { StorySummary } from "./types";
import type { TimelineClip, TimelineSchema } from "@/types/timeline";
import type { AssetItem } from "./types";

interface Props {
  story: StorySummary;
  timeline: TimelineSchema;
  assets: AssetItem[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onExport: () => void;
}

const pxPerSecond = 120;

function TimelineTrack({
  label,
  clips,
  onSelect,
  selectedId,
}: {
  label: string;
  clips: TimelineClip[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const trackLength = Math.max(...clips.map((c) => c.start + c.duration), 8);
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</div>
      <div className="relative rounded-xl bg-black/30 border border-white/10 overflow-hidden h-16">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/5 via-transparent to-transparent" />
        <div className="flex h-full" style={{ width: `${trackLength * pxPerSecond}px` }}>
          {clips.map((clip) => (
            <button
              key={clip.id}
              onClick={() => onSelect(clip.id)}
              className={`absolute top-2 h-12 rounded-lg border text-left px-3 py-2 text-xs font-semibold shadow-lg transition ${
                selectedId === clip.id ? "border-[var(--color-accent)]" : "border-white/10 hover:border-white/30"
              }`}
              style={{
                left: `${clip.start * pxPerSecond}px`,
                width: `${Math.max(clip.duration, 0.3) * pxPerSecond}px`,
                background:
                  label.toLowerCase().includes("audio") || label.toLowerCase().includes("voice")
                    ? "linear-gradient(135deg, #ffd700, #fbbf24)"
                    : label.toLowerCase().includes("text")
                    ? "linear-gradient(135deg, #67e8f9, #22d3ee)"
                    : "linear-gradient(135deg, #009688, #34d399)",
                color: "#0f172a",
              }}
            >
              <div>{clip.label || clip.id}</div>
              <div className="text-[11px] opacity-80">
                {clip.start.toFixed(1)}s – {(clip.start + clip.duration).toFixed(1)}s
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoryWorkspace({ story, timeline, assets, selectedClipId, onSelectClip, onExport }: Props) {
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(false);

  const duration = useMemo(
    () => Math.max(...timeline.tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration)), 0),
    [timeline.tracks]
  );

  return (
    <section className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4 col-span-2">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">Workspace</p>
          <h2 className="text-2xl font-serif font-semibold">{story.title}</h2>
          <p className="text-sm text-white/70">
            {story.resolution} • {story.fps} fps • {duration.toFixed(1)}s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 text-sm font-semibold"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold"
          >
            Export MP4
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        <div className="space-y-3">
          <PreviewFrame resolution={timeline.render.resolution} />

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Timeline</p>
                <p className="font-semibold">Tracks & clips</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Zoom</span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-white/70">{zoom.toFixed(1)}x</span>
              </div>
            </div>

            <div className="space-y-3" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              {timeline.tracks.map((track) => (
                <TimelineTrack
                  key={track.id}
                  label={track.label || track.id}
                  clips={track.clips}
                  selectedId={selectedClipId}
                  onSelect={onSelectClip}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Assets</p>
              <p className="font-semibold">Library drawer</p>
            </div>
            <button className="text-sm underline text-white/70">Upload media</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {assets.map((asset) => (
              <div key={asset.id} className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{asset.label}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 uppercase tracking-wide">
                    {asset.kind}
                  </span>
                </div>
                <p className="text-sm text-white/70">{asset.path}</p>
                <p className="text-xs text-white/60">{asset.duration}s</p>
                <button className="w-full text-sm font-semibold px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15">
                  Drag/Drop to timeline
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewFrame({ resolution }: { resolution: { width: number; height: number } }) {
  const aspect = resolution.width / resolution.height;
  const aspectRatio = `${resolution.width} / ${resolution.height}`;
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-black/50 to-black/20 flex items-center justify-center relative overflow-hidden" style={{ aspectRatio }}>
      <div className="absolute inset-[6%] border border-white/10 rounded-lg pointer-events-none" />
      <div className="text-center space-y-2 p-4">
        <p className="uppercase text-xs tracking-[0.3em] text-white/60">Preview</p>
        <p className="text-lg font-semibold text-white/80">Live timeline composition</p>
        <p className="text-sm text-white/60">
          Aspect {aspect.toFixed(2)} • {resolution.width}x{resolution.height}
        </p>
      </div>
    </div>
  );
}
