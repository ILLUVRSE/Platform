/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Pill } from "@illuvrse/ui";
import { playlist as defaultPlaylist, type LiveLoopItem } from "@studio/lib/liveloopData";

type TimezoneMode = "local" | "utc";
type SlotStatus = "live" | "upcoming" | "completed";
type StreamKind = "video" | "audio";

type StationData = {
  id: string;
  name: string;
  slug: string;
  streamUrl: string;
  logoUrl?: string | null;
  region?: string | null;
  countryCode?: string | null;
  genre?: string | null;
  bitrate?: number | null;
  codec?: string | null;
  status?: string | null;
};

type StreamData = {
  id: string;
  name: string;
  slug: string;
  embedUrl: string;
  posterImage?: string | null;
  locationName?: string | null;
  countryCode?: string | null;
  status?: string | null;
  attribution?: string | null;
};

type VideoData = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail?: string | null;
  live?: boolean | null;
  liveUrl?: string | null;
  hlsUrl?: string | null;
  mp4Url?: string | null;
};

type ArticleData = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  excerpt?: string | null;
};

type ProgramMedia = {
  kind: StreamKind;
  streamSrc?: string | null;
  embedSrc?: string | null;
  posterSrc?: string | null;
  label?: string;
};

type Program = {
  title: string;
  description: string;
  duration?: string;
  proof?: string;
  media?: ProgramMedia;
};

type ChannelDefinition = {
  id: string;
  number: string;
  name: string;
  group: string;
  description: string;
  kind: StreamKind;
  badgeClass: string;
  logoSrc?: string | null;
  logoLabel?: string;
  defaultMedia?: ProgramMedia;
  lineup: Program[];
};

type ChannelSlot = {
  slotIndex: number;
  hour: number;
  label: string;
  status: SlotStatus;
  program: Program;
};

type ChannelRow = ChannelDefinition & {
  slots: ChannelSlot[];
};

type SelectedCell = {
  channelId: string;
  channelName: string;
  slotIndex: number;
  timeLabel: string;
  status: SlotStatus;
  program: Program;
};

const STORYSPHERE_LINEUP: Program[] = [
  { title: "StorySphere Prime", description: "Prompt to MP4 showcase", proof: "ss:prime" },
  { title: "Creator Cuts", description: "Shortform episodics", proof: "ss:cuts" },
  { title: "GameGrid Spotlight", description: "PIP Arcade highlights", proof: "ss:grid" },
  { title: "Studio Live", description: "Behind the scenes renders", proof: "ss:studio" },
  { title: "Proof Sessions", description: "Signed publish breakdowns", proof: "ss:proof" },
  { title: "LiveLoop Ready", description: "Queued for broadcast", proof: "ss:queue" }
];

const NEWS_LINEUP: Program[] = [
  { title: "ILLUVRSE News Desk", description: "Daily headline briefing", proof: "news:desk" },
  { title: "World Pulse", description: "Global updates and context", proof: "news:pulse" },
  { title: "Tech Brief", description: "AI, media, and platform updates", proof: "news:tech" },
  { title: "Market Loop", description: "Creator economy snapshots", proof: "news:market" },
  { title: "Operator Watch", description: "Policy and safety updates", proof: "news:ops" },
  { title: "Night Recap", description: "Evening overview", proof: "news:recap" }
];

const LIVESTREAM_LINEUP_A: Program[] = [
  { title: "ILLUVRSE LiveStream 1", description: "Studio cam and commentary", proof: "ls:1" },
  { title: "Creator Live", description: "Featured creator sessions", proof: "ls:creator" },
  { title: "Build Room", description: "Agent build stream", proof: "ls:build" },
  { title: "Pipeline Watch", description: "Render queue watch", proof: "ls:pipeline" },
  { title: "LiveLoop Ops", description: "Operator control room", proof: "ls:ops" },
  { title: "After Hours", description: "Night stream", proof: "ls:after" }
];

const LIVESTREAM_LINEUP_B: Program[] = [
  { title: "ILLUVRSE LiveStream 2", description: "Alt angles and guests", proof: "ls:2" },
  { title: "Creator Jam", description: "Collab session", proof: "ls:jam" },
  { title: "Marketplace Live", description: "Drops and premieres", proof: "ls:market" },
  { title: "Proof Review", description: "Verification walkthroughs", proof: "ls:proof" },
  { title: "Studio Recap", description: "Daily recap stream", proof: "ls:recap" },
  { title: "Night Studio", description: "Late session stream", proof: "ls:night" }
];

const liveLoopPreviewSrc = "/00efdd5717132ce3a95944dd2f83dba6-360p.mp4";
const liveLoopPosterSrc = "/__ia_thumb.jpg";
const channelLogoFallback = "/logo.png";
const newsLogoSrc = "/news/logo.png";
const sampleVideoClips = [
  "/00efdd5717132ce3a95944dd2f83dba6-360p.mp4",
  "/24e066e09cdc6be412932c8d4931be82-360p.mp4",
  "/336c804badc6fef506bdf195c9cd630d-360p.mp4",
  "/41128b5c3c2905aa12949f91baa41bb0-360p.mp4",
  "/49bbfdaaed20cc2607fda85cf546ae39-360p.mp4",
  "/5659225e3fe01090ed5aa0aabe1ef79d-360p.mp4",
  "/66abbce106f2d89f3b91e4d51c397722-360p.mp4",
  "/68f07bc39b20fb1f60283ad1c123a4f4-360p.mp4",
  "/68b5dd29192945efa064ed1710e5e55c-360p.mp4",
  "/84cee6cbf5f14e2f4ae1ec1acc672c6e-360p.mp4",
  "/a93c48ce8fd735707a8a24f4346d8f4f-360p.mp4",
  "/a9893626aed713310ba62370f6baec4c-360p.mp4"
];

