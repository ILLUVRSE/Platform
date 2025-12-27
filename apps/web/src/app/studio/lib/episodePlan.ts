export type EpisodeShotStatus = "draft" | "boards" | "animatic" | "render" | "final";

export type EpisodeShot = {
  id: string;
  title: string;
  beat: string;
  duration: number;
  camera: string;
  status: EpisodeShotStatus;
};

export type EpisodeSceneStatus = "outline" | "boards" | "animatic" | "render" | "final";

export type EpisodeScene = {
  id: string;
  title: string;
  summary: string;
  targetDuration: number;
  status: EpisodeSceneStatus;
  shots: EpisodeShot[];
};

export type EpisodePlan = {
  id: string;
  title: string;
  logline: string;
  style: string;
  runtimeTarget: number;
  scenes: EpisodeScene[];
};

export const defaultEpisodePlan: EpisodePlan = {
  id: "ep-001",
  title: "Arcadia Dawn",
  logline:
    "A courier with a stolen reactor key races across Arcadia Harbor while a rogue skyrail crew closes in.",
  style:
    "90s action animation meets classic Hannah Barbera: bold silhouettes, limited animation cycles, heavy FX holds.",
  runtimeTarget: 22 * 60,
  scenes: [
    {
      id: "scene-1",
      title: "Cold Open: The Skyrail Heist",
      summary: "Harbor dawn. A skyrail convoy gets hit, and the courier escapes with the key.",
      targetDuration: 240,
      status: "boards",
      shots: [
        {
          id: "scene-1-shot-1",
          title: "Arcadia harbor reveal",
          beat: "Wide matte, cranes and blimps loop in silhouette.",
          duration: 45,
          camera: "Wide pan",
          status: "boards"
        },
        {
          id: "scene-1-shot-2",
          title: "Skyrail convoy",
          beat: "Train cars glide; guards scan with looping HUD.",
          duration: 50,
          camera: "Side tracking",
          status: "boards"
        },
        {
          id: "scene-1-shot-3",
          title: "Courier leap",
          beat: "Hero jumps cars, smear frames, landing on a hero hold.",
          duration: 40,
          camera: "Low angle",
          status: "boards"
        },
        {
          id: "scene-1-shot-4",
          title: "Drone snare",
          beat: "HB gag: net pops, hero rolls free with a ricochet beat.",
          duration: 55,
          camera: "Two-shot",
          status: "boards"
        },
        {
          id: "scene-1-shot-5",
          title: "Title stinger",
          beat: "Logo slam, lightning streaks, end on freeze frame.",
          duration: 50,
          camera: "Smash zoom",
          status: "boards"
        }
      ]
    },
    {
      id: "scene-2",
      title: "Act I: Harbor Relay",
      summary: "The courier meets the mechanic; the key powers up the skimmer.",
      targetDuration: 255,
      status: "outline",
      shots: [
        {
          id: "scene-2-shot-1",
          title: "Mechanic shop",
          beat: "Interior hold, tools sway on a loop.",
          duration: 40,
          camera: "Locked wide",
          status: "draft"
        },
        {
          id: "scene-2-shot-2",
          title: "Key ignition",
          beat: "Close on the core, glow ramp and color hold.",
          duration: 55,
          camera: "Insert push",
          status: "draft"
        },
        {
          id: "scene-2-shot-3",
          title: "Skimmer launch",
          beat: "Ramp break, smoke cycles, speed lines.",
          duration: 50,
          camera: "Tracking",
          status: "draft"
        },
        {
          id: "scene-2-shot-4",
          title: "Rogue crew intercept",
          beat: "Antagonist crew close, iconic silhouette hold.",
          duration: 45,
          camera: "Telephoto",
          status: "draft"
        },
        {
          id: "scene-2-shot-5",
          title: "Harbor chase begins",
          beat: "Wide chase with parallax loops and repeated water tiles.",
          duration: 65,
          camera: "Wide sweep",
          status: "draft"
        }
      ]
    },
    {
      id: "scene-3",
      title: "Act II: Fogline Chase",
      summary: "The skimmer dives into the fogline tunnels and loses the crew.",
      targetDuration: 270,
      status: "outline",
      shots: [
        {
          id: "scene-3-shot-1",
          title: "Fogline entry",
          beat: "Tunnel maw, fog rolls in a loop.",
          duration: 60,
          camera: "Center push",
          status: "draft"
        },
        {
          id: "scene-3-shot-2",
          title: "Tunnel split",
          beat: "Split screen style gag; left/right rhythm.",
          duration: 45,
          camera: "Split layout",
          status: "draft"
        },
        {
          id: "scene-3-shot-3",
          title: "Close call",
          beat: "Skimmer grazes pylons, sparks cycle.",
          duration: 50,
          camera: "Handheld sim",
          status: "draft"
        },
        {
          id: "scene-3-shot-4",
          title: "Crew wipeout",
          beat: "Rogue craft hit foam barrier, comedic rebound.",
          duration: 55,
          camera: "Wide tilt",
          status: "draft"
        },
        {
          id: "scene-3-shot-5",
          title: "Quiet beat",
          beat: "Hero breathes, fog parts into a hold.",
          duration: 60,
          camera: "Slow pull",
          status: "draft"
        }
      ]
    },
    {
      id: "scene-4",
      title: "Act III: Reactor Key",
      summary: "At the reactor tower, the key unlocks a hidden power.",
      targetDuration: 255,
      status: "outline",
      shots: [
        {
          id: "scene-4-shot-1",
          title: "Reactor approach",
          beat: "Tower matte, lights pulse, wind loop.",
          duration: 45,
          camera: "Wide pan",
          status: "draft"
        },
        {
          id: "scene-4-shot-2",
          title: "Key socket",
          beat: "Insert of the key aligning with the socket.",
          duration: 40,
          camera: "Insert",
          status: "draft"
        },
        {
          id: "scene-4-shot-3",
          title: "Power surge",
          beat: "Strobe hold, FX rings expand.",
          duration: 55,
          camera: "Push in",
          status: "draft"
        },
        {
          id: "scene-4-shot-4",
          title: "Rogue showdown",
          beat: "Crew lands; freeze frame on leader stance.",
          duration: 50,
          camera: "Low angle",
          status: "draft"
        },
        {
          id: "scene-4-shot-5",
          title: "Fight montage",
          beat: "Looped punches, limited frames, background smear.",
          duration: 65,
          camera: "Montage",
          status: "draft"
        }
      ]
    },
    {
      id: "scene-5",
      title: "Finale: Dawn on the Breakwater",
      summary: "The reactor stabilizes; Arcadia wakes as the crew retreats.",
      targetDuration: 300,
      status: "outline",
      shots: [
        {
          id: "scene-5-shot-1",
          title: "Stabilization wave",
          beat: "Energy ripple over the harbor; matte swap to bright dawn.",
          duration: 60,
          camera: "Wide sweep",
          status: "draft"
        },
        {
          id: "scene-5-shot-2",
          title: "Courier hero hold",
          beat: "Silhouette hold with wind loop, cape flutter.",
          duration: 65,
          camera: "Low angle",
          status: "draft"
        },
        {
          id: "scene-5-shot-3",
          title: "Crew retreat",
          beat: "Rogues peel away, smoke loop, taunt over comms.",
          duration: 55,
          camera: "Tracking",
          status: "draft"
        },
        {
          id: "scene-5-shot-4",
          title: "Harbor reset",
          beat: "Workers resume, repeating cycles, light warms.",
          duration: 50,
          camera: "Wide pan",
          status: "draft"
        },
        {
          id: "scene-5-shot-5",
          title: "Tag line",
          beat: "Comedic stinger, cut to black with sting.",
          duration: 70,
          camera: "Smash cut",
          status: "draft"
        }
      ]
    }
  ]
};
