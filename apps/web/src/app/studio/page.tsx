"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { Pill } from "@illuvrse/ui";
import {
  defaultStudioProject,
  type StudioClip,
  type StudioProject,
  type StudioTrack
} from "@studio/lib/studioProject";
import {
  defaultEpisodePlan,
  type EpisodePlan,
  type EpisodeScene,
  type EpisodeShot
} from "@studio/lib/episodePlan";
import type { Job } from "@studio/lib/jobsData";

type SelectedClip = {
  trackId: string;
  clipId: string;
} | null;

type DragPayload = {
  trackId: string;
  clipId: string;
} | null;

type SceneDragPayload = {
  sceneId: string;
} | null;

type ShotDragPayload = {
  sceneId: string;
  shotId: string;
} | null;

type LatestMedia = {
  fileName: string;
  title: string;
  sizeBytes: number;
  mtimeMs: number;
  previewUrl: string;
};

const MIN_CLIP_WIDTH = 4;
const MAX_CLIP_WIDTH = 80;
const SAVE_DELAY_MS = 700;
const TIMELINE_SECONDS = 18;

const formatTimecode = (value: number) => {
  const totalSeconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const buildClipTimings = (track: StudioTrack) => {
  let offset = 0;
  return track.clips.map((clip, index) => {
    const startSeconds = (offset / 100) * TIMELINE_SECONDS;
    const durationSeconds = (clip.width / 100) * TIMELINE_SECONDS;
    const endSeconds = startSeconds + durationSeconds;
    offset += clip.width;
    return { clip, index, startSeconds, endSeconds, durationSeconds };
  });
};

const toMinutes = (seconds: number) => Math.round((seconds / 60) * 100) / 100;
const toSeconds = (minutes: number) => Math.max(0, Math.round(minutes * 60));

const sceneStatusOptions = ["outline", "boards", "animatic", "render", "final"] as const;
const shotStatusOptions = ["draft", "boards", "animatic", "render", "final"] as const;

const providers = [
  {
    name: "CapCut",
    role: "Edit",
    status: "Timeline ready",
    tone: "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40"
  },
  {
    name: "ElevenLabs",
    role: "Voice",
    status: "Dub tracks",
    tone: "bg-sky-400/20 text-sky-200 ring-1 ring-sky-400/40"
  },
  {
    name: "Stable Diffusion",
    role: "Frames",
    status: "Style pass",
    tone: "bg-violet-400/20 text-violet-200 ring-1 ring-violet-400/40"
  },
  {
    name: "Sora",
    role: "Video",
    status: "Scene gen",
    tone: "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/40"
  }
];

const colorOptions = [
  { label: "Emerald", value: "bg-emerald-400/70" },
  { label: "Teal", value: "bg-teal-400/70" },
  { label: "Violet", value: "bg-violet-400/70" },
  { label: "Indigo", value: "bg-indigo-400/70" },
  { label: "Cyan", value: "bg-cyan-400/70" },
  { label: "Amber", value: "bg-amber-400/70" }
];

const audioMix = [
  { label: "ElevenLabs VO", value: 76 },
  { label: "Atmos bed", value: 58 },
  { label: "FX hits", value: 44 }
];

const defaultTrackColor: Record<string, string> = {
  video: "bg-emerald-400/70",
  frames: "bg-violet-400/70",
  voice: "bg-sky-400/70",
  captions: "bg-amber-400/70"
};

const normalizeTrackClips = (clips: StudioClip[], fixedClipId?: string | null) => {
  if (clips.length === 0) return clips;

  const clampWidth = (value: number) => Math.max(MIN_CLIP_WIDTH, value);
  const total = clips.reduce((sum, clip) => sum + clip.width, 0);
  const targetId = fixedClipId ?? clips[clips.length - 1].id;

  if (!fixedClipId || clips.length === 1) {
    const factor = total === 0 ? 0 : 100 / total;
    const normalized = clips.map((clip) => ({
      ...clip,
      width: clampWidth(Math.round(clip.width * factor))
    }));
    const diff = 100 - normalized.reduce((sum, clip) => sum + clip.width, 0);
    if (diff === 0) return normalized;
    return normalized.map((clip) =>
      clip.id === targetId ? { ...clip, width: clampWidth(clip.width + diff) } : clip
    );
  }

  const fixedClip = clips.find((clip) => clip.id === fixedClipId);
  if (!fixedClip) return normalizeTrackClips(clips);

  const remaining = Math.max(0, 100 - fixedClip.width);
  const others = clips.filter((clip) => clip.id !== fixedClipId);
  const othersTotal = others.reduce((sum, clip) => sum + clip.width, 0);
  const normalizedOthers = others.map((clip) => ({
    ...clip,
    width: clampWidth(
      Math.round(othersTotal > 0 ? (clip.width / othersTotal) * remaining : remaining / others.length)
    )
  }));

  const combined = clips.map((clip) =>
    clip.id === fixedClipId ? fixedClip : normalizedOthers.find((item) => item.id === clip.id)!
  );
  const combinedTotal = combined.reduce((sum, clip) => sum + clip.width, 0);
  const diff = 100 - combinedTotal;
  if (diff === 0) return combined;

  return combined.map((clip) =>
    clip.id === targetId ? { ...clip, width: clampWidth(clip.width + diff) } : clip
  );
};

const normalizeAllTracks = (tracks: StudioTrack[]) =>
  tracks.map((track) => ({ ...track, clips: normalizeTrackClips(track.clips) }));

const deriveTitle = (prompt: string) => {
  const base = prompt.split(",")[0]?.trim();
  if (!base) return "New Scene";
  return base.length > 30 ? `${base.slice(0, 30).trim()}...` : base;
};

const getDragPayload = (event: DragEvent<HTMLElement>): DragPayload => {
  const raw =
    event.dataTransfer.getData("application/x-illuvrse-clip") ||
    event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as DragPayload;
    if (payload?.trackId && payload?.clipId) return payload;
    return null;
  } catch {
    return null;
  }
};

const getSceneDragPayload = (event: DragEvent<HTMLElement>): SceneDragPayload => {
  const raw =
    event.dataTransfer.getData("application/x-illuvrse-scene") ||
    event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as SceneDragPayload;
    if (payload?.sceneId) return payload;
    return null;
  } catch {
    return null;
  }
};

const getShotDragPayload = (event: DragEvent<HTMLElement>): ShotDragPayload => {
  const raw =
    event.dataTransfer.getData("application/x-illuvrse-shot") ||
    event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as ShotDragPayload;
    if (payload?.sceneId && payload?.shotId) return payload;
    return null;
  } catch {
    return null;
  }
};

