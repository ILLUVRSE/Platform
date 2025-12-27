export type StudioClip = {
  id: string;
  title: string;
  color: string;
  width: number;
};

export type StudioTrack = {
  id: string;
  label: string;
  clips: StudioClip[];
};

export type StudioProject = {
  title: string;
  prompt: string;
  tracks: StudioTrack[];
};

export const defaultStudioProject: StudioProject = {
  title: "Arcadia Dawn",
  prompt: "Cinematic sunrise over Arcadia Harbor, soft fog, neon reflections, 12 shots",
  tracks: [
    {
      id: "video",
      label: "Video",
      clips: [
        { id: "video-1", title: "Sora base cut", color: "bg-emerald-400/70", width: 42 },
        { id: "video-2", title: "CapCut trim", color: "bg-teal-400/70", width: 28 }
      ]
    },
    {
      id: "frames",
      label: "Frames",
      clips: [
        {
          id: "frames-1",
          title: "Stable Diffusion style",
          color: "bg-violet-400/70",
          width: 40
        },
        {
          id: "frames-2",
          title: "Lighting pass",
          color: "bg-indigo-400/70",
          width: 22
        }
      ]
    },
    {
      id: "voice",
      label: "Voice",
      clips: [
        { id: "voice-1", title: "ElevenLabs VO", color: "bg-sky-400/70", width: 34 },
        { id: "voice-2", title: "Dub track", color: "bg-cyan-400/70", width: 18 }
      ]
    },
    {
      id: "captions",
      label: "Captions",
      clips: [
        { id: "cap-1", title: "Auto captions", color: "bg-amber-400/70", width: 38 }
      ]
    }
  ]
};
