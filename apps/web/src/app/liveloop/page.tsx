"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, PageSection, Pill, StatBadge } from "@illuvrse/ui";

type SlotStatus = "live" | "upcoming";

type LiveLoopSlot = {
  window: string;
  title: string;
  focus: string;
  proof: string;
  status?: "on-air" | "next";
};

type GuideEvent = {
  id: string;
  time: string;
  title: string;
  description: string;
  status: SlotStatus;
};

type ChannelGuide = {
  id: string;
  name: string;
  description: string;
  schedule: GuideEvent[];
};

const liveLoopSchedule: { day: string; slots: LiveLoopSlot[] }[] = [
  {
    day: "Day 1 · Beverly Hills Marathon (UTC)",
    slots: [
      {
        window: "00:00–06:00",
        title: "Beverly Hillbillies S1 E01–E12",
        focus: "Nonstop, no commercials; captions + dub tracks.",
        proof: "bh:0001...bh12",
        status: "on-air"
      },
      {
        window: "06:00–12:00",
        title: "Beverly Hillbillies S1 E13–E24",
        focus: "No ads; GameGrid PIP enabled.",
        proof: "bh:0013...bh24",
        status: "next"
      },
      {
        window: "12:00–15:00",
        title: "Beverly Hillbillies S1 E25–E36",
        focus: "Midday run with inline proofs.",
        proof: "bh:0025...bh36"
      },
      {
        window: "15:00–18:00",
        title: "Beverly Hillbillies S1 E37–E48",
        focus: "Daytime wrap; zero commercials.",
        proof: "bh:0037...bh48"
      },
      {
        window: "18:00–20:00",
        title: "Movie: Gilda (1946)",
        focus: "Prime-time feature; signed manifest, captions, dub tracks.",
        proof: "mv:gilda...1946"
      },
      {
        window: "20:00–22:00",
        title: "Movie: Royal Wedding (1951)",
        focus: "Fred Astaire + Jane Powell — uninterrupted.",
        proof: "mv:royal...1951"
      },
      {
        window: "22:00–24:00",
        title: "Movie: Casablanca (Color)",
        focus: "Color transfer; Kernel + SentinelNet proofs.",
        proof: "mv:casa...color"
      }
    ]
  },
  {
    day: "Day 2 · Beverly Hills Marathon (UTC)",
    slots: [
      {
        window: "00:00–06:00",
        title: "Beverly Hillbillies S1 E49–E60",
        focus: "Overnight loop; no ads.",
        proof: "bh:0049...0060"
      },
      {
        window: "06:00–12:00",
        title: "Beverly Hillbillies S1 E61–E72",
        focus: "Morning run with PIP Arcade.",
        proof: "bh:0061...0072"
      },
      {
        window: "12:00–15:00",
        title: "Beverly Hillbillies S1 E73–E84",
        focus: "Midday reruns; proofs inline.",
        proof: "bh:0073...0084"
      },
      {
        window: "15:00–18:00",
        title: "Beverly Hillbillies S1 E85–E96",
        focus: "Daytime wrap, zero commercials.",
        proof: "bh:0085...0096"
      },
      {
        window: "18:00–20:00",
        title: "Movie: Gilda (encore)",
        focus: "Signed encore for new viewers.",
        proof: "mv:gilda...encore"
      },
      {
        window: "20:00–22:00",
        title: "Movie: Royal Wedding (encore)",
        focus: "Second showing; captioned + dubbed.",
        proof: "mv:royal...encore"
      },
      {
        window: "22:00–24:00",
        title: "Movie: Casablanca (Color) encore",
        focus: "Final feature before next 48h refresh.",
        proof: "mv:casa...encore"
      }
    ]
  }
];

const onAirSlot = liveLoopSchedule.flatMap((day) => day.slots).find((slot) => slot.status === "on-air");
const nextSlot = liveLoopSchedule.flatMap((day) => day.slots).find((slot) => slot.status === "next");

const notifyHref = "/contact?topic=notify-liveloop";