const EIFFEL_TOWER_EMBED =
  process.env.NEXT_PUBLIC_EIFFEL_TOWER_EMBED ||
  "https://player.earthtv.com/?token=EAIY6wE41rjNHUgG.CgdlYXJ0aHR2EgtIY1RKeEkwQUJmcxoLSHBMOS1Yb0FCajQ.c4Lq8XFWeq5SnJFd4IAmEjmPFAvjHMOoeGdcV0AWeJbgad0Uq2VHNHPqIiXExAN87Dr5_JOvaue3GqQIAf-HdQ";
const FIJI_BEACH_EMBED =
  "https://g3.ipcamlive.com/player/player.php?alias=63071899d8407&autoplay=true";

const EIFFEL_TOWER_LINEUP: Program[] = [
  {
    title: "Eiffel Tower Live",
    description: "EarthTV Paris live cam.",
    duration: "Live",
    proof: "cam:eiffel",
    media: {
      kind: "video",
      embedSrc: EIFFEL_TOWER_EMBED,
      label: "Eiffel Tower"
    }
  }
];

const FIJI_BEACH_LINEUP: Program[] = [
  {
    title: "Fiji Beach Live",
    description: "Plantation Island Resort beach cam in Malolo Lailai, Fiji.",
    duration: "Live",
    proof: "cam:fiji",
    media: {
      kind: "video",
      embedSrc: FIJI_BEACH_EMBED,
      label: "Fiji Beach"
    }
  }
];

const fallbackStations = {
  npr: {
    id: "fallback-npr",
    name: "NPR News",
    slug: "npr-news",
    streamUrl: "https://npr-ice.streamguys1.com/live.mp3",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/NPR_logo.svg/320px-NPR_logo.svg.png",
    countryCode: "US",
    genre: "News",
    bitrate: 128,
    codec: "mp3",
    status: "unknown"
  },
  deutschlandfunk: {
    id: "fallback-deutschlandfunk",
    name: "Deutschlandfunk",
    slug: "deutschlandfunk",
    streamUrl: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    logoUrl: null,
    countryCode: "DE",
    genre: "News",
    bitrate: 128,
    codec: "mp3",
    status: "unknown"
  },
  bbcWorldService: {
    id: "fallback-bbc-world-service",
    name: "BBC World Service",
    slug: "bbc-world-service",
    streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    logoUrl: null,
    countryCode: "GB",
    region: "EU",
    genre: "News",
    bitrate: 128,
    codec: "mp3",
    status: "unknown"
  },
  radioFranceInternationale: {
    id: "fallback-rfi",
    name: "Radio France Internationale",
    slug: "radio-france-internationale",
    streamUrl: "https://stream11.tdiradio.com/rfi/rfia/francais/mp3-128/rfia.mp3",
    logoUrl: null,
    countryCode: "FR",
    region: "EU",
    genre: "News",
    bitrate: 128,
    codec: "mp3",
    status: "unknown"
  },
  voiceOfNigeria: {
    id: "fallback-voice-of-nigeria",
    name: "Voice of Nigeria",
    slug: "voice-of-nigeria",
    streamUrl: "",
    logoUrl: null,
    countryCode: "NG",
    region: "AF",
    genre: "News",
    status: "unknown"
  },
  allIndiaRadioExternal: {
    id: "fallback-air-external",
    name: "All India Radio External Services",
    slug: "all-india-radio-external-services",
    streamUrl: "",
    logoUrl: null,
    countryCode: "IN",
    region: "AS",
    genre: "News",
    status: "unknown"
  },
  channelAfrica: {
    id: "fallback-channel-africa",
    name: "Channel Africa",
    slug: "channel-africa",
    streamUrl: "",
    logoUrl: null,
    countryCode: "ZA",
    region: "AF",
    genre: "News",
    status: "unknown"
  },
  vov1: {
    id: "fallback-vov1",
    name: "VOV1 News",
    slug: "vov1-news",
    streamUrl: "https://str.vov.gov.vn/vovlive/vov1vov5Vietnamese.sdp_aac/playlist.m3u8",
    logoUrl: null,
    countryCode: "VN",
    genre: "News",
    bitrate: 128,
    codec: "aac",
    status: "unknown"
  },
  vov5: {
    id: "fallback-vov5",
    name: "VOV5 International",
    slug: "vov5-international",
    streamUrl: "https://stream.vovmedia.vn/vov5",
    logoUrl: null,
    countryCode: "VN",
    genre: "News",
    bitrate: 128,
    codec: "aac",
    status: "unknown"
  }
};

const gridTemplate = "minmax(240px, 280px) repeat(6, minmax(140px, 1fr))";

function pad(num: number) {
  return String(num).padStart(2, "0");
}

function getTimeZoneLabel(now: Date, mode: TimezoneMode) {
  if (mode === "utc") return "UTC";
  const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(now);
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "Local";
}

function buildWindow(now: Date, mode: TimezoneMode, windowOffset: number) {
  const currentHour = mode === "utc" ? now.getUTCHours() : now.getHours();
  const currentMinute = mode === "utc" ? now.getUTCMinutes() : now.getMinutes();
  const startHour = ((currentHour + windowOffset * 6) % 24 + 24) % 24;
  const endHour = (startHour + 6) % 24;
  const windowLabel = `${pad(startHour)}:00-${pad(endHour)}:00`;
  const timeSlots = Array.from({ length: 6 }, (_, slotIndex) => {
    const hour = (startHour + slotIndex) % 24;
    let status: SlotStatus = "completed";
    if (windowOffset === 0) {
      status = slotIndex === 0 ? "live" : "upcoming";
    } else if (windowOffset > 0) {
      status = "upcoming";
    }
    return {
      slotIndex,
      hour,
      label: `${pad(hour)}:00`,
      status
    };
  });

  return {
    currentHour,
    currentMinute,
    startHour,
    windowLabel,
    timeSlots
  };
}

const directVideoPattern = /\.(m3u8|mp4|webm)(\?|$)/i;

function isDirectVideo(url?: string | null) {
  if (!url) return false;
  return directVideoPattern.test(url);
}

function formatLocation(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" - ");
}

