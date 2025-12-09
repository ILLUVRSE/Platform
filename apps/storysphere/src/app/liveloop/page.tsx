"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Slot = {
  id: string;
  window: string;
  title: string;
  focus: string;
  proof: string;
  asset: string;
  thumbnail?: string;
  status?: "on-air" | "next";
  startMinutes: number;
  endMinutes: number;
};

const BEVERLY_ASSETS = [
  "/00efdd5717132ce3a95944dd2f83dba6-360p.mp4",
  "/0570d5a39fca358ee78cd3a7e3b1b30e-360p.mp4",
  "/10ad753894979bff8863a9b94d63b770-360p.mp4",
  "/24e066e09cdc6be412932c8d4931be82-360p.mp4",
  "/2fcaae33bcc4b2493c90edf2d409888a-360p.mp4",
  "/3073e2bea35d23e0a2c9f271223a7dcb-360p.mp4"
];

const MOVIE_ASSETS = {
  gilda: encodeURI("/Gilda 1946.mp4"),
  royalWedding: "/royal_wedding.mp4",
  casablanca: encodeURI(
    "/Casablanca 1942, in color, Humphrey Bogart, Ingrid Bergman, Paul Henreid, Claude Rains, Sydney Greenstreet, Peter Lorre, Dooley Wilson,.mp4"
  )
};

const COMING_SOON = [
  {
    title: "LiveLoop 4K",
    body: "Upgrade the channel to 4K + HDR with per-slot stream variants.",
    eta: "Q3"
  },
  {
    title: "Alt audio & captions",
    body: "Multiple language tracks, descriptive audio, and burnt-in proof badges.",
    eta: "Q3"
  },
  {
    title: "Companion chat",
    body: "Optional sidecar chat overlay with operator-level safety controls.",
    eta: "Q4"
  }
];

const minutesToLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

function makeSlot(startMinutes: number, endMinutes: number, overrides: Partial<Slot> = {}): Slot {
  return {
    id: `slot-${startMinutes}`,
    startMinutes,
    endMinutes,
    window: `${minutesToLabel(startMinutes)}–${minutesToLabel(endMinutes % (24 * 60))}`,
    title: "LiveLoop Block",
    focus: "Featured content",
    proof: `lv:${startMinutes}`,
    asset: "",
    ...overrides
  };
}

function generateLiveLoopSchedule(): Slot[] {
  const GILDA_DURATION_MIN = 110;
  const ROYAL_DURATION_MIN = 93;
  const CASABLANCA_DURATION_MIN = 102;

  const gildaStart = 18 * 60; // local 18:00
  const gildaEnd = gildaStart + GILDA_DURATION_MIN; // 19:50
  const royalStart = gildaEnd; // immediately after Gilda
  const royalEnd = royalStart + ROYAL_DURATION_MIN; // 21:23
  const casaStart = royalEnd; // immediately after Royal Wedding
  const casaEnd = casaStart + CASABLANCA_DURATION_MIN; // 23:05

  const slots: Slot[] = [
    makeSlot(0, gildaStart, {
      title: "The Beverly Hillbillies — Marathon",
      focus: "Nonstop episodes — no commercials",
      proof: "bh:day",
      asset: BEVERLY_ASSETS[0]
    }),
    makeSlot(gildaStart, gildaEnd, {
      title: "Gilda (1946)",
      focus: "Prime-time feature — uninterrupted",
      proof: "mv:gilda",
      asset: MOVIE_ASSETS.gilda,
      thumbnail: "/Gilda_itemimage.jpg"
    }),
    makeSlot(royalStart, royalEnd, {
      title: "The Royal Wedding (1951)",
      focus: "Prime-time feature — uninterrupted",
      proof: "mv:royal-wedding",
      asset: MOVIE_ASSETS.royalWedding
    }),
    makeSlot(casaStart, casaEnd, {
      title: "Casablanca (Color Edition)",
      focus: "Prime-time feature — uninterrupted",
      proof: "mv:casablanca",
      asset: MOVIE_ASSETS.casablanca,
      thumbnail: encodeURI("/__ia_thumb.jpg")
    }),
    makeSlot(casaEnd, 24 * 60, {
      title: "The Beverly Hillbillies — Overnight",
      focus: "Wind down with the Clampetts",
      proof: "bh:overnight",
      asset: BEVERLY_ASSETS[1 % BEVERLY_ASSETS.length]
    })
  ];

  return slots;
}