export default function LiveLoopPage() {
  const [viewMode, setViewMode] = useState<"schedule" | "timeline">("schedule");
  const [selectedChannelId, setSelectedChannelId] = useState("liveloop");
  const [search, setSearch] = useState("");

  const liveLoopEvents: GuideEvent[] = useMemo(() => mapLiveLoopEvents(liveLoopSchedule), []);

  const channels: ChannelGuide[] = useMemo(
    () => [
      {
        id: "liveloop",
        name: "LiveLoop",
        description: "24/7 playlist stream with proofs and GameGrid PIP.",
        schedule: liveLoopEvents
      },
      {
        id: "arcade",
        name: "GameGrid Arcade",
        description: "Play while you watch; latency probes and overlays.",
        schedule: [
          {
            id: "arcade-1",
            time: "Daily · 18:00 UTC",
            title: "Neon Runner Championship",
            description: "Live bracket with PIP caster desk and live leaderboard.",
            status: "upcoming"
          },
          {
            id: "arcade-2",
            time: "Daily · 20:30 UTC",
            title: "Grid Kart Drift Trials",
            description: "Arcade finals with signed inputs and latency stats.",
            status: "upcoming"
          },
          {
            id: "arcade-3",
            time: "24/7 filler",
            title: "Arcade Mix",
            description: "B-roll gameplay loops when the main bracket is offline.",
            status: "upcoming"
          }
        ]
      },
      {
        id: "premieres",
        name: "StorySphere Premieres",
        description: "New MP4 drops from creators and partners.",
        schedule: [
          {
            id: "prem-1",
            time: "Tue · 19:00 UTC",
            title: "Nebula Harbor · Episode 07",
            description: "Premiere with captions and dub tracks; signed manifest.",
            status: "live"
          },
          {
            id: "prem-2",
            time: "Wed · 21:00 UTC",
            title: "ACE Activation: ORACLE",
            description: "Agent debut with voice pack and Kernel + SentinelNet proofs.",
            status: "upcoming"
          },
          {
            id: "prem-3",
            time: "Thu · 17:30 UTC",
            title: "Creator Spotlight",
            description: "Live Q&A overlay while the new reel airs.",
            status: "upcoming"
          }
        ]
      },
      {
        id: "ops",
        name: "Ops & Policy",
        description: "Control-Panel briefings and ledger walkthroughs.",
        schedule: [
          {
            id: "ops-1",
            time: "Daily · 12:00 UTC",
            title: "Kernel + SentinelNet Signing Hour",
            description: "On-air manifest verifications and proof badge explainer.",
            status: "upcoming"
          },
          {
            id: "ops-2",
            time: "Fri · 16:00 UTC",
            title: "Audit & Rollback Review",
            description: "Operators explain verdicts with deterministic traces.",
            status: "upcoming"
          }
        ]
      }
    ],
    [liveLoopEvents]
  );

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? channels[0];

  const filteredSchedule = selectedChannel.schedule.filter((event) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      event.title.toLowerCase().includes(q) ||
      event.description.toLowerCase().includes(q) ||
      event.time.toLowerCase().includes(q)
    );
  });

  const viewerCount = useMemo(() => 1840 + Math.floor(Math.random() * 140), []);
  // Use StorySphere-hosted MP4 by default; override with HLS/MP4 via env.
  const streamSrc = process.env.NEXT_PUBLIC_LIVELOOP_SRC || "/royal_wedding.mp4";
  const embedSrc = process.env.NEXT_PUBLIC_LIVELOOP_EMBED;
  const fallbackMp4 =
    process.env.NEXT_PUBLIC_LIVELOOP_FALLBACK_MP4 ||
    "/Gilda 1946.mp4";

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800/60 px-8 py-10 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <Pill className="bg-teal-600/25 text-teal-100">LiveLoop</Pill>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              48-hour Beverly Hillbillies + triple-feature — no commercials
            </h1>
            <p className="text-lg text-slate-200/90">
              Nonstop Beverly Hillbillies episodes with nightly Gilda, Royal Wedding, and Casablanca. Live
              player up top; searchable guide in the middle; product intros + notify buttons at the bottom.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/player"
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
              >
                Watch Live
              </Link>
              <Link
                href="/developers#liveloop"
                className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
              >
                Publish API
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatBadge label="Live" value={onAirSlot ? onAirSlot.title : "LiveLoop"} variant="success" />
            <StatBadge label="Next" value={nextSlot ? nextSlot.title : "Locked"} variant="warning" />
            <StatBadge label="Window" value="48h schedule sealed" />
            <StatBadge label="Viewers" value={`${viewerCount.toLocaleString()} watching`} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 px-6 py-6 shadow-card md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">On-air player</div>
            <div className="text-2xl font-semibold text-cream">LiveLoop stream</div>
            <p className="text-sm text-slate-200/80">
              Uses <code>NEXT_PUBLIC_LIVELOOP_SRC</code>; falls back to the embed URL if provided. Native HLS where
              supported; otherwise use an MP4 feed or the embed fallback.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Pill className="bg-teal-600/30 text-teal-100">LIVE</Pill>
            <Pill className="bg-slate-700 text-slate-200">HLS/MP4</Pill>
          </div>
        </div>
        <LivePlayer streamSrc={streamSrc} embedSrc={embedSrc} fallbackMp4={fallbackMp4} />
      </section>

      <PageSection
        eyebrow="Guide"
        title="Channel guide + schedule"
        cta={
          <Pill className="bg-slate-700 text-teal-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Search, filter, and scroll
          </Pill>
        }
      >
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-200/80">
            Browse the 48-hour LiveLoop lineup plus Arcade, Premieres, and Ops channels. Type to filter titles
            or descriptions.
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Pill className="bg-teal-600/30 text-teal-100">Live</Pill>
            <Pill className="bg-gold-500/25 text-gold-100">Upcoming</Pill>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="md:w-64">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-300/80">Channels</div>
            <div className="flex w-full gap-2 overflow-x-auto md:flex-col md:overflow-visible">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  className={`min-w-[140px] rounded-xl border px-4 py-3 text-left transition ${
                    selectedChannelId === channel.id
                      ? "border-teal-500/70 bg-teal-900/20 text-cream"
                      : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  <div className="text-sm font-semibold">{channel.name}</div>
                  <div className="text-xs text-slate-300/80">{channel.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="search"
                placeholder="Search shows, times, descriptions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-cream shadow-inner focus:border-teal-500 focus:outline-none sm:max-w-md"
              />
              <div className="inline-flex rounded-full border border-slate-700 bg-slate-900 p-1 text-xs">
                <button
                  className={`rounded-full px-3 py-1 font-semibold transition ${viewMode === "schedule" ? "bg-teal-600/30 text-teal-100" : "text-slate-200"}`}
                  onClick={() => setViewMode("schedule")}
                >
                  List
                </button>
                <button
                  className={`rounded-full px-3 py-1 font-semibold transition ${viewMode === "timeline" ? "bg-teal-600/30 text-teal-100" : "text-slate-200"}`}
                  onClick={() => setViewMode("timeline")}
                >
                  Timeline
                </button>
              </div>
            </div>

            {viewMode === "schedule" ? (
              <div className="space-y-3">
                {filteredSchedule.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 shadow-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-cream">{event.time}</div>
                      <Pill
                        className={
                          event.status === "live"
                            ? "bg-teal-600/30 text-teal-100"
                            : "bg-gold-500/25 text-gold-100"
                        }
                      >
                        {event.status === "live" ? "Live" : "Upcoming"}
                      </Pill>
                    </div>
                    <div className="mt-1 text-base font-semibold text-cream">{event.title}</div>
                    <div className="text-sm text-slate-200/80">{event.description}</div>
                  </div>
                ))}
                {!filteredSchedule.length && (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200/80">
                    No results. Try a different term or channel.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="mb-3 text-xs text-slate-200/80">
                  Horizontal timeline — scroll to see the next 48 hours.
                </div>
                <div className="flex min-w-[720px] gap-3 overflow-x-auto">
                  {filteredSchedule.map((event, idx) => (
                    <div
                      key={event.id}
                      className={`min-w-[240px] flex-1 rounded-xl border p-3 shadow-card ${
                        event.status === "live"
                          ? "border-teal-500/70 bg-teal-900/15"
                          : "border-slate-700 bg-slate-900/60"
                      }`}
                      style={{ marginLeft: idx === 0 ? 0 : idx * 4 }}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold uppercase tracking-[0.15em] text-slate-200/80">
                          {event.status === "live" ? "Live" : "Upcoming"}
                        </span>
                        <span className="text-slate-300/80">{event.time}</span>
                      </div>
                      <div className="mt-2 text-base font-semibold text-cream">{event.title}</div>
                      <div className="text-sm text-slate-200/80">{event.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PageSection>

      <PageSection eyebrow="Coming soon" title="ILLUVRSE surfaces">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {comingSoonCards.map((card) => (
            <Card
              key={card.title}
              title={
                <div className="flex items-center justify-between gap-2">
                  <span>{card.title}</span>
                  <Pill className="bg-slate-700 text-slate-200">Coming Soon</Pill>
                </div>
              }
              body={<p className="text-sm text-slate-200/80">{card.body}</p>}
              footer={
                <Link
                  href={notifyHref}
                  className="inline-flex w-full items-center justify-center rounded-full border border-teal-500/60 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-300 hover:text-cream"
                >
                  Notify me
                </Link>
              }
            />
          ))}
        </div>
      </PageSection>
    </div>
  );
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
  const [nativeHls, setNativeHls] = useState(false);
  const [unsupportedHls, setUnsupportedHls] = useState(false);
  const [usingHlsHelper, setUsingHlsHelper] = useState(false);
  const [usingFallbackMp4, setUsingFallbackMp4] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || (!streamSrc && !fallbackMp4) || embedSrc) return;
    const isHls = Boolean(streamSrc?.includes(".m3u8"));
    const supportsHls = streamSrc ? video.canPlayType("application/vnd.apple.mpegurl") !== "" : false;
    let cleanup: (() => void) | undefined;

    const attachNative = () => {
      if (streamSrc) {
        setNativeHls(supportsHls);
        video.src = streamSrc;
      } else if (fallbackMp4) {
        video.src = fallbackMp4;
        setUsingFallbackMp4(true);
      }
    };

    if (isHls && streamSrc && !supportsHls) {
      loadHlsFromCdn()
        .then((Hls) => {
          if (Hls?.isSupported?.()) {
            const hls = new Hls();
            hls.loadSource(streamSrc);
            hls.attachMedia(video);
            setUsingHlsHelper(true);
            cleanup = () => hls.destroy();
          } else {
            if (fallbackMp4) {
              setUsingFallbackMp4(true);
              video.src = fallbackMp4;
            } else {
              setUnsupportedHls(true);
            }
          }
        })
        .catch(() => {
          if (fallbackMp4) {
            setUsingFallbackMp4(true);
            video.src = fallbackMp4;
          } else {
            setUnsupportedHls(true);
          }
        });

      return () => {
        if (cleanup) cleanup();
      };
    }

    attachNative();

    return () => {
      if (cleanup) cleanup();
    };
  }, [streamSrc, embedSrc]);

  if (embedSrc) {
    return (
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950">
        <iframe
          src={embedSrc}
          className="aspect-video w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="LiveLoop stream"
        />
        <LivePlayerOverlay nativeHls={false} />
      </div>
    );
  }

  if (unsupportedHls) {
    return (
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950 p-6 text-center text-sm text-slate-100">
        HLS isn&apos;t supported in this browser. Provide an MP4 feed via <code>NEXT_PUBLIC_LIVELOOP_SRC</code> or
        set <code>NEXT_PUBLIC_LIVELOOP_EMBED</code> to an iframe-friendly player. If you keep HLS, add
        <code>hls.js</code> as a dependency so the helper can run on browsers without native support.
      </div>
    );
  }

  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950">
      <video
        ref={videoRef}
        className="h-full w-full max-h-[520px] bg-slate-950 object-cover"
        controls
        playsInline
        preload="auto"
        autoPlay
        muted
      />
      <LivePlayerOverlay nativeHls={nativeHls} usingHlsHelper={usingHlsHelper} usingFallbackMp4={usingFallbackMp4} />
    </div>
  );
}

function LivePlayerOverlay({
  nativeHls,
  usingHlsHelper,
  usingFallbackMp4
}: {
  nativeHls: boolean;
  usingHlsHelper: boolean;
  usingFallbackMp4: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-3 text-[11px]">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-red-500 px-3 py-1 font-semibold uppercase tracking-[0.15em] text-cream">
          LIVE
        </span>
        <span className="rounded-full bg-slate-900/80 px-2 py-1 text-slate-100">
          {nativeHls ? "Native HLS" : usingHlsHelper ? "HLS helper" : usingFallbackMp4 ? "Fallback MP4" : "MP4/iframe fallback"}
        </span>
      </div>
      <span className="rounded-full bg-slate-900/80 px-3 py-1 text-slate-100">Fullscreen available</span>
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

function mapLiveLoopEvents(schedule: { day: string; slots: LiveLoopSlot[] }[]): GuideEvent[] {
  return schedule.flatMap((day) =>
    day.slots.map((slot, idx) => ({
      id: `liveloop-${day.day}-${idx}`,
      time: `${day.day} · ${slot.window}`,
      title: slot.title,
      description: slot.focus,
      status: slot.status === "on-air" ? "live" : "upcoming"
    }))
  );
}

const comingSoonCards = [
  {
    title: "ILLUVRSE",
    body: "Governed platform for signed artifacts, live media, and Marketplace delivery."
  },
  {
    title: "ACE — Agent Creation Experience",
    body: "Five-stage builder for identity, appearance, personality, attributes, and activation."
  },
  {
    title: "StorySphere",
    body: "Prompt → preview → MP4 → LiveLoop with proofs, captions, and dub tracks."
  },
  {
    title: "LiveLoop",
    body: "24/7 playlist stream with Player embeds, GameGrid PIP, and verifiable manifests."
  }
];
