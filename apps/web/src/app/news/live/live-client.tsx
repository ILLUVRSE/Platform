/* eslint-disable jsx-a11y/media-has-caption */
"use client";

import { useMemo, useState } from "react";
import { AvailabilityStatus } from "@illuvrse/db";
import clsx from "clsx";
import { LiveCamPlayer, TagChip } from "@news/components/ui";

type StreamView = {
  id: string;
  name: string;
  slug: string;
  embedUrl: string;
  posterImage?: string | null;
  locationName?: string | null;
  countryCode?: string | null;
  attribution?: string | null;
  licenseNote?: string | null;
  status: AvailabilityStatus;
  kind: "stream" | "video";
};

function isVideoUrl(url: string) {
  return url.endsWith(".m3u8") || url.endsWith(".mp4");
}

function StreamPlayer({ stream }: { stream: StreamView }) {
  const badgeLabel = stream.kind === "video" ? "Live Stream" : "Live Cam";

  if (isVideoUrl(stream.embedUrl)) {
    return (
      <LiveCamPlayer
        src={stream.embedUrl}
        poster={stream.posterImage ?? undefined}
        title={stream.name}
        location={stream.locationName ?? stream.countryCode ?? undefined}
        timeLabel={stream.status === AvailabilityStatus.online ? "Live" : "Offline"}
        watermark={stream.attribution ?? undefined}
        badgeLabel={badgeLabel}
        muted
        showControls
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border shadow-lg" style={{ borderColor: "var(--border)", background: "var(--black, #0b0b0b)" }}>
      <div className="aspect-video w-full">
        <iframe
          src={stream.embedUrl}
          title={stream.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      <div className="absolute left-4 bottom-4 z-10 rounded-2xl bg-[rgba(0,0,0,0.55)] px-4 py-3 text-sm text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{badgeLabel}</p>
        <p className="text-lg font-bold leading-tight">{stream.name}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
          {stream.locationName && <span>{stream.locationName}</span>}
          {stream.countryCode && <span>• {stream.countryCode}</span>}
          <span className={clsx(stream.status === AvailabilityStatus.online ? "text-green-300" : "text-yellow-200")}>
            {stream.status === AvailabilityStatus.online ? "● Streaming" : "Checking status"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LiveClient({ streams }: { streams: StreamView[] }) {
  const sorted = useMemo(
    () =>
      [...streams].sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === AvailabilityStatus.online ? -1 : 1;
      }),
    [streams],
  );

  const onlineCount = sorted.filter((s) => s.status === AvailabilityStatus.online).length;
  const offlineCount = sorted.length - onlineCount;

  const [activeId, setActiveId] = useState(sorted[0]?.id);
  const active = sorted.find((s) => s.id === activeId) ?? sorted[0];
  const rest = sorted.filter((s) => s.id !== active?.id);
  const activeHasMeta = Boolean(active?.locationName || active?.countryCode || active?.attribution || active?.licenseNote);
  const activeFallback = active?.kind === "video" ? "ILLUVRSE live stream" : "Public access source";

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-cream)", color: "var(--text)" }}>
      <section className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-10 md:pt-14">
        <header className="relative overflow-hidden rounded-3xl border px-5 py-6 md:px-8" style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, #f7f3eb 0%, #e7efe9 45%, #d7eae2 100%)", boxShadow: "0 20px 48px -30px rgba(33,49,45,0.25)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-8 -top-10 h-32 w-32 rounded-full bg-[var(--forest,#355f50)]/10 blur-3xl" />
            <div className="absolute right-[-60px] bottom-[-60px] h-44 w-44 rounded-full bg-[#f0b47b]/20 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--forest)" }}>
                Live
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--forest)" }}>
                  Live Streams
                </h1>
                {active?.status === AvailabilityStatus.online ? <TagChip label="On Air" active /> : <TagChip label="Standby" muted />}
              </div>
              <p className="max-w-3xl text-sm md:text-base" style={{ color: "var(--text)" }}>
                ILLUVRSE live broadcasts plus public-access feeds curated for quick monitoring. Select a source to watch in-page; status badges show whether a feed is live, offline, or pending.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-white/70 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--border)", color: "var(--forest)" }}>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  On air
                </span>
                <span className="text-2xl font-black">{onlineCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Offline/Checking
                </span>
                <span className="text-2xl font-black">{offlineCount}</span>
              </div>
            </div>
          </div>
        </header>

        {active ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {sorted.map((stream) => {
                const isActive = stream.id === active?.id;
                const isOffline = stream.status === AvailabilityStatus.offline;
                return (
                  <button
                    key={stream.id}
                    type="button"
                    onClick={() => setActiveId(stream.id)}
                    disabled={isOffline}
                    className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed"
                    style={{
                      border: `1px solid var(--border)`,
                      background: isActive ? "var(--forest)" : "var(--panel)",
                      color: isActive ? "var(--white, #fff)" : "var(--forest)",
                      opacity: isOffline ? 0.5 : 1,
                      boxShadow: isActive ? "0 14px 32px -18px rgba(33,49,45,0.45)" : "none",
                    }}
                    aria-pressed={isActive}
                  >
                    {stream.name}
                    {isOffline && " (offline)"}
                  </button>
                );
              })}
            </div>

            <StreamPlayer stream={active} />

            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              {active.locationName && <span>{active.locationName}</span>}
              {active.countryCode && <span>• {active.countryCode}</span>}
              {active.attribution && <span>• {active.attribution}</span>}
              {active.licenseNote && <span>• {active.licenseNote}</span>}
              {!activeHasMeta && <span>{activeFallback}</span>}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--panel)", boxShadow: "0 20px 38px -32px rgba(33,49,45,0.32)" }}>
            <p className="text-lg font-semibold" style={{ color: "var(--forest)" }}>No streams available yet.</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Add public cams or publish a live stream to see them here, or jump to Sports for on-demand coverage.
            </p>
          </div>
        )}

        {rest.length > 0 && (
          <div className="space-y-4 rounded-3xl border p-5" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--forest)" }}>
                Other live feeds
              </h2>
              <TagChip label="Global" muted />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((stream) => (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => setActiveId(stream.id)}
                  className="group flex flex-col overflow-hidden rounded-2xl border text-left transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-cream,var(--cream))]"
                  style={{ borderColor: "var(--border)", background: "var(--bg-cream)" }}
                >
                  <div className="relative h-40 w-full overflow-hidden bg-[var(--panel)]">
                    {stream.posterImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={stream.posterImage} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                        No preview
                      </div>
                    )}
                    <div className="absolute right-3 top-3 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: stream.status === AvailabilityStatus.online ? "#e63946" : "var(--border)", color: stream.status === AvailabilityStatus.online ? "#fff" : "var(--muted)" }}>
                      {stream.status === AvailabilityStatus.online ? "Live" : "Offline"}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                      {[stream.locationName, stream.countryCode].filter(Boolean).join(" • ")}
                    </p>
                    <h3 className="text-lg font-bold leading-tight transition group-hover:text-[var(--forest)]" style={{ color: "var(--text)" }}>
                      {stream.name}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                      {stream.attribution || (stream.kind === "video" ? "ILLUVRSE Live" : "Public feed")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