function LivePlayer({
  streamSrc,
  embedSrc,
  fallbackMp4
}: {
  streamSrc?: string | null;
  embedSrc?: string | null;
  fallbackMp4?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (embedSrc) return;

    const isHls = Boolean(streamSrc?.includes(".m3u8"));
    const supportsHls = streamSrc ? video.canPlayType("application/vnd.apple.mpegurl") !== "" : false;

    if (isHls && streamSrc && !supportsHls) {
      loadHlsFromCdn()
        .then((Hls) => {
          if (Hls?.isSupported?.()) {
            const hls = new Hls();
            hls.loadSource(streamSrc);
            hls.attachMedia(video);
            return;
          }
          if (fallbackMp4) {
            video.src = fallbackMp4;
          } else {
            setUnsupported(true);
          }
        })
        .catch(() => {
          if (fallbackMp4) video.src = fallbackMp4;
          else setUnsupported(true);
        });
      return;
    }

    if (streamSrc) {
      video.src = streamSrc;
    } else if (fallbackMp4) {
      video.src = fallbackMp4;
    }
  }, [streamSrc, embedSrc, fallbackMp4]);

  if (embedSrc) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={embedSrc}
          title="LiveLoop embed player"
          className="block aspect-video w-full"
          allow="autoplay; fullscreen; picture-in-picture"
        />
        <div className="absolute left-3 top-3 rounded px-2 py-1 text-xs font-semibold text-white bg-emerald-600/80">
          LIVE
        </div>
      </div>
    );
  }

  if (unsupported) {
    return (
      <div className="rounded-lg bg-black p-6 text-center text-white">
        HLS not supported. Provide an MP4 fallback or include hls.js in production.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} className="aspect-video w-full object-cover" controls playsInline autoPlay muted />
      <div className="absolute left-3 top-3 rounded px-2 py-1 text-xs font-semibold text-white bg-rose-600/80">
        LIVE
      </div>
    </div>
  );
}

