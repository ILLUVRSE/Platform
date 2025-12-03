"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { BACKEND_URL } from "@/lib/config";
import type { TimelineClip, TimelineSchema, TimelineTrack } from "@/types/timeline";

type LibraryAsset = {
  id: string;
  label: string;
  kind: "frames" | "video" | "audio";
  path: string;
  duration: number;
  fps?: number;
};

const pxPerSecond = 160;
const rowHeight = 140;

const library: LibraryAsset[] = [
  {
    id: "seq-a",
    label: "Latent drift A (96 frames)",
    kind: "frames",
    path: "/comfyui/output/frames/demo/frame_%04d.png",
    duration: 8,
    fps: 12,
  },
  {
    id: "seq-b",
    label: "Dolly zoom loop (48 frames)",
    kind: "frames",
    path: "/comfyui/output/frames/dolly/frame_%04d.png",
    duration: 4,
    fps: 12,
  },
  {
    id: "audio-bed",
    label: "Soft ambient bed",
    kind: "audio",
    path: "/storysphere-assets/audio/soft-bed.mp3",
    duration: 30,
  },
];

function buildMockTimeline(projectId: string): TimelineSchema {
  return {
    projectId,
    timelineName: "Sample Preview",
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
        label: "Camera A",
        clips: [
          {
            id: "clip-a",
            label: "Establishing",
            src: "/comfyui/output/frames/demo/frame_0001.png",
            start: 0,
            duration: 2.5,
            transition: { type: "crossfade", duration: 0.3 },
          },
          {
            id: "clip-b",
            label: "Orbit",
            src: "/comfyui/output/frames/demo/frame_0025.png",
            start: 2.6,
            duration: 2.4,
          },
        ],
      },
      {
        id: "overlay-1",
        type: "overlay",
        label: "Overlays",
        clips: [
          {
            id: "clip-overlay",
            label: "Logo fade-in",
            src: "/storysphere-assets/overlays/logo.png",
            start: 0.2,
            duration: 1.2,
          },
        ],
      },
      {
        id: "audio-1",
        type: "audio",
        label: "VO + Music",
        clips: [
          {
            id: "clip-voice",
            label: "Narration",
            src: "/storysphere-assets/audio/narration.mp3",
            start: 0,
            duration: 5,
            transition: { type: "fade", duration: 0.4 },
          },
        ],
      },
    ],
    audio: [
      {
        id: "bed-1",
        src: "/storysphere-assets/audio/soft-bed.mp3",
        start: 0,
        duration: 30,
        gain: 0.8,
      },
    ],
    notes: "Demo timeline; export will hit /api/v1/render.",
    createdAt: new Date().toISOString(),
  };
}

function getTrackColor(type: TimelineTrack["type"]) {
  if (type === "audio") return "linear-gradient(135deg, #ffd700, #fbbf24)";
  if (type === "overlay") return "linear-gradient(135deg, #67e8f9, #22d3ee)";
  return "linear-gradient(135deg, #009688, #34d399)";
}

function timelineToFlow(timeline: TimelineSchema): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  timeline.tracks.forEach((track, trackIndex) => {
    track.clips.forEach((clip) => {
      nodes.push({
        id: clip.id,
        data: { label: clip.label || clip.id, duration: clip.duration },
        position: {
          x: Math.max(clip.start, 0) * pxPerSecond,
          y: trackIndex * rowHeight,
        },
        style: {
          width: Math.max(clip.duration, 0.25) * pxPerSecond,
          borderRadius: 12,
          padding: 12,
          color: "#0f172a",
          background: getTrackColor(track.type),
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.2)",
        },
      });
    });
  });

  return { nodes, edges };
}

function findClip(timeline: TimelineSchema, clipId: string | null) {
  if (!clipId) return null;
  for (const track of timeline.tracks) {
    const clip = track.clips.find((c) => c.id === clipId);
    if (clip) return { clip, track };
  }
  return null;
}

