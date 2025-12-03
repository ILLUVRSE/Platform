export type TimelineTrackType = "video" | "audio" | "overlay" | "effect";

export interface ClipTransition {
  type: "crossfade" | "fade" | "slide" | "zoom" | "none";
  duration: number; // seconds
}

export interface TimelineClip {
  id: string;
  label?: string;
  src: string;
  start: number; // seconds from sequence start
  duration: number; // seconds on the timeline
  in?: number; // optional trim in seconds
  out?: number; // optional trim in seconds
  speed?: number; // 1 = real time, 2 = 2x faster
  opacity?: number;
  transition?: ClipTransition;
}

export interface TimelineTrack {
  id: string;
  type: TimelineTrackType;
  label?: string;
  muted?: boolean;
  locked?: boolean;
  clips: TimelineClip[];
}

export interface AudioBed {
  id: string;
  src: string;
  start?: number;
  duration?: number;
  gain?: number; // 0-1
  loop?: boolean;
}

export interface RenderSettings {
  resolution: { width: number; height: number };
  fps: number;
  format?: "mp4" | "mov";
  quality?: "draft" | "preview" | "final";
}

export interface TimelineSchema {
  projectId: string;
  timelineName?: string;
  render: RenderSettings;
  tracks: TimelineTrack[];
  audio?: AudioBed[];
  notes?: string;
  createdAt?: string;
}