function describeStation(station: StationData) {
  const region = station.region ?? station.countryCode;
  const detailParts = [station.genre, region].filter(Boolean);
  const audioMeta: string[] = [];
  if (station.bitrate) audioMeta.push(`${station.bitrate}kbps`);
  if (station.codec) audioMeta.push(station.codec.toUpperCase());
  return [...detailParts, ...audioMeta].filter(Boolean).join(" - ") || "Public radio stream";
}

function findStation(stations: StationData[], tokens: string[]) {
  const normalizedTokens = tokens.map((token) => token.toLowerCase());
  return (
    stations.find((station) => {
      const haystack = `${station.name} ${station.slug}`.toLowerCase();
      return normalizedTokens.some((token) => haystack.includes(token));
    }) ?? null
  );
}

function resolveStation(
  station: StationData | null,
  fallback: StationData,
  overrides?: Partial<StationData>
) {
  const base = station ?? fallback;
  return {
    ...base,
    ...overrides,
    id: base.id,
    slug: overrides?.slug ?? base.slug,
    streamUrl: overrides?.streamUrl ?? base.streamUrl
  };
}

function normalizeVovStream(station: StationData, fallback: StationData) {
  if (!station.streamUrl || station.streamUrl.includes("vovmedia.vov.vn/stream")) {
    return { ...station, streamUrl: fallback.streamUrl };
  }
  return station;
}

function buildStationProgram(
  station: StationData,
  options?: {
    title?: string;
    description?: string;
    duration?: string;
    proof?: string;
    label?: string;
  }
): Program {
  return {
    title: options?.title ?? station.name,
    description: options?.description ?? describeStation(station),
    duration: options?.duration ?? "Live",
    proof: options?.proof ?? station.slug,
    media: {
      kind: "audio",
      streamSrc: station.streamUrl || null,
      posterSrc: station.logoUrl ?? null,
      label: options?.label ?? options?.title ?? station.name
    }
  };
}

function buildNewsLineupFromContent(videos: VideoData[], articles: ArticleData[]) {
  if (videos.length) {
    const mapped = videos.slice(0, 12).map((video) => {
      const streamSrc = video.live
        ? video.liveUrl ?? video.hlsUrl ?? video.mp4Url ?? null
        : video.hlsUrl ?? video.mp4Url ?? video.liveUrl ?? null;
      return {
        title: video.title,
        description: video.description ?? (video.live ? "Live news broadcast" : "News video"),
        duration: video.live ? "Live" : undefined,
        proof: video.slug,
        media: {
          kind: "video",
          streamSrc,
          posterSrc: video.thumbnail ?? null,
          label: video.title
        }
      };
    });
    return mapped.length ? mapped : NEWS_LINEUP;
  }
  if (articles.length) {
    const mapped = articles.slice(0, 12).map((article) => ({
      title: article.title,
      description: article.summary ?? article.excerpt ?? "ILLUVRSE News report",
      proof: article.slug
    }));
    return mapped.length ? mapped : NEWS_LINEUP;
  }
  return NEWS_LINEUP;
}

function buildStreamLineups(streams: StreamData[]) {
  const mapped = streams.slice(0, 12).map((stream) => {
    const media: ProgramMedia = isDirectVideo(stream.embedUrl)
      ? { kind: "video", streamSrc: stream.embedUrl, posterSrc: stream.posterImage ?? null }
      : { kind: "video", embedSrc: stream.embedUrl, posterSrc: stream.posterImage ?? null };
    const description =
      formatLocation([stream.locationName, stream.countryCode]) ||
      stream.attribution ||
      "Public live feed";
    return {
      title: stream.name,
      description,
      proof: stream.slug,
      media: {
        ...media,
        label: stream.name
      }
    };
  });
  if (!mapped.length) {
    return { primary: LIVESTREAM_LINEUP_A, secondary: LIVESTREAM_LINEUP_B };
  }
  const primary = mapped.slice(0, 6);
  const secondary = mapped.slice(6, 12);
  return {
    primary: primary.length ? primary : mapped,
    secondary: secondary.length ? secondary : mapped.length ? mapped : LIVESTREAM_LINEUP_B
  };
}

function pickLogoFromLineup(lineup: Program[], fallback: string) {
  return lineup.find((item) => item.media?.posterSrc)?.media?.posterSrc ?? fallback;
}

function attachVideoMedia(
  lineup: Program[],
  options?: { offset?: number; labelPrefix?: string; posterSrc?: string }
) {
  if (!lineup.length || !sampleVideoClips.length) return lineup;
  const offset = options?.offset ?? 0;
  return lineup.map((program, index) => {
    if (program.media) return program;
    const clip = sampleVideoClips[(index + offset) % sampleVideoClips.length];
    return {
      ...program,
      media: {
        kind: "video",
        streamSrc: clip,
        posterSrc: options?.posterSrc ?? liveLoopPosterSrc,
        label: options?.labelPrefix ? `${options.labelPrefix} ${index + 1}` : program.title
      }
    };
  });
}

