export type TimelineTrackType = "video" | "audio" | "overlay" | "effect";

export interface ClipTransition {
  type: "crossfade" | "fade" | "slide" | "zoom" | "none";
  duration: number;
}

export interface TimelineClip {
  id: string;
  label?: string;
  src: string;
  start: number;
  duration: number;
  in?: number;
  out?: number;
  speed?: number;
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
  gain?: number;
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

export function validateTimelineSchema(input: unknown): {
  valid: boolean;
  errors: string[];
  sanitized?: TimelineSchema;
} {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Payload must be an object"] };
  }

  const draft = input as Partial<TimelineSchema>;

  if (!draft.projectId || typeof draft.projectId !== "string" || !draft.projectId.trim()) {
    errors.push("projectId is required");
  }

  if (!draft.render) {
    errors.push("render block is required");
  }

  const width = Number(draft.render?.resolution?.width);
  const height = Number(draft.render?.resolution?.height);
  const fps = Number(draft.render?.fps);

  if (!width || !height) {
    errors.push("render.resolution.width and render.resolution.height are required");
  }

  if (!fps || Number.isNaN(fps) || fps <= 0) {
    errors.push("render.fps must be a positive number");
  }

  if (!Array.isArray(draft.tracks) || draft.tracks.length === 0) {
    errors.push("tracks array is required");
  } else {
    draft.tracks.forEach((track, trackIdx) => {
      if (!track || typeof track !== "object") {
        errors.push(`tracks[${trackIdx}] must be an object`);
        return;
      }
      if (!track.id) errors.push(`tracks[${trackIdx}].id is required`);
      if (!track.type) errors.push(`tracks[${trackIdx}].type is required`);
      if (!Array.isArray(track.clips)) {
        errors.push(`tracks[${trackIdx}].clips must be an array`);
        return;
      }
      track.clips.forEach((clip, clipIdx) => {
        if (!clip.id) errors.push(`tracks[${trackIdx}].clips[${clipIdx}].id is required`);
        if (!clip.src) errors.push(`tracks[${trackIdx}].clips[${clipIdx}].src is required`);
        if (clip.start === undefined) errors.push(`tracks[${trackIdx}].clips[${clipIdx}].start is required`);
        if (clip.duration === undefined) errors.push(`tracks[${trackIdx}].clips[${clipIdx}].duration is required`);
      });
    });
  }

  if (errors.length) {
    return { valid: false, errors };
  }

  const sanitized: TimelineSchema = {
    projectId: draft.projectId!.trim(),
    timelineName: draft.timelineName || "Untitled Timeline",
    render: {
      resolution: { width, height },
      fps,
      format: draft.render?.format || "mp4",
      quality: draft.render?.quality || "preview",
    },
    tracks: draft.tracks as TimelineTrack[],
    audio: draft.audio || [],
    notes: draft.notes,
    createdAt: draft.createdAt || new Date().toISOString(),
  };

  return { valid: true, errors: [], sanitized };
}
