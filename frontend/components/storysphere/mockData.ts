import type { StoryData, StorySummary, AssetItem, JobItem } from "./types";
import type { TimelineSchema } from "@/types/timeline";

const baseTimeline: TimelineSchema = {
  projectId: "demo",
  timelineName: "Neon City Loop",
  render: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    format: "mp4",
    quality: "preview",
  },
  tracks: [
    {
      id: "video-1",
      type: "video",
      label: "Video 1",
      clips: [
        {
          id: "clip-1",
          label: "Intro glide",
          src: "/comfyui/output/frames/demo/frame_0001.png",
          start: 0,
          duration: 2.5,
          transition: { type: "crossfade", duration: 0.3 },
        },
        {
          id: "clip-2",
          label: "Downtown orbit",
          src: "/comfyui/output/frames/demo/frame_0025.png",
          start: 2.6,
          duration: 3.0,
        },
      ],
    },
    {
      id: "video-2",
      type: "overlay",
      label: "Text / titles",
      clips: [
        {
          id: "clip-3",
          label: "Title card",
          src: "/storysphere-assets/overlays/title.png",
          start: 0.4,
          duration: 1.2,
        },
      ],
    },
    {
      id: "audio-1",
      type: "audio",
      label: "Audio",
      clips: [
        {
          id: "clip-4",
          label: "Narration",
          src: "/storysphere-assets/audio/narration.mp3",
          start: 0,
          duration: 6,
          transition: { type: "fade", duration: 0.4 },
        },
      ],
    },
  ],
  audio: [
    { id: "bed", src: "/storysphere-assets/audio/soft-bed.mp3", start: 0, duration: 30, gain: 0.8 },
  ],
  notes: "Mock timeline for the StorySphere workspace.",
  createdAt: new Date().toISOString(),
};

const stories: StorySummary[] = [
  {
    id: "demo",
    title: "Neon City Loop",
    duration: 12,
    status: "editing",
    resolution: "1080p",
    fps: 30,
    updatedAt: "2h ago",
    tags: ["sci-fi", "loop"],
  },
  {
    id: "dreamscape",
    title: "Dreamscape River",
    duration: 18,
    status: "rendering",
    resolution: "4K",
    fps: 24,
    updatedAt: "12m ago",
    tags: ["fantasy"],
  },
  {
    id: "dusk-aerial",
    title: "Aerial at Dusk",
    duration: 9,
    status: "draft",
    resolution: "1080p",
    fps: 30,
    updatedAt: "1d ago",
  },
];

const assets: AssetItem[] = [
  {
    id: "asset-1",
    label: "Latent drift (96f)",
    kind: "generated",
    path: "/comfyui/output/frames/demo/frame_%04d.png",
    duration: 8,
  },
  {
    id: "asset-2",
    label: "Orbit loop",
    kind: "generated",
    path: "/comfyui/output/frames/demo_orbit/frame_%04d.png",
    duration: 6,
  },
  {
    id: "asset-3",
    label: "Ambient bed",
    kind: "audio",
    path: "/storysphere-assets/audio/soft-bed.mp3",
    duration: 30,
  },
  {
    id: "asset-4",
    label: "Uploaded skyline.mp4",
    kind: "upload",
    path: "/uploads/skyline.mp4",
    duration: 14,
  },
];

const jobs: JobItem[] = [
  { id: "job-1", type: "render", label: "Rendering Dreamscape River", progress: 42, status: "running" },
  { id: "job-2", type: "generation", label: "Generating Dusk aerial", progress: 15, status: "running" },
];

export const mockStoryData: Record<string, StoryData> = {
  demo: { summary: stories[0], timeline: baseTimeline, assets },
  dreamscape: { summary: stories[1], timeline: baseTimeline, assets },
  "dusk-aerial": { summary: stories[2], timeline: baseTimeline, assets },
};

export const mockStories = stories;
export const mockJobs = jobs;