function LiveLoopPlayer({
  kind,
  embedSrc,
  streamSrc,
  fallbackMp4,
  posterSrc,
  label,
  audioPlayToken
}: {
  kind: StreamKind;
  embedSrc?: string | null;
  streamSrc?: string | null;
  fallbackMp4?: string | null;
  posterSrc?: string;
  label?: string | null;
  audioPlayToken?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (kind !== "audio") return;
    const audio = audioRef.current;
    if (!audio || !streamSrc) return;

    const cleanupHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    cleanupHls();

    if (streamSrc.includes(".m3u8")) {
      const maybeSupportsNative = audio.canPlayType("application/vnd.apple.mpegurl");
      if (maybeSupportsNative) {
        audio.src = streamSrc;
      } else {
        audio.removeAttribute("src");
        audio.load();
        let cancelled = false;
        import("hls.js")
          .then(({ default: Hls }) => {
            if (cancelled) return;
            if (!Hls.isSupported()) {
              audio.src = streamSrc;
              const playPromise = audio.play();
              if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {});
              }
              return;
            }
            const hls = new Hls({ enableWorker: true });
            hls.loadSource(streamSrc);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              const playPromise = audio.play();
              if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {});
              }
            });
            hlsRef.current = hls;
          })
          .catch(() => {
            audio.src = streamSrc;
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          });

        return () => {
          cancelled = true;
          cleanupHls();
        };
      }
    } else {
      audio.src = streamSrc;
    }

    return () => {
      cleanupHls();
    };
  }, [kind, streamSrc]);

  useEffect(() => {
    if (kind !== "audio") return;
    const audio = audioRef.current;
    if (!audio || !streamSrc) return;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [kind, streamSrc, audioPlayToken]);

  if (kind === "audio") {
    if (!streamSrc) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          Audio stream is offline. Add a station source to enable playback.
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="h-14 w-14 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {posterSrc ? (
              <img src={posterSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                Audio
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Live audio</div>
            <div className="text-lg font-semibold text-white">{label ?? "Radio stream"}</div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <audio
            ref={audioRef}
            controls
            preload="none"
            className="w-full"
          />
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-emerald-600/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          Live
        </div>
      </div>
    );
  }

  if (embedSrc) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <iframe
          src={embedSrc}
          title={label ? `${label} player` : "Live stream player"}
          className="block aspect-video w-full"
          allow="autoplay; fullscreen; picture-in-picture"
        />
        <div className="absolute left-3 top-3 rounded-full bg-emerald-600/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          Live
        </div>
      </div>
    );
  }

  const videoSrc = streamSrc || fallbackMp4;
  const isHls = Boolean(videoSrc?.includes(".m3u8"));
  const sourceType = isHls ? "application/vnd.apple.mpegurl" : "video/mp4";
  if (!videoSrc) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
        Stream is offline. Add a stream source to enable playback.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
      <video
        className="aspect-video w-full object-cover"
        controls
        preload="none"
        poster={posterSrc}
        playsInline
      >
        <source src={videoSrc} type={sourceType} />
      </video>
      <div className="absolute left-3 top-3 rounded-full bg-emerald-600/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
        Live
      </div>
    </div>
  );
}

