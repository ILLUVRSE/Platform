'use client';

import { useEffect, useMemo, useRef, useState } from "react";

type CaptionTrack = {
  label: string;
  src: string;
  lang?: string;
  default?: boolean;
};

type PlayerSource = {
  hlsUrl?: string;
  mp4Url?: string;
  poster?: string;
  startPosition?: number;
};

type PlayerProps = {
  title?: string;
  source: PlayerSource;
  captions?: CaptionTrack[];
  facts?: string[];
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  autoPlay?: boolean;
  muted?: boolean;
};

type AudioTrackOption = {
  id: string;
  label: string;
  index: number;
};

const CAPTION_SIZES = ["sm", "md", "lg"] as const;
const CAPTION_THEMES = ["light", "high"] as const;

export default function Player({
  title,
  source,
  captions = [],
  facts = [],
  onEnded,
  onPlay,
  onPause,
  autoPlay = true,
  muted = true,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [captionSize, setCaptionSize] = useState<(typeof CAPTION_SIZES)[number]>("md");
  const [captionTheme, setCaptionTheme] = useState<(typeof CAPTION_THEMES)[number]>("light");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);
  const [speed, setSpeed] = useState(1);
  const [factsOpen, setFactsOpen] = useState(false);
  const [watchStatus, setWatchStatus] = useState<"idle" | "hosting" | "joined">("idle");

  const canUseHls = typeof window !== "undefined";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const src = source.hlsUrl || source.mp4Url;
    if (!src) return;

    // Native HLS support (Safari)
    if (source.hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.hlsUrl;
      return;
    }

    async function setupHls() {
      if (!video) return;
      if (!source.hlsUrl) {
        if (src) video.src = src;
        return;
      }

      try {
        // @ts-ignore
        const mod = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js");
        const Hls = (mod as any).default || (mod as any);
        if (Hls?.isSupported?.()) {
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(source.hlsUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const tracks: AudioTrackOption[] = (hls.audioTracks || []).map(
              (t: any, idx: number) => ({
                id: `hls-${idx}`,
                label: t.name || t.lang || `Track ${idx + 1}`,
                index: idx,
              }),
            );
            setAudioTracks(tracks);
            if (tracks.length > 0 && selectedTrackId === null) {
              setSelectedTrackId(tracks[0].id);
              hls.audioTrack = 0;
            }
          });
        } else {
          if (src) video.src = src;
        }
      } catch (err) {
        // If remote import fails, fall back to mp4 or native HLS
        if (src) video.src = src;
      }
    }

    setupHls();

    return () => {
      hlsRef.current?.destroy?.();
      hlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.hlsUrl, source.mp4Url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      if (source.startPosition && source.startPosition > 0) {
        try {
          video.currentTime = source.startPosition;
        } catch {
          // ignore seek errors
        }
      }
    };
    video.addEventListener("loadedmetadata", handleLoaded);
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, [source.startPosition, source.hlsUrl, source.mp4Url]);

  useEffect(() => {
    const video = videoRef.current as any;
    if (!video?.audioTracks || audioTracks.length > 0) return;
    const tracks: AudioTrackOption[] = [];
    for (let i = 0; i < video.audioTracks.length; i++) {
      const track = video.audioTracks[i];
      tracks.push({
        id: `native-${i}`,
        label: track.label || track.language || `Track ${i + 1}`,
        index: i,
      });
    }
    if (tracks.length) {
      setAudioTracks(tracks);
      setSelectedTrackId(tracks[0].id);
      video.audioTracks[0].enabled = true;
    }
  }, [canUseHls, audioTracks.length]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      // @ts-ignore
      if (document.pictureInPictureElement) {
        // @ts-ignore
        await document.exitPictureInPicture();
        setPipActive(false);
      } else if (video.requestPictureInPicture) {
        // @ts-ignore
        await video.requestPictureInPicture();
        setPipActive(true);
      }
    } catch {
      // ignore
    }
  };

  const handleAudioChange = (trackId: string) => {
    setSelectedTrackId(trackId);
    const hls = hlsRef.current;
    if (hls?.audioTracks) {
      const idx = audioTracks.find((t) => t.id === trackId)?.index ?? 0;
      hls.audioTrack = idx;
      return;
    }
    const video = videoRef.current as any;
    if (video?.audioTracks) {
      for (let i = 0; i < video.audioTracks.length; i++) {
        video.audioTracks[i].enabled = i === audioTracks.find((t) => t.id === trackId)?.index;
      }
    }
  };

  const handleCaptionToggle = (lang?: string) => {
    const video = videoRef.current;
    if (!video) return;
    Array.from(video.textTracks || []).forEach((track) => {
      track.mode = track.language === lang ? "showing" : "disabled";
    });
  };

  const handleSpeedChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setSpeed(rate);
  };

  const cueStyle = useMemo(
    () => `
      [data-caption-size="sm"] video::cue { font-size: 12px; }
      [data-caption-size="md"] video::cue { font-size: 14px; }
      [data-caption-size="lg"] video::cue { font-size: 18px; }
      [data-caption-theme="light"] video::cue { color: #fff; background: rgba(0,0,0,0.4); }
      [data-caption-theme="high"] video::cue { color: #111; background: rgba(255,255,255,0.8); }
    `,
    [],
  );

  return (
    <div
      className="space-y-3"
      data-caption-size={captionSize}
      data-caption-theme={captionTheme}
    >
      <style>{cueStyle}</style>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black"
          poster={source.poster}
          controls
          autoPlay={autoPlay}
          muted={muted}
          playsInline
          onEnded={onEnded}
          onPlay={() => {
            setIsPlaying(true);
            onPlay?.();
          }}
          onPause={() => {
            setIsPlaying(false);
            onPause?.();
          }}
        >
          {captions.map((track) => (
            <track
              key={track.src}
              label={track.label}
              kind="subtitles"
              srcLang={track.lang}
              src={track.src}
              default={track.default}
            />
          ))}
        </video>

        <div className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full bg-white/15 border border-white/20">
          {title || "Player"}
        </div>
        <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20">
          {isPlaying ? "Playing" : "Paused"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={togglePlay}
          className="px-3 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={togglePip}
          className="px-3 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10"
        >
          {pipActive ? "Exit PIP" : "PIP"}
        </button>
        <div className="flex items-center gap-1 px-3 py-2 rounded-full border border-white/20 bg-white/5">
          <span className="text-white/60">Speed</span>
          {[0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => handleSpeedChange(rate)}
              className={`px-2 py-1 rounded ${
                speed === rate ? "bg-white/20 text-white" : "text-white/70"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
        {audioTracks.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/20 bg-white/5">
            <span className="text-white/60">Audio</span>
            <select
              className="bg-black/60 border border-white/20 rounded px-2 py-1 text-white text-xs"
              value={selectedTrackId ?? undefined}
              onChange={(e) => handleAudioChange(e.target.value)}
            >
              {audioTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {captions.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/20 bg-white/5">
            <span className="text-white/60">Captions</span>
            <select
              className="bg-black/60 border border-white/20 rounded px-2 py-1 text-white text-xs"
              onChange={(e) => handleCaptionToggle(e.target.value || undefined)}
              defaultValue=""
            >
              <option value="">Off</option>
              {captions.map((c) => (
                <option key={c.src} value={c.lang || c.label}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              {CAPTION_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setCaptionSize(size)}
                  className={`px-2 py-1 rounded ${
                    captionSize === size ? "bg-white/20 text-white" : "text-white/70"
                  }`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {CAPTION_THEMES.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setCaptionTheme(theme)}
                  className={`px-2 py-1 rounded ${
                    captionTheme === theme ? "bg-white/20 text-white" : "text-white/70"
                  }`}
                >
                  {theme === "high" ? "High Contrast" : "Light"}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/20 bg-white/5">
          <span className="text-white/60">Watch Party</span>
          <button
            onClick={() => setWatchStatus((s) => (s === "hosting" ? "idle" : "hosting"))}
            className={`px-2 py-1 rounded ${
              watchStatus === "hosting" ? "bg-white/20 text-white" : "text-white/70"
            }`}
          >
            Host
          </button>
          <button
            onClick={() => setWatchStatus((s) => (s === "joined" ? "idle" : "joined"))}
            className={`px-2 py-1 rounded ${
              watchStatus === "joined" ? "bg-white/20 text-white" : "text-white/70"
            }`}
          >
            Join
          </button>
        </div>
        <button
          onClick={() => setFactsOpen((v) => !v)}
          className="px-3 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10"
        >
          ILLUFacts
        </button>
      </div>

      {factsOpen && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-white">ILLUFacts</div>
            <button
              onClick={() => setFactsOpen(false)}
              className="text-xs px-2 py-1 rounded border border-white/20"
            >
              Close
            </button>
          </div>
          {facts.length === 0 && <div className="text-white/60">No facts available.</div>}
          {facts.map((fact, idx) => (
            <div key={idx} className="rounded-lg border border-white/10 bg-black/30 p-2">
              {fact}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
