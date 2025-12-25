"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

type LiveCamPlayerProps = {
  src: string;
  poster?: string;
  title: string;
  location?: string;
  timeLabel?: string;
  temperature?: string;
  watermark?: string;
  badgeLabel?: string;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  className?: string;
};

/**
 * Full-bleed live cam player with metadata overlays and HLS support.
 */
export function LiveCamPlayer({
  src,
  poster,
  title,
  location,
  timeLabel,
  temperature,
  watermark,
  badgeLabel = "Live Cam",
  loop = true,
  muted = true,
  showControls = true,
  className,
}: LiveCamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cleanup: (() => void) | undefined;
    setReady(false);
    setError(null);

    if (src.endsWith(".m3u8")) {
      const maybeSupportsNative = video.canPlayType("application/vnd.apple.mpegurl");
      if (maybeSupportsNative) {
        video.src = src;
        video.addEventListener("loadedmetadata", () => setReady(true), { once: true });
      } else {
        // Lazy-load hls.js so we don't bundle it for pages that don't need it.
        import("hls.js")
          .then(({ default: Hls }) => {
            if (!Hls.isSupported()) return;
            const hls = new Hls({ enableWorker: true });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => setReady(true));
            hls.on(Hls.Events.ERROR, () => setError("Stream error — retrying or try another feed."));
            cleanup = () => hls.destroy();
          })
          .catch(() => {
            // Fallback: let the browser try to handle the src directly.
            video.src = src;
          });
      }
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", () => setReady(true), { once: true });
    }

    return () => cleanup?.();
  }, [src, attempts]);

  const retry = () => {
    setAttempts((n) => n + 1);
  };

  return (
    <div className={clsx("relative overflow-hidden rounded-3xl border shadow-lg", className)} style={{ borderColor: "var(--border)", background: "var(--black, #0b0b0b)" }}>
      <video
        ref={videoRef}
        poster={poster}
        controls={showControls}
        loop={loop}
        muted={muted}
        playsInline
        autoPlay
        onError={() => setError("Connection failed. Click retry or switch feeds.")}
        className="h-full w-full bg-black object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.45)] via-transparent to-[rgba(0,0,0,0.25)]" />

      <div className="absolute left-4 bottom-4 z-10 flex flex-col gap-1 rounded-2xl px-4 py-3 shadow-lg" style={{ background: "rgba(10,10,10,0.55)", color: "#fff" }}>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(255,255,255,0.75)]">
          {badgeLabel}
        </p>
        <p className="text-xl font-bold leading-tight">{title}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[rgba(255,255,255,0.82)]">
          {location && <span>{location}</span>}
          {timeLabel && <span>• {timeLabel}</span>}
          {temperature && <span>• {temperature}</span>}
          {isReady ? <span className="text-[var(--sage,#5b8f7b)]">● Streaming</span> : <span className="text-yellow-200">… Connecting</span>}
        </div>
      </div>

      {watermark && (
        <div className="absolute bottom-4 right-4 z-10 rounded-lg bg-[rgba(0,0,0,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.65)]">
          {watermark}
        </div>
      )}

      {(error || !isReady) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[rgba(0,0,0,0.45)] px-4 text-center text-sm text-white">
          <p className="font-semibold">{error ?? "Connecting…"}</p>
          {error && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={retry}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-white/20"
              >
                Retry
              </button>
              <span className="text-xs text-white/70">or pick another feed below.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