function getTrackEnd(clips: TimelineClip[]) {
  return clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0);
}

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId || "demo";

  const [timeline, setTimeline] = useState<TimelineSchema>(() => buildMockTimeline(projectId));
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const flowData = useMemo(() => timelineToFlow(timeline), [timeline]);
  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);

  useEffect(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
  }, [flowData, setEdges, setNodes]);

  const selectedClip = useMemo(() => findClip(timeline, selectedClipId), [selectedClipId, timeline]);

  async function handleExport() {
    setExporting(true);
    setExportStatus(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timeline),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Render failed");
      }
      const data = await resp.json();
      setExportStatus(`Render accepted (${data.renderId}) → ${data.output}`);
    } catch (err: unknown) {
      setExportStatus(err instanceof Error ? err.message : "Render failed");
    } finally {
      setExporting(false);
    }
  }

  function sendToTimeline(asset: LibraryAsset) {
    setTimeline((prev) => {
      const next: TimelineSchema = {
        ...prev,
        tracks: prev.tracks.map((t) => ({ ...t, clips: [...t.clips] })),
      };
      const target = next.tracks.find((t) =>
        asset.kind === "audio" ? t.type === "audio" : t.type === "video"
      );
      if (!target) return prev;
      const start = getTrackEnd(target.clips);
      const newClip: TimelineClip = {
        id: `${asset.kind}-${Date.now()}`,
        label: asset.label,
        src: asset.path,
        start,
        duration: asset.duration,
        transition: target.clips.length ? { type: "crossfade", duration: 0.25 } : undefined,
      };
      target.clips.push(newClip);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Link href="/storysphere" className="underline hover:text-white">
            StorySphere
          </Link>
          <span>/</span>
          <span className="font-semibold">Editor</span>
          <span>/</span>
          <span className="uppercase tracking-[0.15em] text-xs text-white/60">{projectId}</span>
        </div>
        <h1 className="text-3xl font-serif font-bold">CapCut-style Timeline</h1>
        <p className="text-white/70 max-w-3xl">
          Drop generated frame sequences, overlays, and audio beds onto the multi-track canvas.
          Export triggers the Node FFmpeg worker stub at <code>/api/v1/render</code>.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/create"
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold shadow"
          >
            Generate new sequence
          </Link>
          <a
            href="http://127.0.0.1:8188/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 transition"
          >
            Open ComfyUI
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Library</p>
              <p className="font-semibold">StorySphere Assets</p>
            </div>
            <Link href="/library" className="text-sm underline text-white/70">
              Open
            </Link>
          </div>
          <div className="space-y-3">
            {library.map((asset) => (
              <div key={asset.id} className="p-3 rounded-xl border border-white/10 bg-black/20 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{asset.label}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 uppercase tracking-wide">
                    {asset.kind}
                  </span>
                </div>
                <p className="text-sm text-white/70">{asset.path}</p>
                <p className="text-xs text-white/60">
                  {asset.duration}s {asset.fps ? `@ ${asset.fps} fps` : ""}
                </p>
                <button
                  className="text-sm font-semibold px-3 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-foreground)] w-full"
                  onClick={() => sendToTimeline(asset)}
                >
                  Send to timeline
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Timeline</p>
              <p className="font-semibold">{timeline.timelineName}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span>
                {timeline.render.resolution.width}x{timeline.render.resolution.height} @{" "}
                {timeline.render.fps} fps
              </span>
              <span className="text-white/60">{timeline.render.format?.toUpperCase()}</span>
            </div>
          </div>
          <div className="h-[520px]">
            <ReactFlow
              fitView
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              proOptions={{ hideAttribution: true }}
              onSelectionChange={(sel) => setSelectedClipId(sel?.nodes?.[0]?.id || null)}
            >
              <Background gap={12} size={1} color="rgba(255,255,255,0.08)" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Properties</p>
            <p className="font-semibold">Clip inspector</p>
          </div>
          {selectedClip ? (
            <div className="space-y-2">
              <p className="text-sm text-white/70">Track: {selectedClip.track.label || selectedClip.track.id}</p>
              <p className="text-lg font-semibold">{selectedClip.clip.label || selectedClip.clip.id}</p>
              <p className="text-sm text-white/70">Src: {selectedClip.clip.src}</p>
              <p className="text-sm">
                Start: {selectedClip.clip.start.toFixed(2)}s • Duration: {selectedClip.clip.duration.toFixed(2)}s
              </p>
              {selectedClip.clip.transition && (
                <p className="text-sm text-white/70">
                  Transition: {selectedClip.clip.transition.type} ({selectedClip.clip.transition.duration}s)
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/60">Click a block in the timeline to inspect it.</p>
          )}

          <div className="pt-2 border-t border-white/10 space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Export</p>
            <button
              disabled={exporting}
              onClick={handleExport}
              className="w-full px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-semibold"
            >
              {exporting ? "Sending to renderer…" : "Render MP4"}
            </button>
            {exportStatus && <p className="text-sm text-white/70">{exportStatus}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
