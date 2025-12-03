import type { TimelineClip, TimelineSchema } from "@/types/timeline";

export type StoryStatus = "draft" | "generating" | "editing" | "rendering" | "done" | "error";

export interface StorySummary {
  id: string;
  title: string;
  duration: number; // seconds
  status: StoryStatus;
  resolution: string;
  fps: number;
  updatedAt: string;
  thumbnail?: string;
  tags?: string[];
}

export interface StorySelection {
  storyId: string;
  clipId: string | null;
}

export interface AssetItem {
  id: string;
  label: string;
  kind: "generated" | "upload" | "audio" | "template";
  path: string;
  duration: number;
}

export interface JobItem {
  id: string;
  type: "generation" | "render";
  label: string;
  progress: number; // 0-100
  status: "queued" | "running" | "done" | "failed";
}

export type StoryData = {
  summary: StorySummary;
  timeline: TimelineSchema;
  assets: AssetItem[];
};

export function findClipInTimeline(timeline: TimelineSchema, clipId: string | null): {
  clip: TimelineClip;
  trackLabel: string;
} | null {
  if (!clipId) return null;
  for (const track of timeline.tracks) {
    const clip = track.clips.find((c) => c.id === clipId);
    if (clip) return { clip, trackLabel: track.label || track.id };
  }
  return null;
}
