"use client";

import { useState } from "react";
import type { StorySummary } from "./types";
import type { TimelineSchema } from "@/types/timeline";
import { findClipInTimeline } from "./types";

interface Props {
  story: StorySummary;
  timeline: TimelineSchema;
  selectedClipId: string | null;
  onChangeAspect: (preset: AspectPreset) => void;
}

type AspectPreset = {
  key: string;
  label: string;
  width: number;
  height: number;
};

const aspectPresets: AspectPreset[] = [
  { key: "16:9", label: "16:9 (1920x1080)", width: 1920, height: 1080 },
  { key: "9:16", label: "9:16 (1080x1920)", width: 1080, height: 1920 },
  { key: "1:1", label: "1:1 (1080x1080)", width: 1080, height: 1080 },
  { key: "4:5", label: "4:5 (1080x1350)", width: 1080, height: 1350 },
];

const tabs = ["Prompt", "Clip", "Story", "Workflow"] as const;

export function RightPanel({ story, timeline, selectedClipId, onChangeAspect }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Prompt");
  const clipInfo = findClipInTimeline(timeline, selectedClipId);

  return (
    <aside className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">Inspector</p>
        <p className="font-semibold">Controls</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-full text-sm font-semibold border ${
              activeTab === tab
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Prompt" && <PromptForm />}
      {activeTab === "Clip" && <ClipInspector clipInfo={clipInfo} />}
      {activeTab === "Story" && (
        <StorySettings
          story={story}
          resolution={timeline.render.resolution}
          onChangeAspect={(preset) => onChangeAspect(preset)}
        />
      )}
      {activeTab === "Workflow" && <WorkflowEmbed />}
    </aside>
  );
}

function PromptForm() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold">Prompt</label>
          <textarea className="w-full rounded-lg bg-white/5 border border-white/10 p-2" rows={3} placeholder="Neon city at night, drone orbit..." />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">Negative prompt</label>
          <textarea className="w-full rounded-lg bg-white/5 border border-white/10 p-2" rows={2} placeholder="blurry, text overlay, watermark" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Duration (s)" defaultValue="6" />
          <Field label="FPS" defaultValue="30" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select label="Style preset" options={["cinematic", "anime", "cyberpunk", "documentary"]} />
          <Select label="Camera motion" options={["orbit", "dolly in", "pan", "handheld"]} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Seed" defaultValue="random" />
          <Select label="Model" options={["sdxl_base", "realvis", "custom_checkpoint"]} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold">
          Generate new clip
        </button>
        <button className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 text-sm font-semibold">
          Regenerate selected
        </button>
        <button className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 text-sm font-semibold">
          Extend clip with AI
        </button>
      </div>
      <p className="text-xs text-white/60">Sends prompt to ComfyUI workflow and drops resulting frames onto the timeline.</p>
    </div>
  );
}

function ClipInspector({ clipInfo }: { clipInfo: ReturnType<typeof findClipInTimeline> }) {
  if (!clipInfo) {
    return <p className="text-sm text-white/60">Select a clip on the timeline to inspect properties.</p>;
  }
  const { clip, trackLabel } = clipInfo;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Clip</p>
      <p className="text-lg font-semibold">{clip.label || clip.id}</p>
      <p className="text-sm text-white/70">Track: {trackLabel}</p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Field label="Start (s)" defaultValue={clip.start.toString()} />
        <Field label="Duration (s)" defaultValue={clip.duration.toString()} />
        <Field label="Speed" defaultValue={clip.speed?.toString() || "1.0"} />
        <Field label="Opacity" defaultValue={clip.opacity?.toString() || "1"} />
      </div>
      {clip.transition && (
        <p className="text-sm text-white/70">
          Transition: {clip.transition.type} ({clip.transition.duration}s)
        </p>
      )}
      <button className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 text-sm font-semibold">
        Split / Trim
      </button>
    </div>
  );
}

function StorySettings({
  story,
  resolution,
  onChangeAspect,
}: {
  story: StorySummary;
  resolution: { width: number; height: number };
  onChangeAspect: (preset: AspectPreset) => void;
}) {
  const active =
    aspectPresets.find((p) => p.width === resolution.width && p.height === resolution.height) ?? aspectPresets[0];
  return (
    <div className="space-y-2 text-sm">
      <Select
        label="Aspect / Resolution"
        options={aspectPresets.map((p) => p.label)}
        value={active.label}
        onChange={(label) => {
          const preset = aspectPresets.find((p) => p.label === label);
          if (preset) onChangeAspect(preset);
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Width" defaultValue={resolution.width.toString()} disabled />
        <Field label="Height" defaultValue={resolution.height.toString()} disabled />
      </div>
      <Field label="FPS" defaultValue={story.fps.toString()} disabled />
      <Select label="Default transition" options={["crossfade", "fade", "zoom"]} />
      <Select label="Render quality" options={["fast", "preview", "high"]} />
      <button className="mt-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm font-semibold">
        Save settings
      </button>
    </div>
  );
}

function WorkflowEmbed() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">
        Power users can open the ComfyUI workflow without leaving StorySphere. The iframe below points to{" "}
        <code>http://127.0.0.1:8188/</code>.
      </p>
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/50">
        <iframe src="http://127.0.0.1:8188/" className="w-full h-[360px]" title="ComfyUI" />
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  disabled,
}: {
  label: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</span>
      <input
        defaultValue={defaultValue}
        disabled={disabled}
        className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm disabled:opacity-60"
      />
    </label>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</span>
      <select
        className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}