export default function LiveLoopClient({
  stations = [],
  streams = [],
  videos = [],
  articles = []
}: {
  stations: StationData[];
  streams: StreamData[];
  videos: VideoData[];
  articles: ArticleData[];
}) {
  const [now, setNow] = useState(() => new Date());
  const [timezone, setTimezone] = useState<TimezoneMode>("local");
  const [windowOffset, setWindowOffset] = useState(0);
  const [playlist, setPlaylist] = useState<LiveLoopItem[]>(defaultPlaylist);
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [audioPlayToken, setAudioPlayToken] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/studio/api/v1/liveloop/playlist")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.playlist) {
          setPlaylist(data.playlist as LiveLoopItem[]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const preferredStations = useMemo(() => {
    const npr = resolveStation(findStation(stations, ["npr"]), fallbackStations.npr, {
      name: "NPR News",
      slug: "npr-news"
    });
    const deutschlandfunk = resolveStation(
      findStation(stations, ["deutschlandfunk", "dlf"]),
      fallbackStations.deutschlandfunk,
      {
        name: "Deutschlandfunk",
        slug: "deutschlandfunk"
      }
    );
    const bbcWorldService = resolveStation(
      findStation(stations, ["bbc world service", "bbc world"]),
      fallbackStations.bbcWorldService,
      {
        name: "BBC World Service",
        slug: "bbc-world-service"
      }
    );
    const radioFranceInternationale = resolveStation(
      findStation(stations, ["radio france internationale", "rfi", "rfi monde"]),
      fallbackStations.radioFranceInternationale,
      {
        name: "Radio France Internationale",
        slug: "radio-france-internationale"
      }
    );
    const voiceOfNigeria = resolveStation(
      findStation(stations, ["voice of nigeria"]),
      fallbackStations.voiceOfNigeria,
      {
        name: "Voice of Nigeria",
        slug: "voice-of-nigeria"
      }
    );
    const allIndiaRadioExternal = resolveStation(
      findStation(stations, ["all india radio", "external services", "akashvani"]),
      fallbackStations.allIndiaRadioExternal,
      {
        name: "All India Radio External Services",
        slug: "all-india-radio-external-services"
      }
    );
    const channelAfrica = resolveStation(
      findStation(stations, ["channel africa"]),
      fallbackStations.channelAfrica,
      {
        name: "Channel Africa",
        slug: "channel-africa"
      }
    );
    const vov1 = normalizeVovStream(
      resolveStation(findStation(stations, ["vov1", "voice of vietnam", "vov"]), fallbackStations.vov1, {
        name: "VOV1 News",
        slug: "vov1-news"
      }),
      fallbackStations.vov1
    );
    const vov5 = normalizeVovStream(
      resolveStation(findStation(stations, ["vov5", "voice of vietnam", "vov"]), fallbackStations.vov5, {
        name: "VOV5 International",
        slug: "vov5-international"
      }),
      fallbackStations.vov5
    );
    return {
      npr,
      deutschlandfunk,
      bbcWorldService,
      radioFranceInternationale,
      voiceOfNigeria,
      allIndiaRadioExternal,
      channelAfrica,
      vov1,
      vov5
    };
  }, [stations]);

  const nprProgram = useMemo(
    () =>
      buildStationProgram(preferredStations.npr, {
        title: "NPR News",
        description:
          "America's public radio news network. National and international coverage.",
        label: "NPR News"
      }),
    [preferredStations.npr]
  );

  const deutschlandfunkProgram = useMemo(
    () =>
      buildStationProgram(preferredStations.deutschlandfunk, {
        title: "Deutschlandfunk",
        description:
          "Germany's national public radio service. News, analysis, science, and culture.",
        label: "Deutschlandfunk"
      }),
    [preferredStations.deutschlandfunk]
  );

  const bbcWorldServiceProgram = useMemo(
    () =>
      buildStationProgram(preferredStations.bbcWorldService, {
        title: "BBC World Service",
        description: "BBC's international news and analysis service.",
        label: "BBC World Service"
      }),
    [preferredStations.bbcWorldService]
  );

  const radioFranceInternationaleProgram = useMemo(
    () =>
      buildStationProgram(preferredStations.radioFranceInternationale, {
        title: "Radio France Internationale",
        description: "France's international public news radio service.",
        label: "RFI"
      }),
    [preferredStations.radioFranceInternationale]
  );

  const voiceOfNigeriaProgram = useMemo(
    () =>
      buildStationProgram(preferredStations.voiceOfNigeria, {
        title: "Voice of Nigeria",
        description: "Nigeria's international broadcaster. Stream pending.",
        label: "VON"
      }),
    [preferredStations.voiceOfNigeria]
  );

  const allIndiaRadioExternalProgram = useMemo(
    () =>
      buildStationProgram(preferredStations.allIndiaRadioExternal, {
        title: "All India Radio External Services",
        description: "India's external services network. Stream pending.",
        label: "AIR External"
      }),
    [preferredStations.allIndiaRadioExternal]
  );

  const channelAfricaProgram = useMemo(
    () =>
      buildStationProgram(preferredStations.channelAfrica, {
        title: "Channel Africa",
        description: "SABC international service. Stream pending.",
        label: "Channel Africa"
      }),
    [preferredStations.channelAfrica]
  );

  const vovPrograms = useMemo(() => {
    const vov1Program = buildStationProgram(preferredStations.vov1, {
      title: "VOV1 News",
      description: "Voice of Vietnam domestic news in Vietnamese.",
      label: "VOV1"
    });
    const vov5Program = buildStationProgram(preferredStations.vov5, {
      title: "VOV5 International",
      description: "Voice of Vietnam international service in English.",
      label: "VOV5"
    });
    return [vov1Program, vov5Program];
  }, [preferredStations.vov1, preferredStations.vov5]);

  const newsLineup = useMemo(() => {
    if (nprProgram.media?.streamSrc) {
      return [nprProgram];
    }
    return buildNewsLineupFromContent(videos, articles);
  }, [nprProgram, videos, articles]);

  const radioLineupA = useMemo(() => [deutschlandfunkProgram], [deutschlandfunkProgram]);
  const radioLineupB = useMemo(() => [bbcWorldServiceProgram], [bbcWorldServiceProgram]);
  const radioLineupC = useMemo(() => [radioFranceInternationaleProgram], [radioFranceInternationaleProgram]);
  const radioLineupD = useMemo(() => [voiceOfNigeriaProgram], [voiceOfNigeriaProgram]);
  const radioLineupE = useMemo(() => [allIndiaRadioExternalProgram], [allIndiaRadioExternalProgram]);
  const radioLineupF = useMemo(() => [channelAfricaProgram], [channelAfricaProgram]);
  const radioLineupG = useMemo(() => vovPrograms, [vovPrograms]);

  const { primary: liveStreamLineupA, secondary: liveStreamLineupB } = useMemo(
    () => buildStreamLineups(streams),
    [streams]
  );

  const timeZoneLabel = useMemo(() => getTimeZoneLabel(now, timezone), [now, timezone]);
  const { currentHour, currentMinute, startHour, windowLabel, timeSlots } = useMemo(
    () => buildWindow(now, timezone, windowOffset),
    [now, timezone, windowOffset]
  );
  const currentTimeLabel = `${pad(currentHour)}:${pad(currentMinute)} ${timeZoneLabel}`;

  const onAirItem = useMemo(
    () => playlist.find((item) => item.status === "On Air") ?? playlist[0],
    [playlist]
  );
  const nextItem = useMemo(
    () =>
      playlist.find((item) => item.status === "Next") ??
      playlist.find((item) => item.status === "Queued") ??
      playlist[1],
    [playlist]
  );
  const queuedItems = useMemo(
    () => playlist.filter((item) => item.status === "Queued"),
    [playlist]
  );

  const liveLoopLineup = useMemo<Program[]>(() => {
    const queue: LiveLoopItem[] = [];
    const seen = new Set<string>();
    const pushUnique = (item?: LiveLoopItem) => {
      if (!item || seen.has(item.id)) return;
      seen.add(item.id);
      queue.push(item);
    };
    pushUnique(onAirItem);
    pushUnique(nextItem);
    queuedItems.forEach((item) => pushUnique(item));
    const mapped = queue.map((item) => ({
      title: item.title,
      description: item.status === "On Air" ? "LiveLoop on air block" : "LiveLoop scheduled slot",
      duration: item.duration,
      proof: item.sha
    }));
    if (mapped.length) return mapped;
    return [
      { title: "LiveLoop Prime", description: "Featured StorySphere rotation", proof: "lv:prime" },
      { title: "LiveLoop Spotlight", description: "Creator showcases", proof: "lv:spotlight" },
      { title: "LiveLoop Classics", description: "Signed archive playback", proof: "lv:classics" }
    ];
  }, [onAirItem, nextItem, queuedItems]);

  const storySphereLineup = useMemo(
    () => attachVideoMedia(STORYSPHERE_LINEUP, { offset: 0, labelPrefix: "StorySphere" }),
    []
  );
  const liveLoopLineupWithMedia = useMemo(
    () => attachVideoMedia(liveLoopLineup, { offset: 4, labelPrefix: "LiveLoop" }),
    [liveLoopLineup]
  );

  const liveLoopEmbedSrc = process.env.NEXT_PUBLIC_LIVELOOP_EMBED || null;
  const liveLoopStreamSrc = process.env.NEXT_PUBLIC_LIVELOOP_SRC || null;
  const storyEmbedSrc = process.env.NEXT_PUBLIC_STORYSPHERE_EMBED || null;
  const storyStreamSrc = process.env.NEXT_PUBLIC_STORYSPHERE_SRC || null;
  const fallbackMp4 = process.env.NEXT_PUBLIC_LIVELOOP_FALLBACK_MP4 || liveLoopPreviewSrc;

  const storyDefaultMedia = useMemo<ProgramMedia>(
    () => ({
      kind: "video",
      embedSrc: storyEmbedSrc,
      streamSrc: storyStreamSrc ?? fallbackMp4,
      posterSrc: liveLoopPosterSrc,
      label: "StorySphere"
    }),
    [storyEmbedSrc, storyStreamSrc, fallbackMp4]
  );

  const liveLoopDefaultMedia = useMemo<ProgramMedia>(
    () => ({
      kind: "video",
      embedSrc: liveLoopEmbedSrc,
      streamSrc: liveLoopStreamSrc ?? fallbackMp4,
      posterSrc: liveLoopPosterSrc,
      label: "LiveLoop"
    }),
    [liveLoopEmbedSrc, liveLoopStreamSrc, fallbackMp4]
  );

  const newsDefaultMedia = newsLineup.find((item) => item.media)?.media;
  const radioDefaultMedia = radioLineupA.find((item) => item.media)?.media;
  const radioBbcDefaultMedia = radioLineupB.find((item) => item.media)?.media;
  const radioRfiDefaultMedia = radioLineupC.find((item) => item.media)?.media;
  const radioVonDefaultMedia = radioLineupD.find((item) => item.media)?.media;
  const radioAirDefaultMedia = radioLineupE.find((item) => item.media)?.media;
  const radioAfricaDefaultMedia = radioLineupF.find((item) => item.media)?.media;
  const radioAltDefaultMedia = radioLineupG.find((item) => item.media)?.media;
  const liveStreamDefaultMedia = liveStreamLineupA.find((item) => item.media)?.media;
  const liveStreamAltDefaultMedia = liveStreamLineupB.find((item) => item.media)?.media;
  const eiffelDefaultMedia = EIFFEL_TOWER_LINEUP[0]?.media;
  const fijiDefaultMedia = FIJI_BEACH_LINEUP[0]?.media;

  const channels = useMemo<ChannelDefinition[]>(
    () => [
      {
        id: "illuvrse1",
        number: "101",
        name: "ILLUVRSE1",
        group: "StorySphere",
        description: "Flagship StorySphere channel",
        kind: "video",
        badgeClass: "bg-emerald-500/20 text-emerald-100",
        logoSrc: channelLogoFallback,
        logoLabel: "ILL",
        defaultMedia: storyDefaultMedia,
        lineup: storySphereLineup
      },
      {
        id: "illuvrse2",
        number: "102",
        name: "ILLUVRSE2",
        group: "LiveLoop",
        description: "LiveLoop prime rotation",
        kind: "video",
        badgeClass: "bg-teal-500/20 text-teal-100",
        logoSrc: channelLogoFallback,
        logoLabel: "ILL",
        defaultMedia: liveLoopDefaultMedia,
        lineup: liveLoopLineupWithMedia
      },
      {
        id: "illuvrse-news",
        number: "201",
        name: "ILLUVRSE News",
        group: "News",
        description: "NPR News (USA) public radio network",
        kind: "audio",
        badgeClass: "bg-sky-500/20 text-sky-100",
        logoSrc: preferredStations.npr.logoUrl ?? newsLogoSrc,
        logoLabel: "NPR",
        defaultMedia: newsDefaultMedia,
        lineup: newsLineup
      },
      {
        id: "illuvrse-radio-1",
        number: "301",
        name: "Deutschlandfunk",
        group: "Radio",
        description: "Germany's national public radio service",
        kind: "audio",
        badgeClass: "bg-amber-500/20 text-amber-100",
        logoSrc: preferredStations.deutschlandfunk.logoUrl ?? null,
        logoLabel: "DLF",
        defaultMedia: radioDefaultMedia,
        lineup: radioLineupA
      },
      {
        id: "illuvrse-radio-2",
        number: "302",
        name: "BBC World Service",
        group: "Radio",
        description: "BBC international news and analysis",
        kind: "audio",
        badgeClass: "bg-rose-500/20 text-rose-100",
        logoSrc: preferredStations.bbcWorldService.logoUrl ?? null,
        logoLabel: "BBC",
        defaultMedia: radioBbcDefaultMedia,
        lineup: radioLineupB
      },
      {
        id: "illuvrse-radio-3",
        number: "303",
        name: "Radio France Internationale",
        group: "Radio",
        description: "France's international public news radio service",
        kind: "audio",
        badgeClass: "bg-red-500/20 text-red-100",
        logoSrc: preferredStations.radioFranceInternationale.logoUrl ?? null,
        logoLabel: "RFI",
        defaultMedia: radioRfiDefaultMedia,
        lineup: radioLineupC
      },
      {
        id: "illuvrse-radio-4",
        number: "304",
        name: "Voice of Nigeria",
        group: "Radio",
        description: "Nigeria's international broadcaster",
        kind: "audio",
        badgeClass: "bg-orange-500/20 text-orange-100",
        logoSrc: preferredStations.voiceOfNigeria.logoUrl ?? null,
        logoLabel: "VON",
        defaultMedia: radioVonDefaultMedia,
        lineup: radioLineupD
      },
      {
        id: "illuvrse-radio-5",
        number: "305",
        name: "All India Radio External Services",
        group: "Radio",
        description: "India's external services network",
        kind: "audio",
        badgeClass: "bg-yellow-500/20 text-yellow-100",
        logoSrc: preferredStations.allIndiaRadioExternal.logoUrl ?? null,
        logoLabel: "AIR",
        defaultMedia: radioAirDefaultMedia,
        lineup: radioLineupE
      },
      {
        id: "illuvrse-radio-6",
        number: "306",
        name: "Channel Africa",
        group: "Radio",
        description: "SABC international service",
        kind: "audio",
        badgeClass: "bg-lime-500/20 text-lime-100",
        logoSrc: preferredStations.channelAfrica.logoUrl ?? null,
        logoLabel: "CAF",
        defaultMedia: radioAfricaDefaultMedia,
        lineup: radioLineupF
      },
      {
        id: "illuvrse-radio-7",
        number: "307",
        name: "Voice of Vietnam",
        group: "Radio",
        description: "VOV1 domestic news and VOV5 international",
        kind: "audio",
        badgeClass: "bg-orange-500/20 text-orange-100",
        logoSrc:
          preferredStations.vov1.logoUrl ??
          preferredStations.vov5.logoUrl ??
          null,
        logoLabel: "VOV",
        defaultMedia: radioAltDefaultMedia,
        lineup: radioLineupG
      },
      {
        id: "illuvrse-livestream-1",
        number: "401",
        name: "ILLUVRSE LiveStream 1",
        group: "LiveStream",
        description: "Studio live feed",
        kind: "video",
        badgeClass: "bg-fuchsia-500/20 text-fuchsia-100",
        logoSrc: pickLogoFromLineup(liveStreamLineupA, channelLogoFallback),
        logoLabel: "LIVE",
        defaultMedia: liveStreamDefaultMedia,
        lineup: liveStreamLineupA
      },
      {
        id: "illuvrse-livestream-2",
        number: "402",
        name: "ILLUVRSE LiveStream 2",
        group: "LiveStream",
        description: "Alternate live feed",
        kind: "video",
        badgeClass: "bg-purple-500/20 text-purple-100",
        logoSrc: pickLogoFromLineup(liveStreamLineupB, channelLogoFallback),
        logoLabel: "LIVE",
        defaultMedia: liveStreamAltDefaultMedia,
        lineup: liveStreamLineupB
      },
      {
        id: "livecam-eiffel",
        number: "403",
        name: "Eiffel Tower Live",
        group: "LiveStream",
        description: "EarthTV Paris live cam",
        kind: "video",
        badgeClass: "bg-rose-500/20 text-rose-100",
        logoSrc: null,
        logoLabel: "PAR",
        defaultMedia: eiffelDefaultMedia,
        lineup: EIFFEL_TOWER_LINEUP
      },
      {
        id: "livecam-fiji",
        number: "404",
        name: "Fiji Beach Live",
        group: "LiveStream",
        description: "Plantation Island Resort, Fiji",
        kind: "video",
        badgeClass: "bg-cyan-500/20 text-cyan-100",
        logoSrc: null,
        logoLabel: "FIJI",
        defaultMedia: fijiDefaultMedia,
        lineup: FIJI_BEACH_LINEUP
      }
    ],
    [
      liveLoopLineupWithMedia,
      liveLoopDefaultMedia,
      storyDefaultMedia,
      storySphereLineup,
      newsLineup,
      newsDefaultMedia,
      radioLineupA,
      radioLineupB,
      radioLineupC,
      radioLineupD,
      radioLineupE,
      radioLineupF,
      radioLineupG,
      radioDefaultMedia,
      radioBbcDefaultMedia,
      radioRfiDefaultMedia,
      radioVonDefaultMedia,
      radioAirDefaultMedia,
      radioAfricaDefaultMedia,
      radioAltDefaultMedia,
      liveStreamLineupA,
      liveStreamLineupB,
      liveStreamDefaultMedia,
      liveStreamAltDefaultMedia,
      preferredStations,
      eiffelDefaultMedia,
      fijiDefaultMedia
    ]
  );

  const channelRows = useMemo<ChannelRow[]>(
    () =>
      channels.map((channel) => {
        const slots = timeSlots.map((slot) => {
          const programIndex = (startHour + slot.slotIndex) % channel.lineup.length;
          const program = channel.lineup[programIndex];
          return {
            ...slot,
            program
          };
        });
        return { ...channel, slots };
      }),
    [channels, timeSlots, startHour]
  );

  const handleSlotSelect = useCallback((channel: ChannelRow, slot: ChannelSlot) => {
    setSelected({
      channelId: channel.id,
      channelName: channel.name,
      slotIndex: slot.slotIndex,
      timeLabel: slot.label,
      status: slot.status,
      program: slot.program
    });
    const targetMedia = slot.program.media ?? channel.defaultMedia ?? null;
    if (targetMedia?.kind === "audio" && targetMedia.streamSrc) {
      setAudioPlayToken((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (!channelRows.length) return;
    setSelected((prev) => {
      const row =
        channelRows.find((channel) => channel.id === prev?.channelId) ?? channelRows[0];
      const slotIndex = prev?.slotIndex ?? 0;
      const slot = row.slots[slotIndex] ?? row.slots[0];
      return {
        channelId: row.id,
        channelName: row.name,
        slotIndex: slot.slotIndex,
        timeLabel: slot.label,
        status: slot.status,
        program: slot.program
      };
    });
  }, [channelRows]);

  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  useEffect(() => {
    const target = slotRefs.current[0];
    if (windowOffset === 0 && target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [windowOffset, timeSlots]);

  const selectedStatusLabel =
    selected?.status === "live" ? "Live" : selected?.status === "upcoming" ? "Upcoming" : "Completed";
  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === selected?.channelId) ?? channels[0],
    [channels, selected?.channelId]
  );
  const activeProgram = selected?.program ?? activeChannel?.lineup?.[0];
  const activeMedia = activeProgram?.media ?? activeChannel?.defaultMedia ?? null;
  const lineupMedia =
    activeChannel?.lineup?.find((program) => program.media)?.media ?? null;
  const channelFallbackMedia =
    activeChannel?.id === "livecam-eiffel"
      ? { kind: "video" as const, embedSrc: EIFFEL_TOWER_EMBED, label: "Eiffel Tower" }
      : activeChannel?.id === "livecam-fiji"
        ? { kind: "video" as const, embedSrc: FIJI_BEACH_EMBED, label: "Fiji Beach" }
        : null;
  const resolvedMedia = activeMedia ?? lineupMedia ?? channelFallbackMedia;
  const activeKind = resolvedMedia?.kind ?? activeChannel?.kind ?? "video";
  const playerFallback =
    activeKind === "video" &&
    (activeChannel?.id === "illuvrse1" || activeChannel?.id === "illuvrse2")
      ? fallbackMp4
      : null;
  const playerPoster =
    activeKind === "audio"
      ? resolvedMedia?.posterSrc ?? activeChannel?.logoSrc ?? null
      : resolvedMedia?.posterSrc ?? liveLoopPosterSrc;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-card md:px-8">
        <Pill className="bg-gold-500/20 text-gold-400">LiveLoop</Pill>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Channel guide for StorySphere, News, Radio, and LiveStreams
            </h1>
            <p className="max-w-2xl text-slate-700">
              A Roku style guide that blends StorySphere, LiveLoop, News Radio, and LiveStreams into
              one view. Browse six hours at a time with 60 minute blocks.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#player"
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Watch live
              </Link>
              <Link
                href="#guide"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                View guide
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Current time: {currentTimeLabel}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Window: {windowLabel} {timeZoneLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Selected</span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold">
                  CH {activeChannel?.number ?? "--"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-slate-900">
                  {activeProgram?.title ?? "Select a program"}
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {activeChannel?.logoSrc ? (
                    <img src={activeChannel.logoSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-slate-500">
                      {activeChannel?.logoLabel ?? "ILL"}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-slate-600">
                {activeChannel?.name ?? selected?.channelName ?? "Channel"} - {selected?.timeLabel ?? "--:--"}
              </div>
              {activeProgram?.description && (
                <div className="mt-1 text-xs text-slate-500">{activeProgram.description}</div>
              )}
              <div className="mt-2 text-xs text-slate-500">
                Status: {selectedStatusLabel ?? "Upcoming"} - {activeKind === "audio" ? "Audio" : "Video"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Proof: <code>{activeProgram?.proof ?? "pending"}</code>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">LiveLoop</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {onAirItem?.title ?? "LiveLoop"}
              </div>
              <div className="text-sm text-slate-600">
                Up next: {nextItem?.title ?? "Queued"}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Proof: <code>{onAirItem?.sha ?? "pending"}</code>
              </div>
            </div>
          </div>
        </div>

        <div id="player" className="mt-6">
          <LiveLoopPlayer
            kind={activeKind}
            embedSrc={resolvedMedia?.embedSrc ?? null}
            streamSrc={resolvedMedia?.streamSrc ?? null}
            fallbackMp4={playerFallback}
            posterSrc={playerPoster ?? undefined}
            label={activeProgram?.title ?? activeChannel?.name}
            audioPlayToken={audioPlayToken}
          />
        </div>
      </section>

      <section
        id="guide"
        className="rounded-3xl border border-slate-900 bg-slate-950 p-6 text-white shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Channel guide</div>
            <h2 className="text-2xl font-semibold text-white">ILLUVRSE grid</h2>
            <p className="text-sm text-slate-400">
              Six hour window with 60 minute blocks. Use the arrows to shift the guide.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setWindowOffset((prev) => prev - 1)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Previous 6h
            </button>
            <button
              type="button"
              onClick={() => setWindowOffset(0)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setWindowOffset((prev) => prev + 1)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Next 6h
            </button>
            <div className="flex items-center gap-2 pl-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              <button
                type="button"
                onClick={() => setTimezone("local")}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  timezone === "local"
                    ? "border-teal-400/70 bg-teal-500/20 text-teal-100"
                    : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                }`}
              >
                Local
              </button>
              <button
                type="button"
                onClick={() => setTimezone("utc")}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  timezone === "utc"
                    ? "border-teal-400/70 bg-teal-500/20 text-teal-100"
                    : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                }`}
              >
                UTC
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[1120px] space-y-3">
            <div
              className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-400"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Ch</span>
                <span>Channel</span>
              </div>
              {timeSlots.map((slot) => (
                <div key={slot.label} className="flex items-center justify-between">
                  <span>{slot.label}</span>
                  {slot.status === "live" && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                      Live
                    </span>
                  )}
                </div>
              ))}
            </div>

            {channelRows.map((channel) => (
              <div
                key={channel.id}
                className="grid gap-3"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="flex h-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-200">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">CH</span>
                    <span>{channel.number}</span>
                  </div>
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    {channel.logoSrc ? (
                      <img src={channel.logoSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-slate-500">
                        {channel.logoLabel ?? "ILL"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-white">{channel.name}</div>
                      <div
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${channel.badgeClass}`}
                      >
                        {channel.group}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">{channel.description}</div>
                  </div>
                </div>
                {channel.slots.map((slot) => {
                  const isLive = slot.status === "live";
                  const isUpcoming = slot.status === "upcoming";
                  const isSelected =
                    selected?.channelId === channel.id && selected?.slotIndex === slot.slotIndex;
                  return (
                    <div
                      key={`${channel.id}-${slot.slotIndex}`}
                      ref={(el) => {
                        if (channel.id === channelRows[0]?.id && slot.slotIndex === 0) {
                          slotRefs.current[0] = el;
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSlotSelect(channel, slot)}
                        className={`h-full w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                          isSelected
                            ? "border-teal-400 bg-teal-500/20"
                            : isLive
                              ? "border-emerald-400 bg-emerald-500/15"
                              : isUpcoming
                                ? "border-slate-800 bg-slate-900"
                                : "border-slate-800 bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-white">{slot.program.title}</div>
                          {isLive && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                              Live
                            </span>
                          )}
                          {isUpcoming && !isLive && (
                            <span className="rounded-full bg-gold-500/20 px-2 py-1 text-[10px] font-semibold text-gold-400">
                              Next
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-300">{slot.program.description}</div>
                        <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          <span>{channel.kind === "audio" ? "Audio" : "Video"}</span>
                          <span>{slot.program.duration ?? "60m"}</span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card
            title="Guide actions"
            body={
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Select a block to see details above. Use Next 6h and Previous 6h to move through
                  the guide.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  Schedule data will expand beyond six hours as channels and playlists grow.
                </div>
              </div>
            }
            footer={
              <Link
                href="/storysphere"
                className="text-sm font-semibold text-teal-800 underline underline-offset-4 transition hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Explore StorySphere
              </Link>
            }
          />
          <Card
            title="Proofs and verification"
            body={
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Each channel block can carry a Kernel signature and SentinelNet verdict. Proofs
                  will surface in the schedule as channels go live.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  Proof data currently sourced from LiveLoop playlist items and live channel feeds.
                </div>
              </div>
            }
            footer={
              <Link
                href="/developers#verify"
                className="text-sm font-semibold text-teal-800 underline underline-offset-4 transition hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Verify a proof
              </Link>
            }
          />
        </div>
      </section>
    </div>
  );
}