function loadHlsFromCdn(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if ((window as any).Hls) return Promise.resolve((window as any).Hls);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
    script.async = true;
    script.onload = () => resolve((window as any).Hls);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function LiveLoopRokuPage() {
  const slots = useMemo(() => generateLiveLoopSchedule(), []);

  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const inkedSlots = useMemo(
    () =>
      slots.map((s, idx) => {
        const isOnAir = nowMinutes >= s.startMinutes && nowMinutes < s.endMinutes;
        const prevEnd = slots[idx === 0 ? slots.length - 1 : idx - 1].endMinutes;
        const isNext = !isOnAir && nowMinutes >= prevEnd && nowMinutes < s.startMinutes;
        return { ...s, status: isOnAir ? "on-air" : isNext ? "next" : undefined };
      }),
    [slots, nowMinutes]
  );

  const [cols, setCols] = useState(6);
  useEffect(() => {
    const setForWidth = () => {
      const width = window.innerWidth;
      if (width < 640) setCols(2);
      else if (width < 1024) setCols(3);
      else setCols(6);
    };
    setForWidth();
    window.addEventListener("resize", setForWidth);
    return () => window.removeEventListener("resize", setForWidth);
  }, []);

  const [focused, setFocused] = useState(0);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => {
    const el = tileRefs.current[focused];
    if (el) el.focus();
  }, [focused]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"].includes(e.key)) return;
      e.preventDefault();
      if (e.key === "ArrowRight") {
        setFocused((f) => Math.min(f + 1, inkedSlots.length - 1));
      } else if (e.key === "ArrowLeft") {
        setFocused((f) => Math.max(f - 1, 0));
      } else if (e.key === "ArrowDown") {
        setFocused((f) => Math.min(f + cols, inkedSlots.length - 1));
      } else if (e.key === "ArrowUp") {
        setFocused((f) => Math.max(f - cols, 0));
      } else if (e.key === "Enter") {
        const target = document.getElementById("livePlayer");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inkedSlots.length, cols, focused]);

  tileRefs.current = Array(inkedSlots.length)
    .fill(null)
    .map((_, i) => tileRefs.current[i] || null);

  const liveFeedSrc = process.env.NEXT_PUBLIC_LIVELOOP_SRC || null;
  const embedSrc = process.env.NEXT_PUBLIC_LIVELOOP_EMBED || null;
  const fallbackMp4 = process.env.NEXT_PUBLIC_LIVELOOP_FALLBACK_MP4 || null;
  const [playerSrc, setPlayerSrc] = useState<string | null>(liveFeedSrc);
  const playerSrcRef = useRef<string | null>(null);

  useEffect(() => {
    if (liveFeedSrc) {
      // In live-feed mode, stay on the single HLS/DASH URL and skip local asset switching
      playerSrcRef.current = liveFeedSrc;
      setPlayerSrc(liveFeedSrc);
      return;
    }

    function syncPlayerToSlot() {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const currentSlot = slots.find((s) => minutes >= s.startMinutes && minutes < s.endMinutes) ?? slots[0];
      if (!currentSlot?.asset) return;
      if (currentSlot.asset !== playerSrcRef.current) {
        playerSrcRef.current = currentSlot.asset;
        setPlayerSrc(currentSlot.asset);
      }
    }

    syncPlayerToSlot();
    const timer = setInterval(syncPlayerToSlot, 15000);
    return () => clearInterval(timer);
  }, [slots, liveFeedSrc]);

  const streamSrc = playerSrc;

  const onAirSlot = inkedSlots.find((s) => s.status === "on-air") ?? inkedSlots[0];
  const nextSlot = inkedSlots.find((s) => s.status === "next");
  const onAirTitle = onAirSlot?.title ?? "Live";
  const nextTitle = nextSlot ? `${nextSlot.title} · ${nextSlot.window.split("–")[0]}` : "Next";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-200/80">ILLUVRSE LiveLoop</p>
            <h1 className="text-4xl font-extrabold tracking-tight">All-day stream, prime-time classics</h1>
            <p className="max-w-3xl text-slate-200/90">
              Beverly Hillbillies all day. At 6 PM local: Gilda → The Royal Wedding → Casablanca, each rolling immediately after the last frame. Clean, verified playback with channel proofs.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#livePlayer"
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
              >
                Watch live
              </a>
              <a
                href="#schedule"
                className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
              >
                View schedule
              </a>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Now playing</div>
            <div className="text-lg font-bold">{onAirTitle}</div>
            <div className="text-xs text-slate-400">Next: {nextTitle}</div>
          </div>
        </header>

        <div id="livePlayer" className="overflow-hidden rounded-xl">
          <LivePlayer streamSrc={streamSrc} embedSrc={embedSrc} fallbackMp4={fallbackMp4} />
        </div>

        <section id="schedule" aria-label="LiveLoop Grid" className="rounded-lg bg-slate-900/60 p-4">
          <div className="mb-3 text-sm text-slate-300">Keyboard/remote arrows supported. Enter recenters the player.</div>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
          >
            {inkedSlots.map((slot, i) => {
              const isFocused = i === focused;
              return (
                <button
                  key={slot.id}
                  ref={(r) => {
                    tileRefs.current[i] = r;
                  }}
                  tabIndex={isFocused ? 0 : -1}
                  className={`relative overflow-hidden transform rounded-lg p-5 text-left transition-all duration-150 focus:outline-none ${
                    isFocused
                      ? "scale-105 bg-teal-900/40 ring-4 ring-teal-400 ring-offset-2"
                      : "bg-slate-800/60 hover:bg-slate-800/40"
                  }`}
                  onClick={() => setFocused(i)}
                  aria-current={slot.status === "on-air" ? "true" : undefined}
                  style={
                    slot.thumbnail
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.9) 40%, rgba(15,23,42,0.95) 100%), url(${slot.thumbnail})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center"
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">{slot.title}</div>
                      <div className="text-sm text-slate-300">{slot.focus}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{slot.window}</div>
                      {slot.status === "on-air" && <div className="mt-2 text-sm font-bold text-emerald-300">ON AIR</div>}
                      {slot.status === "next" && <div className="mt-2 text-sm font-semibold text-amber-300">NEXT</div>}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-400">proof: {slot.proof}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Future line-up</div>
              <h2 className="text-2xl font-semibold text-cream">Coming soon to LiveLoop</h2>
              <p className="text-sm text-slate-300">Roadmap items ready for the next deploys.</p>
            </div>
            <span className="rounded-full bg-teal-600/20 px-3 py-1 text-xs font-semibold text-teal-200">Channel roadmap</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {COMING_SOON.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-800/60 p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-cream">{item.title}</h3>
                  <span className="text-xs text-teal-200">ETA {item.eta}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-sm text-slate-400">
          Built for big screens — keyboard and remote friendly. Extend slot objects with manifests or proofs as needed.
        </footer>
      </div>
    </div>
  );
}