export default function StorySphereStudioPage() {
  const [promptText, setPromptText] = useState(defaultStudioProject.prompt);
  const [projectTitle, setProjectTitle] = useState(defaultStudioProject.title);
  const [promptApplied, setPromptApplied] = useState(true);
  const [tracks, setTracks] = useState<StudioTrack[]>(normalizeAllTracks(defaultStudioProject.tracks));
  const [episodePlan, setEpisodePlan] = useState<EpisodePlan>(defaultEpisodePlan);
  const [selectedClip, setSelectedClip] = useState<SelectedClip>(
    defaultStudioProject.tracks[0]?.clips[0]
      ? { trackId: defaultStudioProject.tracks[0].id, clipId: defaultStudioProject.tracks[0].clips[0].id }
      : null
  );
  const [draggedClip, setDraggedClip] = useState<DragPayload>(null);
  const [dragOverClip, setDragOverClip] = useState<DragPayload>(null);
  const [draggedScene, setDraggedScene] = useState<SceneDragPayload>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);
  const [draggedShot, setDraggedShot] = useState<ShotDragPayload>(null);
  const [dragOverShot, setDragOverShot] = useState<ShotDragPayload>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [latestMedia, setLatestMedia] = useState<LatestMedia | null>(null);
  const [generateState, setGenerateState] = useState<"idle" | "submitting" | "error">("idle");
  const [previewError, setPreviewError] = useState(false);
  const [queueingShots, setQueueingShots] = useState<Record<string, boolean>>({});
  const [queueingScenes, setQueueingScenes] = useState<Record<string, boolean>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobStatusRef = useRef<Record<string, Job["status"]>>({});
  const pendingCompleteRef = useRef<Set<string>>(new Set());
  const jobClipMapRef = useRef<Map<string, { trackId: string; clipId: string }>>(new Map());
  const hasSeenJobsRef = useRef(false);

  const selected = useMemo(() => {
    if (!selectedClip) return null;
    const track = tracks.find((item) => item.id === selectedClip.trackId);
    if (!track) return null;
    const clip = track.clips.find((item) => item.id === selectedClip.clipId);
    if (!clip) return null;
    return { track, clip };
  }, [selectedClip, tracks]);

  const assets = useMemo(
    () => [
      { name: projectTitle, type: "Scene", length: "00:18" },
      { name: "Neon Harbor", type: "B-roll", length: "00:06" },
      { name: "Dockwide Foley", type: "Audio", length: "00:24" },
      { name: "Warm VO", type: "Voice", length: "00:21" },
      { name: "Fog Pass", type: "FX", length: "00:08" },
      { name: "Title Card", type: "Graphic", length: "00:04" }
    ],
    [projectTitle]
  );

  const queueItems = useMemo(() => jobs.slice(0, 6), [jobs]);

  const videoTrack = useMemo(
    () => tracks.find((track) => track.id === "video") ?? tracks[0],
    [tracks]
  );

  const shotDeck = useMemo(() => (videoTrack ? buildClipTimings(videoTrack) : []), [videoTrack]);

  const selectedTiming = useMemo(() => {
    if (!selected) return null;
    const timings = buildClipTimings(selected.track);
    return timings.find((item) => item.clip.id === selected.clip.id) ?? null;
  }, [selected]);

  const projectMetrics = useMemo(() => {
    const videoClips = videoTrack?.clips.length ?? 0;
    return [
      {
        label: "Scene runtime",
        value: formatTimecode(TIMELINE_SECONDS),
        detail: "Normalized timeline",
        tone: "bg-gradient-to-br from-amber-50 via-white to-teal-50"
      },
      {
        label: "Shots",
        value: `${videoClips}`,
        detail: "Video track",
        tone: "bg-gradient-to-br from-teal-50 via-white to-sky-50"
      },
      {
        label: "Tracks",
        value: `${tracks.length}`,
        detail: "Layer stack",
        tone: "bg-gradient-to-br from-slate-50 via-white to-emerald-50"
      },
      {
        label: "Assets",
        value: `${assets.length}`,
        detail: "On deck",
        tone: "bg-gradient-to-br from-rose-50 via-white to-amber-50"
      }
    ];
  }, [assets.length, tracks.length, videoTrack]);

  const episodeStats = useMemo(() => {
    const sceneSeconds = episodePlan.scenes.reduce((sum, scene) => sum + scene.targetDuration, 0);
    const shotSeconds = episodePlan.scenes.reduce(
      (sum, scene) => sum + scene.shots.reduce((shotSum, shot) => shotSum + shot.duration, 0),
      0
    );
    const shotCount = episodePlan.scenes.reduce((sum, scene) => sum + scene.shots.length, 0);
    const plannedSeconds = shotSeconds > 0 ? shotSeconds : sceneSeconds;
    const progress =
      episodePlan.runtimeTarget > 0
        ? Math.min(1, plannedSeconds / episodePlan.runtimeTarget)
        : 0;

    return {
      sceneSeconds,
      shotSeconds,
      plannedSeconds,
      sceneCount: episodePlan.scenes.length,
      shotCount,
      progress,
      deltaSeconds: plannedSeconds - episodePlan.runtimeTarget
    };
  }, [episodePlan]);

  const runtimeDeltaTone =
    episodeStats.deltaSeconds > 0
      ? "text-amber-300"
      : episodeStats.deltaSeconds < 0
      ? "text-emerald-300"
      : "text-slate-300";
  const runtimeDeltaLabel = `${episodeStats.deltaSeconds >= 0 ? "+" : "-"}${formatTimecode(
    Math.abs(episodeStats.deltaSeconds)
  )}`;

  useEffect(() => {
    let active = true;
    const loadProject = async () => {
      try {
        const response = await fetch("/studio/api/v1/studio", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load studio data");
        const data = (await response.json()) as { project?: StudioProject; episode?: EpisodePlan };
        const project = data.project ?? defaultStudioProject;
        const episode = data.episode ?? defaultEpisodePlan;
        if (!active) return;
        setProjectTitle(project.title ?? defaultStudioProject.title);
        setPromptText(project.prompt ?? defaultStudioProject.prompt);
        const normalized = normalizeAllTracks(project.tracks ?? defaultStudioProject.tracks);
        setTracks(normalized);
        setEpisodePlan(episode);
        setPromptApplied(true);
        const firstTrack = normalized[0];
        const firstClip = firstTrack?.clips[0];
        setSelectedClip(firstClip ? { trackId: firstTrack.id, clipId: firstClip.id } : null);
      } catch {
        if (!active) return;
        setTracks(normalizeAllTracks(defaultStudioProject.tracks));
        setEpisodePlan(defaultEpisodePlan);
      } finally {
        if (active) setIsHydrated(true);
      }
    };

    loadProject();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setSaveState("saving");
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const project: StudioProject = { title: projectTitle, prompt: promptText, tracks };
        const response = await fetch("/studio/api/v1/studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project, episode: episodePlan })
        });
        if (!response.ok) throw new Error("Failed to save");
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, SAVE_DELAY_MS);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [isHydrated, projectTitle, promptText, tracks, episodePlan]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [jobsRes, mediaRes] = await Promise.all([
          fetch("/studio/api/v1/jobs", { cache: "no-store" }),
          fetch("/studio/api/v1/media/latest", { cache: "no-store" })
        ]);

        if (!active) return;

        if (jobsRes.ok) {
          const data = (await jobsRes.json()) as { jobs?: Job[] };
          setJobs(data.jobs ?? []);
        }

        if (mediaRes.ok) {
          const data = (await mediaRes.json()) as { media?: LatestMedia | null };
          setLatestMedia(data.media ?? null);
          setPreviewError(false);
        }
      } catch {
        if (!active) return;
      }
    };

    refresh();
    const interval = setInterval(refresh, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const makeId = () => `clip-${Math.random().toString(36).slice(2, 9)}`;
  const makePlanId = (prefix: "scene" | "shot") =>
    `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

  const enqueueGeneration = async (
    prompt: string,
    duration: number,
    publishToLiveLoop = false
  ): Promise<Job | null> => {
    const response = await fetch("/studio/api/v1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, duration, publishToLiveLoop })
    });
    if (!response.ok) throw new Error("Failed to queue");
    const data = (await response.json()) as { jobId?: string; status?: Job["status"] };
    const job: Job = {
      id: data.jobId ?? `job-${Date.now()}`,
      prompt,
      status: data.status ?? "queued"
    };
    setJobs((prev) => [job, ...prev.filter((item) => item.id !== job.id)]);
    return job;
  };

  const handleGeneratePrompt = async () => {
    setGenerateState("submitting");
    try {
      await enqueueGeneration(promptText, 7, false);
      setGenerateState("idle");
    } catch {
      setGenerateState("error");
    }
  };

  const handleApplyPrompt = () => {
    const nextTitle = deriveTitle(promptText);
    setProjectTitle(nextTitle);
    setPromptApplied(true);

    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== "video") return track;
        const updated = track.clips.map((clip, index) =>
          index === 0 ? { ...clip, title: `Sora: ${nextTitle}` } : clip
        );
        return { ...track, clips: normalizeTrackClips(updated) };
      })
    );
  };

  const updateEpisode = (updates: Partial<EpisodePlan>) => {
    setEpisodePlan((prev) => ({ ...prev, ...updates }));
  };

  const updateScene = (sceneId: string, updates: Partial<EpisodeScene>) => {
    setEpisodePlan((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...updates } : scene))
    }));
  };

  const addScene = () => {
    const newScene: EpisodeScene = {
      id: makePlanId("scene"),
      title: "New scene",
      summary: "",
      targetDuration: 240,
      status: "outline",
      shots: []
    };

    setEpisodePlan((prev) => ({ ...prev, scenes: [...prev.scenes, newScene] }));
  };

  const removeScene = (sceneId: string) => {
    setEpisodePlan((prev) => ({
      ...prev,
      scenes: prev.scenes.filter((scene) => scene.id !== sceneId)
    }));
  };

  const updateShot = (sceneId: string, shotId: string, updates: Partial<EpisodeShot>) => {
    setEpisodePlan((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => {
        if (scene.id !== sceneId) return scene;
        return {
          ...scene,
          shots: scene.shots.map((shot) => (shot.id === shotId ? { ...shot, ...updates } : shot))
        };
      })
    }));
  };

  const addShot = (sceneId: string) => {
    const newShot: EpisodeShot = {
      id: makePlanId("shot"),
      title: "New shot",
      beat: "",
      duration: 12,
      camera: "Wide",
      status: "draft"
    };

    setEpisodePlan((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, shots: [...scene.shots, newShot] } : scene
      )
    }));
  };

  const removeShot = (sceneId: string, shotId: string) => {
    setEpisodePlan((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, shots: scene.shots.filter((shot) => shot.id !== shotId) }
          : scene
      )
    }));
  };

  const duplicateScene = (sceneId: string) => {
    setEpisodePlan((prev) => {
      const index = prev.scenes.findIndex((scene) => scene.id === sceneId);
      if (index === -1) return prev;
      const source = prev.scenes[index];
      const duplicatedShots = source.shots.map((shot) => ({
        ...shot,
        id: makePlanId("shot"),
        title: `${shot.title} copy`
      }));
      const duplicate: EpisodeScene = {
        ...source,
        id: makePlanId("scene"),
        title: `${source.title} copy`,
        shots: duplicatedShots
      };
      const scenes = [...prev.scenes];
      scenes.splice(index + 1, 0, duplicate);
      return { ...prev, scenes };
    });
  };

  const duplicateShot = (sceneId: string, shotId: string) => {
    setEpisodePlan((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => {
        if (scene.id !== sceneId) return scene;
        const index = scene.shots.findIndex((shot) => shot.id === shotId);
        if (index === -1) return scene;
        const source = scene.shots[index];
        const duplicate: EpisodeShot = {
          ...source,
          id: makePlanId("shot"),
          title: `${source.title} copy`
        };
        const shots = [...scene.shots];
        shots.splice(index + 1, 0, duplicate);
        return { ...scene, shots };
      })
    }));
  };

  const reorderScene = (sourceSceneId: string, targetSceneId: string) => {
    setEpisodePlan((prev) => {
      const scenes = [...prev.scenes];
      const sourceIndex = scenes.findIndex((scene) => scene.id === sourceSceneId);
      const targetIndex = scenes.findIndex((scene) => scene.id === targetSceneId);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prev;
      const [moved] = scenes.splice(sourceIndex, 1);
      const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      scenes.splice(insertIndex, 0, moved);
      return { ...prev, scenes };
    });
  };

  const reorderShot = (sceneId: string, sourceShotId: string, targetShotId: string) => {
    setEpisodePlan((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => {
        if (scene.id !== sceneId) return scene;
        const shots = [...scene.shots];
        const sourceIndex = shots.findIndex((shot) => shot.id === sourceShotId);
        const targetIndex = shots.findIndex((shot) => shot.id === targetShotId);
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return scene;
        const [moved] = shots.splice(sourceIndex, 1);
        const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        shots.splice(insertIndex, 0, moved);
        return { ...scene, shots };
      })
    }));
  };

  const moveShotToEnd = (sceneId: string, shotId: string) => {
    setEpisodePlan((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => {
        if (scene.id !== sceneId) return scene;
        const shots = [...scene.shots];
        const sourceIndex = shots.findIndex((shot) => shot.id === shotId);
        if (sourceIndex === -1) return scene;
        const [moved] = shots.splice(sourceIndex, 1);
        shots.push(moved);
        return { ...scene, shots };
      })
    }));
  };

  const buildShotPrompt = (scene: EpisodeScene, shot: EpisodeShot) =>
    [
      `Episode: ${episodePlan.title}`,
      `Scene: ${scene.title}`,
      `Shot: ${shot.title}`,
      `Beat: ${shot.beat || "N/A"}`,
      `Camera: ${shot.camera}`,
      `Duration: ${shot.duration}s`,
      `Style: ${episodePlan.style}`
    ].join(" | ");

  const queueShot = async (scene: EpisodeScene, shot: EpisodeShot) => {
    setQueueingShots((prev) => ({ ...prev, [shot.id]: true }));
    try {
      const prompt = buildShotPrompt(scene, shot);
      const job = await enqueueGeneration(prompt, shot.duration, false);
      if (!job) throw new Error("Failed to queue");
      updateShot(scene.id, shot.id, { status: "render" });
      return job;
    } catch {
      // Intentionally silent: keep UI responsive if queue fails.
      return null;
    } finally {
      setQueueingShots((prev) => ({ ...prev, [shot.id]: false }));
    }
  };

  const queueSceneShots = async (scene: EpisodeScene) => {
    if (!scene.shots.length) return;
    setQueueingScenes((prev) => ({ ...prev, [scene.id]: true }));
    for (const shot of scene.shots) {
      await queueShot(scene, shot);
    }
    setQueueingScenes((prev) => ({ ...prev, [scene.id]: false }));
  };

  const sendShotToEditor = (scene: EpisodeScene, shot: EpisodeShot) => {
    const trackId = "video";
    const baseColor = defaultTrackColor[trackId] ?? colorOptions[0].value;
    const newClip: StudioClip = {
      id: makeId(),
      title: `${scene.title} · ${shot.title}`,
      color: baseColor,
      width: shot.duration
    };

    setTracks((prev) => {
      const existing = prev.find((track) => track.id === trackId);
      if (!existing) {
        return [
          ...prev,
          { id: trackId, label: "Video", clips: normalizeTrackClips([newClip], newClip.id) }
        ];
      }
      return prev.map((track) => {
        if (track.id !== trackId) return track;
        const updated = [...track.clips, newClip];
        return { ...track, clips: normalizeTrackClips(updated, newClip.id) };
      });
    });

    setSelectedClip({ trackId, clipId: newClip.id });
    return newClip;
  };

  const generateShotToEditor = async (scene: EpisodeScene, shot: EpisodeShot) => {
    const job = await queueShot(scene, shot);
    if (!job) return;
    const clip = sendShotToEditor(scene, shot);
    jobClipMapRef.current.set(job.id, { trackId: "video", clipId: clip.id });
  };

  const updateClip = (trackId: string, clipId: string, updates: Partial<StudioClip>) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const updated = track.clips.map((clip) =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        );
        return { ...track, clips: normalizeTrackClips(updated, clipId) };
      })
    );
  };

  const attachMediaClip = (media: LatestMedia) => {
    const trackId = "video";
    const baseColor = defaultTrackColor[trackId] ?? colorOptions[0].value;
    const clipTitle = media.title || media.fileName;
    const width = Math.min(30, Math.max(MIN_CLIP_WIDTH, Math.round(TIMELINE_SECONDS)));
    const newClip: StudioClip = {
      id: makeId(),
      title: clipTitle,
      color: baseColor,
      width
    };

    setTracks((prev) => {
      const existing = prev.find((track) => track.id === trackId);
      if (!existing) {
        return [
          ...prev,
          { id: trackId, label: "Video", clips: normalizeTrackClips([newClip], newClip.id) }
        ];
      }
      return prev.map((track) => {
        if (track.id !== trackId) return track;
        const updated = [...track.clips, newClip];
        return { ...track, clips: normalizeTrackClips(updated, newClip.id) };
      });
    });

    setSelectedClip({ trackId, clipId: newClip.id });
  };

  useEffect(() => {
    if (!jobs.length) return;
    if (!hasSeenJobsRef.current) {
      jobStatusRef.current = jobs.reduce<Record<string, Job["status"]>>((acc, job) => {
        acc[job.id] = job.status;
        return acc;
      }, {});
      hasSeenJobsRef.current = true;
      return;
    }

    const prevStatus = jobStatusRef.current;
    const nextStatus: Record<string, Job["status"]> = {};
    const newlyComplete: Job[] = [];

    for (const job of jobs) {
      nextStatus[job.id] = job.status;
      if (job.status === "complete" && prevStatus[job.id] !== "complete") {
        newlyComplete.push(job);
      }
    }

    jobStatusRef.current = nextStatus;

    if (newlyComplete.length === 0) return;
    newlyComplete.forEach((job) => pendingCompleteRef.current.add(job.id));
  }, [jobs]);

  useEffect(() => {
    if (!latestMedia || pendingCompleteRef.current.size === 0) return;
    const pending = Array.from(pendingCompleteRef.current);
    pendingCompleteRef.current.clear();

    pending.forEach((jobId) => {
      const mapping = jobClipMapRef.current.get(jobId);
      if (mapping) {
        updateClip(mapping.trackId, mapping.clipId, { title: latestMedia.title });
        jobClipMapRef.current.delete(jobId);
        return;
      }
      attachMediaClip(latestMedia);
    });
  }, [latestMedia, jobs]);

  const addClip = (trackId: string) => {
    const baseColor = defaultTrackColor[trackId] ?? colorOptions[0].value;
    const newClip: StudioClip = {
      id: makeId(),
      title: "New clip",
      color: baseColor,
      width: 20
    };

    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const updated = [...track.clips, newClip];
        return { ...track, clips: normalizeTrackClips(updated, newClip.id) };
      })
    );

    setSelectedClip({ trackId, clipId: newClip.id });
  };

  const reorderClip = (trackId: string, clipId: string, targetIndex: number) => {
    setTracks((prev) => {
      const next = prev.map((track) => {
        if (track.id !== trackId) return track;
        const clipIndex = track.clips.findIndex((clip) => clip.id === clipId);
        if (clipIndex === -1) return track;
        const updated = [...track.clips];
        const [moved] = updated.splice(clipIndex, 1);
        updated.splice(targetIndex, 0, moved);
        return { ...track, clips: normalizeTrackClips(updated, moved.id) };
      });
      return next;
    });
  };

  const moveClip = (payload: DragPayload, targetTrackId: string, targetIndex: number) => {
    if (!payload) return;
    let nextSelection: SelectedClip = null;

    setTracks((prev) => {
      let movedClip: StudioClip | null = null;
      let sourceIndex = -1;
      const stripped = prev.map((track) => {
        if (track.id !== payload.trackId) return track;
        const clipIndex = track.clips.findIndex((clip) => clip.id === payload.clipId);
        if (clipIndex === -1) return track;
        sourceIndex = clipIndex;
        movedClip = track.clips[clipIndex];
        return { ...track, clips: track.clips.filter((clip) => clip.id !== payload.clipId) };
      });

      if (!movedClip) return prev;

      nextSelection = { trackId: targetTrackId, clipId: movedClip.id };

      return stripped.map((track) => {
        if (track.id === payload.trackId && payload.trackId !== targetTrackId) {
          return { ...track, clips: normalizeTrackClips(track.clips) };
        }
        if (track.id !== targetTrackId) return track;

        const updated = [...track.clips];
        const adjustedIndex =
          payload.trackId === targetTrackId && sourceIndex !== -1 && sourceIndex < targetIndex
            ? targetIndex - 1
            : targetIndex;
        const insertIndex = Math.max(0, Math.min(adjustedIndex, updated.length));
        updated.splice(insertIndex, 0, movedClip);
        return { ...track, clips: normalizeTrackClips(updated, movedClip.id) };
      });
    });

    if (nextSelection) setSelectedClip(nextSelection);
  };

  const moveSelectedClip = (direction: number) => {
    if (!selected) return;
    const clipIndex = selected.track.clips.findIndex((clip) => clip.id === selected.clip.id);
    const targetIndex = clipIndex + direction;
    if (targetIndex < 0 || targetIndex >= selected.track.clips.length) return;
    reorderClip(selected.track.id, selected.clip.id, targetIndex);
  };

  const duplicateSelectedClip = () => {
    if (!selected) return;

    const duplicate: StudioClip = {
      ...selected.clip,
      id: makeId(),
      title: `${selected.clip.title} copy`
    };

    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== selected.track.id) return track;
        const clipIndex = track.clips.findIndex((clip) => clip.id === selected.clip.id);
        const updated = [...track.clips];
        updated.splice(clipIndex + 1, 0, duplicate);
        return { ...track, clips: normalizeTrackClips(updated, duplicate.id) };
      })
    );

    setSelectedClip({ trackId: selected.track.id, clipId: duplicate.id });
  };

  const removeSelectedClip = () => {
    if (!selected) return;

    const track = tracks.find((item) => item.id === selected.track.id);
    if (!track) return;
    const clipIndex = track.clips.findIndex((clip) => clip.id === selected.clip.id);
    const fallbackClip = track.clips[clipIndex + 1] ?? track.clips[clipIndex - 1] ?? null;

    setTracks((prev) =>
      prev.map((item) => {
        if (item.id !== selected.track.id) return item;
        const updated = item.clips.filter((clip) => clip.id !== selected.clip.id);
        return { ...item, clips: normalizeTrackClips(updated) };
      })
    );

    setSelectedClip(
      fallbackClip ? { trackId: selected.track.id, clipId: fallbackClip.id } : null
    );
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, trackId: string, clipId: string) => {
    const payload = JSON.stringify({ trackId, clipId });
    event.dataTransfer.setData("application/x-illuvrse-clip", payload);
    event.dataTransfer.effectAllowed = "move";
    setDraggedClip({ trackId, clipId });
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, trackId: string, clipId?: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverClip({ trackId, clipId: clipId ?? "" });
  };

  const handleDropOnClip = (event: DragEvent<HTMLElement>, trackId: string, clipId: string) => {
    event.preventDefault();
    const payload = getDragPayload(event) ?? draggedClip;
    if (!payload) return;
    if (payload.trackId === trackId && payload.clipId === clipId) return;
    const targetTrack = tracks.find((track) => track.id === trackId);
    const targetIndex = targetTrack?.clips.findIndex((clip) => clip.id === clipId) ?? 0;
    moveClip(payload, trackId, targetIndex);
    setDraggedClip(null);
    setDragOverClip(null);
  };

  const handleDropOnTrack = (event: DragEvent<HTMLElement>, trackId: string) => {
    event.preventDefault();
    const payload = getDragPayload(event) ?? draggedClip;
    if (!payload) return;
    const targetTrack = tracks.find((track) => track.id === trackId);
    const targetIndex = targetTrack?.clips.length ?? 0;
    moveClip(payload, trackId, targetIndex);
    setDraggedClip(null);
    setDragOverClip(null);
  };

  const handleSceneDragStart = (event: DragEvent<HTMLElement>, sceneId: string) => {
    const payload = JSON.stringify({ sceneId });
    event.dataTransfer.setData("application/x-illuvrse-scene", payload);
    event.dataTransfer.effectAllowed = "move";
    setDraggedScene({ sceneId });
  };

  const handleSceneDragOver = (event: DragEvent<HTMLElement>, sceneId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverSceneId(sceneId);
  };

  const handleSceneDrop = (event: DragEvent<HTMLElement>, sceneId: string) => {
    event.preventDefault();
    const payload = getSceneDragPayload(event) ?? draggedScene;
    if (!payload || payload.sceneId === sceneId) return;
    reorderScene(payload.sceneId, sceneId);
    setDraggedScene(null);
    setDragOverSceneId(null);
  };

  const handleShotDragStart = (event: DragEvent<HTMLElement>, sceneId: string, shotId: string) => {
    const payload = JSON.stringify({ sceneId, shotId });
    event.dataTransfer.setData("application/x-illuvrse-shot", payload);
    event.dataTransfer.effectAllowed = "move";
    setDraggedShot({ sceneId, shotId });
  };

  const handleShotDragOver = (event: DragEvent<HTMLElement>, sceneId: string, shotId?: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!shotId) return;
    setDragOverShot({ sceneId, shotId });
  };

  const handleShotDropOnShot = (
    event: DragEvent<HTMLElement>,
    sceneId: string,
    shotId: string
  ) => {
    event.preventDefault();
    const payload = getShotDragPayload(event) ?? draggedShot;
    if (!payload || payload.sceneId !== sceneId || payload.shotId === shotId) return;
    reorderShot(sceneId, payload.shotId, shotId);
    setDraggedShot(null);
    setDragOverShot(null);
  };

  const handleShotDropOnScene = (event: DragEvent<HTMLElement>, sceneId: string) => {
    event.preventDefault();
    const payload = getShotDragPayload(event) ?? draggedShot;
    if (!payload || payload.sceneId !== sceneId) return;
    moveShotToEnd(sceneId, payload.shotId);
    setDraggedShot(null);
    setDragOverShot(null);
  };

  const saveMessage =
    saveState === "saving"
      ? "Saving"
      : saveState === "saved"
      ? "Saved"
      : saveState === "error"
      ? "Save failed"
      : "";
  const previewSrc = latestMedia?.previewUrl ?? "/studio/api/liveloop/preview";
  const previewLabel = latestMedia ? latestMedia.title : projectTitle;
  const previewMetaLabel = previewError
    ? "Preview unavailable"
    : latestMedia
    ? latestMedia.fileName
    : "Drop MP4 into public/ or studio/library";
  const previewPlaceholder = previewError ? "Preview failed" : "Waiting for render";
  const generateMessage =
    generateState === "submitting"
      ? "Generating preview"
      : generateState === "error"
      ? "Generate failed"
      : "";
  const jobStatusTone: Record<Job["status"], string> = {
    queued: "text-amber-200",
    rendering: "text-sky-200",
    complete: "text-emerald-200"
  };

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute right-[-140px] top-[18%] h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute bottom-[5%] left-[-140px] h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(15,23,42,0.05)_1px,_transparent_1px),_linear-gradient(0deg,_rgba(15,23,42,0.05)_1px,_transparent_1px)] bg-[size:140px_140px] opacity-50" />
      </div>
      <div className="relative flex min-h-screen flex-col gap-4 px-6 pb-6 pt-4">
        <header className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f7f3eb_60%,_#e8f4f3_100%)] px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <Pill className="bg-teal-50 text-teal-700">Studio</Pill>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  CapCut-grade editor
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">StorySphere Studio</h1>
              <p className="max-w-2xl text-sm text-slate-700 text-balance">
                Generate scenes, refine frames, cut fast, and publish signed MP4/HLS output for
                LiveLoop.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                {providers.map((provider) => (
                  <span
                    key={provider.name}
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1"
                  >
                    {provider.name}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${
                    saveState === "error"
                      ? "text-rose-500"
                      : saveState === "saving"
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {saveMessage}
                </span>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-card transition hover:opacity-90"
                >
                  New project
                </button>
                <Link
                  href="/studio/liveloop"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
                >
                  Publish to LiveLoop
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {projectMetrics.map((metric) => (
              <div
                key={metric.label}
                className={`rounded-2xl border border-slate-200/70 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${metric.tone}`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {metric.label}
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  {metric.detail}
                </div>
              </div>
            ))}
          </div>
        </header>

        <section className="flex min-h-0 flex-1">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-[#0b0f14] text-slate-100 shadow-card">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-[30%] h-56 w-56 rounded-full bg-teal-500/15 blur-3xl" />
              <div className="absolute bottom-[-140px] right-[-80px] h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-300/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <div>
                  <div className="text-sm font-semibold">StorySphere Studio</div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                    {projectTitle}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-slate-200">
                  Autosave on
                </span>
                <Link
                  href="/studio/jobs"
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-slate-200 transition hover:border-emerald-300/60"
                >
                  Render queue
                </Link>
                <Link
                  href="/studio/liveloop"
                  className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-4 py-2 text-slate-900"
                >
                  Publish
                </Link>
              </div>
            </div>

            <div className="grid flex-1 min-h-0 gap-6 px-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
              <aside className="order-2 space-y-4 overflow-y-auto pr-1 lg:order-none">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    AI providers
                  </div>
                  <div className="mt-4 space-y-3">
                    {providers.map((provider) => (
                      <div
                        key={provider.name}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-100">
                            {provider.name}
                          </div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            {provider.role}
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] uppercase ${provider.tone}`}>
                          {provider.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Assets
                  </div>
                  <div className="mt-4 space-y-2">
                    {assets.map((asset) => (
                      <div
                        key={asset.name}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm text-slate-100">{asset.name}</div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            {asset.type}
                          </div>
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          {asset.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <main className="order-1 flex min-h-0 flex-col space-y-4 overflow-y-auto lg:order-none">
                <div className="rounded-2xl border border-white/10 bg-[#0f141b] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>Episode plan</span>
                    <span>
                      {episodeStats.sceneCount} scenes · {episodeStats.shotCount} shots
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                    <div className="space-y-3">
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Episode title
                        <input
                          value={episodePlan.title}
                          onChange={(event) => updateEpisode({ title: event.target.value })}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                        />
                      </label>
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Logline
                        <textarea
                          value={episodePlan.logline}
                          onChange={(event) => updateEpisode({ logline: event.target.value })}
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                        />
                      </label>
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Style bible
                        <textarea
                          value={episodePlan.style}
                          onChange={(event) => updateEpisode({ style: event.target.value })}
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                        />
                      </label>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        <span>Target runtime</span>
                        <span>{formatTimecode(episodePlan.runtimeTarget)}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          step={0.25}
                          value={toMinutes(episodePlan.runtimeTarget)}
                          onChange={(event) =>
                            updateEpisode({
                              runtimeTarget: toSeconds(Number(event.target.value) || 0)
                            })
                          }
                          className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                        />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                          min
                        </span>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          <span>Planned runtime</span>
                          <span>{formatTimecode(episodeStats.plannedSeconds)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-emerald-400/80"
                            style={{ width: `${episodeStats.progress * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          <span>Delta</span>
                          <span className={`font-semibold ${runtimeDeltaTone}`}>
                            {runtimeDeltaLabel}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                          <div>Scenes</div>
                          <div className="mt-1 text-sm font-semibold text-slate-100">
                            {episodeStats.sceneCount}
                          </div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                          <div>Shots</div>
                          <div className="mt-1 text-sm font-semibold text-slate-100">
                            {episodeStats.shotCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>Scene board</span>
                    <button
                      type="button"
                      onClick={addScene}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200"
                    >
                      Add scene
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {episodePlan.scenes.map((scene, sceneIndex) => {
                      const sceneShotSeconds = scene.shots.reduce(
                        (sum, shot) => sum + shot.duration,
                        0
                      );
                      const sceneDelta = sceneShotSeconds - scene.targetDuration;
                      const isOver = sceneDelta > 0;
                      const isDragOver = dragOverSceneId === scene.id;
                      const sceneBorder = isDragOver
                        ? "border-emerald-300/60"
                        : isOver
                        ? "border-amber-400/60"
                        : "border-white/10";
                      return (
                        <div
                          key={scene.id}
                          onDragOver={(event) => handleSceneDragOver(event, scene.id)}
                          onDrop={(event) => handleSceneDrop(event, scene.id)}
                          className={`rounded-2xl border ${sceneBorder} bg-white/5 p-4`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex flex-1 flex-wrap gap-4">
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  draggable
                                  onDragStart={(event) => handleSceneDragStart(event, scene.id)}
                                  onDragEnd={() => {
                                    setDraggedScene(null);
                                    setDragOverSceneId(null);
                                  }}
                                  className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-slate-300 hover:text-white"
                                  aria-label="Drag to reorder scene"
                                  title="Drag to reorder scene"
                                >
                                  <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    fill="currentColor"
                                  >
                                    <circle cx="9" cy="7" r="1.5" />
                                    <circle cx="15" cy="7" r="1.5" />
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="9" cy="17" r="1.5" />
                                    <circle cx="15" cy="17" r="1.5" />
                                  </svg>
                                </button>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                  Scene {String(sceneIndex + 1).padStart(2, "0")}
                                </div>
                              </div>
                              <div className="min-w-[220px] flex-1 space-y-3">
                                <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                  Title
                                  <input
                                    value={scene.title}
                                    onChange={(event) =>
                                      updateScene(scene.id, { title: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                  />
                                </label>
                                <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                  Summary
                                  <textarea
                                    value={scene.summary}
                                    onChange={(event) =>
                                      updateScene(scene.id, { summary: event.target.value })
                                    }
                                    rows={2}
                                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                  />
                                </label>
                              </div>
                              <div className="space-y-3">
                                <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                  Target (min)
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.25}
                                    value={toMinutes(scene.targetDuration)}
                                    onChange={(event) =>
                                      updateScene(scene.id, {
                                        targetDuration: toSeconds(Number(event.target.value) || 0)
                                      })
                                    }
                                    className="mt-2 w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                  />
                                </label>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                  {formatTimecode(scene.targetDuration)}
                                </div>
                                <div
                                  className={`text-[10px] uppercase tracking-[0.2em] ${
                                    isOver ? "text-amber-300" : "text-slate-500"
                                  }`}
                                >
                                  Shots {formatTimecode(sceneShotSeconds)}
                                  {isOver ? ` · Over ${formatTimecode(sceneDelta)}` : ""}
                                </div>
                                <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                  Status
                                  <select
                                    value={scene.status}
                                    onChange={(event) =>
                                      updateScene(scene.id, {
                                        status: event.target.value as EpisodeScene["status"]
                                      })
                                    }
                                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                  >
                                    {sceneStatusOptions.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => queueSceneShots(scene)}
                                disabled={queueingScenes[scene.id]}
                                className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200 disabled:opacity-60"
                              >
                                {queueingScenes[scene.id] ? "Queueing" : "Queue shots"}
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateScene(scene.id)}
                                className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200"
                              >
                                Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => removeScene(scene.id)}
                                className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-200"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              <span>Shots</span>
                              <button
                                type="button"
                                onClick={() => addShot(scene.id)}
                                className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200"
                              >
                                Add shot
                              </button>
                            </div>
                            <div
                              className="mt-3 space-y-3"
                              onDragOver={(event) => handleShotDragOver(event, scene.id)}
                              onDrop={(event) => handleShotDropOnScene(event, scene.id)}
                            >
                              {scene.shots.length === 0 && (
                                <p className="text-sm text-slate-400">
                                  No shots yet. Add one to start the sequence.
                                </p>
                              )}
                              {scene.shots.map((shot, shotIndex) => {
                                const isShotDragOver =
                                  dragOverShot?.sceneId === scene.id &&
                                  dragOverShot?.shotId === shot.id;
                                return (
                                  <div
                                    key={shot.id}
                                    onDragOver={(event) => handleShotDragOver(event, scene.id, shot.id)}
                                    onDrop={(event) => handleShotDropOnShot(event, scene.id, shot.id)}
                                    className={`rounded-xl border ${
                                      isShotDragOver ? "border-emerald-300/60" : "border-white/10"
                                    } bg-black/30 p-3`}
                                  >
                                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          draggable
                                          onDragStart={(event) =>
                                            handleShotDragStart(event, scene.id, shot.id)
                                          }
                                          onDragEnd={() => {
                                            setDraggedShot(null);
                                            setDragOverShot(null);
                                          }}
                                          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/40 text-slate-300 hover:text-white"
                                          aria-label="Drag to reorder shot"
                                          title="Drag to reorder shot"
                                        >
                                          <svg
                                            aria-hidden="true"
                                            viewBox="0 0 24 24"
                                            className="h-3 w-3"
                                            fill="currentColor"
                                          >
                                            <circle cx="9" cy="7" r="1.5" />
                                            <circle cx="15" cy="7" r="1.5" />
                                            <circle cx="9" cy="12" r="1.5" />
                                            <circle cx="15" cy="12" r="1.5" />
                                            <circle cx="9" cy="17" r="1.5" />
                                            <circle cx="15" cy="17" r="1.5" />
                                          </svg>
                                        </button>
                                        <span>Shot {String(shotIndex + 1).padStart(2, "0")}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => generateShotToEditor(scene, shot)}
                                          disabled={queueingShots[shot.id]}
                                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-200 disabled:opacity-60"
                                        >
                                          {queueingShots[shot.id] ? "Generating" : "Generate + Edit"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => duplicateShot(scene.id, shot.id)}
                                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-200"
                                        >
                                          Duplicate
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeShot(scene.id, shot.id)}
                                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-rose-200"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_110px_130px]">
                                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                        Title
                                        <input
                                          value={shot.title}
                                          onChange={(event) =>
                                            updateShot(scene.id, shot.id, {
                                              title: event.target.value
                                            })
                                          }
                                          className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b0f14] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                        />
                                      </label>
                                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                        Duration (sec)
                                        <input
                                          type="number"
                                          min={1}
                                          value={shot.duration}
                                          onChange={(event) =>
                                            updateShot(scene.id, shot.id, {
                                              duration: Math.max(1, Number(event.target.value) || 1)
                                            })
                                          }
                                          className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b0f14] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                        />
                                        <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                          {formatTimecode(shot.duration)}
                                        </span>
                                      </label>
                                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                        Status
                                        <select
                                          value={shot.status}
                                          onChange={(event) =>
                                            updateShot(scene.id, shot.id, {
                                              status: event.target.value as EpisodeShot["status"]
                                            })
                                          }
                                          className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b0f14] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                        >
                                          {shotStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                              {status}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                    </div>
                                    <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px]">
                                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                        Beat
                                        <textarea
                                          value={shot.beat}
                                          onChange={(event) =>
                                            updateShot(scene.id, shot.id, {
                                              beat: event.target.value
                                            })
                                          }
                                          rows={2}
                                          className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b0f14] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                        />
                                      </label>
                                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                        Camera
                                        <input
                                          value={shot.camera}
                                          onChange={(event) =>
                                            updateShot(scene.id, shot.id, {
                                              camera: event.target.value
                                            })
                                          }
                                          className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b0f14] px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                                        />
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0f141b] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>Preview</span>
                    <span>4K / 24fps / Dolby Atmos</span>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-700/60">
                    <div className="relative aspect-video">
                      {latestMedia && !previewError ? (
                        <video
                          key={previewSrc}
                          className="h-full w-full object-cover"
                          src={previewSrc}
                          controls
                          playsInline
                          autoPlay
                          muted
                          onError={() => setPreviewError(true)}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-3 text-white/80">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                              <svg
                                aria-hidden="true"
                                className="h-8 w-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                              >
                                <polygon points="8 5 19 12 8 19" />
                              </svg>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.3em]">
                              {previewPlaceholder}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                        On air preview
                      </div>
                      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                        Live
                      </div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="text-sm font-semibold">{previewLabel}</div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                          {previewMetaLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                        viewBox="0 0 24 24"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-100"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                        viewBox="0 0 24 24"
                      >
                        <polygon points="8 5 19 12 8 19" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </button>
                    <div className="ml-auto text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      00:12 / 00:18
                    </div>
                  </div>
                </div>

                {videoTrack && (
                  <div className="rounded-2xl border border-white/10 bg-[#0f141b] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <span>Shot deck</span>
                      <span>{videoTrack.clips.length} clips</span>
                    </div>
                    <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                      {shotDeck.map((item) => {
                        const isActive =
                          selectedClip?.trackId === videoTrack.id &&
                          selectedClip?.clipId === item.clip.id;
                        return (
                          <button
                            key={item.clip.id}
                            type="button"
                            onClick={() =>
                              setSelectedClip({ trackId: videoTrack.id, clipId: item.clip.id })
                            }
                            aria-pressed={isActive}
                            className={`group relative min-w-[220px] snap-start rounded-xl border border-white/10 bg-white/5 p-3 text-left transition ${
                              isActive
                                ? "border-emerald-300/60 bg-white/10 shadow-[0_0_0_1px_rgba(52,211,153,0.3)]"
                                : "hover:border-white/20"
                            }`}
                          >
                            <div className={`h-1 w-full rounded-full ${item.clip.color}`} />
                            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-400">
                              <span>{`Shot ${String(item.index + 1).padStart(2, "0")}`}</span>
                              <span>{`${Math.round(item.durationSeconds)}s`}</span>
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-100">
                              {item.clip.title}
                            </div>
                            <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              {formatTimecode(item.startSeconds)} - {formatTimecode(item.endSeconds)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-[#0f141b] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>Prompt</span>
                    <span>Sora video and Stable Diffusion frames</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={promptText}
                      onChange={(event) => {
                        setPromptText(event.target.value);
                        setPromptApplied(false);
                      }}
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-300"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGeneratePrompt}
                        disabled={generateState === "submitting"}
                        className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 disabled:opacity-70"
                      >
                        {generateState === "submitting" ? "Generating..." : "Generate preview"}
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyPrompt}
                        className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100"
                      >
                        Apply prompt
                      </button>
                      <span
                        className={`text-[11px] uppercase tracking-[0.2em] ${
                          promptApplied ? "text-emerald-300" : "text-amber-300"
                        }`}
                      >
                        {promptApplied ? "Applied to timeline" : "Draft changes"}
                      </span>
                      {generateMessage && (
                        <span
                          className={`text-[11px] uppercase tracking-[0.2em] ${
                            generateState === "error" ? "text-rose-300" : "text-emerald-300"
                          }`}
                        >
                          {generateMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0f141b] p-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    <span>Timeline</span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      Normalized lengths
                    </span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-4 gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      <span>00:00</span>
                      <span>00:06</span>
                      <span>00:12</span>
                      <span>00:18</span>
                    </div>
                    <div className="relative overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-4">
                      <div aria-hidden className="absolute inset-y-3 left-[35%] w-px bg-teal-400/40" />
                      <div className="min-w-[680px] space-y-4">
                        {tracks.map((track) => (
                          <div key={track.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/20 ${
                                    track.clips[0]?.color ??
                                    defaultTrackColor[track.id] ??
                                    "bg-white/30"
                                  }`}
                                />
                                <span>{track.label}</span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                  {track.clips.length} clips
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => addClip(track.id)}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200"
                              >
                                Add clip
                              </button>
                            </div>
                            <div
                              className={`flex h-8 items-center gap-2 rounded-lg border border-dashed px-2 ${
                                dragOverClip?.trackId === track.id
                                  ? "border-emerald-400/60"
                                  : "border-white/10"
                              }`}
                              onDragOver={(event) => handleDragOver(event, track.id)}
                              onDrop={(event) => handleDropOnTrack(event, track.id)}
                            >
                              {track.clips.map((clip) => {
                                const isSelected =
                                  selectedClip?.trackId === track.id &&
                                  selectedClip?.clipId === clip.id;
                                const isDragTarget =
                                  dragOverClip?.trackId === track.id &&
                                  dragOverClip?.clipId === clip.id;
                                return (
                                  <button
                                    key={clip.id}
                                    type="button"
                                    draggable
                                    onDragStart={(event) => handleDragStart(event, track.id, clip.id)}
                                    onDragOver={(event) => handleDragOver(event, track.id, clip.id)}
                                    onDrop={(event) => handleDropOnClip(event, track.id, clip.id)}
                                    onDragEnd={() => {
                                      setDraggedClip(null);
                                      setDragOverClip(null);
                                    }}
                                    onClick={() =>
                                      setSelectedClip({ trackId: track.id, clipId: clip.id })
                                    }
                                    className={`group relative flex h-6 items-center rounded-md px-2 text-[11px] font-semibold text-slate-900 ${
                                      clip.color
                                    } ${
                                      isSelected
                                        ? "ring-2 ring-white/70"
                                        : "ring-1 ring-white/10"
                                    } ${isDragTarget ? "outline outline-2 outline-emerald-300" : ""}`}
                                    style={{ width: `${clip.width}%` }}
                                    title={clip.title}
                                  >
                                    <span className="truncate">{clip.title}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </main>

              <aside className="order-3 space-y-4 overflow-y-auto pl-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Clip editor
                  </div>
                  <div className="mt-4 space-y-4">
                    {!selected && (
                      <p className="text-sm text-slate-300">
                        Select a clip in the timeline to edit name, length, and color.
                      </p>
                    )}
                    {selected && (
                      <>
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            Track
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-100">
                            {selected.track.label}
                          </div>
                        </div>
                        <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          Clip name
                          <input
                            value={selected.clip.title}
                            onChange={(event) =>
                              updateClip(selected.track.id, selected.clip.id, {
                                title: event.target.value
                              })
                            }
                            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300"
                          />
                        </label>
                        {selectedTiming && (
                          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                            <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                              <span>In</span>
                              <span>Out</span>
                              <span>Dur</span>
                            </div>
                            <div className="mt-1 grid grid-cols-3 gap-2 text-sm font-semibold text-slate-100">
                              <span>{formatTimecode(selectedTiming.startSeconds)}</span>
                              <span>{formatTimecode(selectedTiming.endSeconds)}</span>
                              <span>{formatTimecode(selectedTiming.durationSeconds)}</span>
                            </div>
                          </div>
                        )}
                        <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          Clip length
                          <div className="mt-2 space-y-2">
                            <input
                              type="range"
                              min={MIN_CLIP_WIDTH}
                              max={MAX_CLIP_WIDTH}
                              value={selected.clip.width}
                              onChange={(event) =>
                                updateClip(selected.track.id, selected.clip.id, {
                                  width: Number(event.target.value)
                                })
                              }
                              className="w-full accent-teal-400"
                            />
                            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              <span>Short</span>
                              <span>{selected.clip.width}%</span>
                              <span>Long</span>
                            </div>
                          </div>
                        </label>
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            Clip color
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {colorOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  updateClip(selected.track.id, selected.clip.id, {
                                    color: option.value
                                  })
                                }
                                className={`h-6 w-6 rounded-full ${option.value} ${
                                  selected.clip.color === option.value
                                    ? "ring-2 ring-white"
                                    : "ring-1 ring-white/10"
                                }`}
                                aria-label={`Set color ${option.label}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => moveSelectedClip(-1)}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                          >
                            Move left
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSelectedClip(1)}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                          >
                            Move right
                          </button>
                          <button
                            type="button"
                            onClick={duplicateSelectedClip}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={removeSelectedClip}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Audio mix
                  </div>
                  <div className="mt-4 space-y-3">
                    {audioMix.map((track) => (
                      <div key={track.label} className="space-y-2">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                          <span>{track.label}</span>
                          <span>{track.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-emerald-400/80"
                            style={{ width: `${track.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    <span>Render queue</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      {jobs.length} jobs
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {queueItems.length === 0 ? (
                      <p className="text-sm text-slate-400">No jobs yet. Generate a preview to start.</p>
                    ) : (
                      queueItems.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <div className="truncate text-sm font-semibold text-slate-100" title={job.prompt}>
                            {job.prompt}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <span className={jobStatusTone[job.status]}>{job.status}</span>
                            <span className="text-slate-500">{job.id}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
