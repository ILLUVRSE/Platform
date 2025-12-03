"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Season, Episode } from "@/lib/ygo";
import Player from "@/components/Player";

type ChannelConfig = {
  id: number;
  name: string;
  label: string;
  seasonNumber?: number;
  description: string;
  placeholder?: boolean;
};

type Channel = ChannelConfig & {
  episodes: Episode[];
};

type ScheduleEntry = {
  episode: Episode;
  start: number;
  end: number;
};

const CHANNEL_CONFIG: ChannelConfig[] = [
  { id: 1, name: "illuvrse1", label: "Series Marathon", description: "Starts 3:00 PM with S1E1, plays every episode sequentially", seasonNumber: undefined },
  { id: 2, name: "illuvrse2", label: "Coming Soon", description: "Placeholder lineup", placeholder: true },
  { id: 3, name: "illuvrse3", label: "Coming Soon", description: "Placeholder lineup", placeholder: true },
  { id: 4, name: "illuvrse4", label: "Coming Soon", description: "Placeholder lineup", placeholder: true },
  { id: 5, name: "illuvrse5", label: "Coming Soon", description: "Placeholder lineup", placeholder: true },
  { id: 6, name: "illuvrse6", label: "Coming Soon", description: "Placeholder lineup", placeholder: true },
];

const DEFAULT_HOURS = 3;
const EXTENDED_HOURS = 48;

function buildChannels(seasons: Season[]): Channel[] {
  const seasonMap = new Map(seasons.map((s) => [s.seasonNumber, s]));
  const fullSeriesEpisodes = seasons
    .flatMap((s) => s.episodes)
    .sort((a, b) =>
      a.season === b.season
        ? a.episode - b.episode
        : a.season - b.season,
    );

  return CHANNEL_CONFIG.map((config) => {
    const episodes = config.id === 1
      ? fullSeriesEpisodes
      : [];
    return { ...config, episodes };
  });
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSchedule(
  episodes: Episode[],
  nowMs: number,
  horizonMs: number,
  anchorMs?: number,
): ScheduleEntry[] {
  if (episodes.length === 0) return [];

  const totalDurationMs = episodes.reduce(
    (sum, ep) => sum + ep.durationSeconds * 1000,
    0,
  );
  const anchor = anchorMs ?? nowMs;
  const positionInLoop =
    (((nowMs - anchor) % totalDurationMs) + totalDurationMs) %
    totalDurationMs;

  let idx = 0;
  let accumulated = 0;
  while (true) {
    const dur = episodes[idx].durationSeconds * 1000;
    if (positionInLoop < accumulated + dur) break;
    accumulated += dur;
    idx = (idx + 1) % episodes.length;
  }

  const schedule: ScheduleEntry[] = [];
  let start = nowMs - (positionInLoop - accumulated);
  let cursor = idx;

  while (start < nowMs + horizonMs) {
    const episode = episodes[cursor];
    const end = start + episode.durationSeconds * 1000;
    schedule.push({ episode, start, end });
    start = end;
    cursor = (cursor + 1) % episodes.length;
  }

  return schedule;
}

function getLivePointer(
  episodes: Episode[],
  nowMs: number,
  anchorMs?: number,
) {
  if (episodes.length === 0) return null;
  const totalDurationMs = episodes.reduce(
    (sum, ep) => sum + ep.durationSeconds * 1000,
    0,
  );
  const anchor = anchorMs ?? nowMs;
  const positionInLoop =
    (((nowMs - anchor) % totalDurationMs) + totalDurationMs) %
    totalDurationMs;

  let idx = 0;
  let accumulated = 0;
  while (true) {
    const dur = episodes[idx].durationSeconds * 1000;
    if (positionInLoop < accumulated + dur) {
      return {
        index: idx,
        offsetSeconds: (positionInLoop - accumulated) / 1000,
      };
    }
    accumulated += dur;
    idx = (idx + 1) % episodes.length;
  }
}

function readableDuration(seconds: number) {
  if (seconds < 90) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  return `${mins}m`;
}

function getMostRecentThreePm(referenceMs: number) {
  const d = new Date(referenceMs);
  d.setHours(15, 0, 0, 0);
  if (d.getTime() > referenceMs) {
    d.setDate(d.getDate() - 1);
  }
  return d.getTime();
}

export default function LiveLoopClient({ seasons }: { seasons: Season[] }) {
  const channels = useMemo(() => buildChannels(seasons), [seasons]);
  const [selectedChannelId, setSelectedChannelId] = useState(
    channels[0]?.id ?? 1,
  );
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [horizonHours, setHorizonHours] = useState(DEFAULT_HOURS);
  const [manualEpisode, setManualEpisode] = useState<{
    index: number;
    offsetSeconds: number;
  } | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setManualEpisode(null); // reset when switching channels
  }, [selectedChannelId]);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);
  const selectedEpisodes = selectedChannel?.episodes ?? [];
  const livePointer = useMemo(() => {
    if (nowMs === null) return null;
    const anchor = selectedChannelId === 1 ? getMostRecentThreePm(nowMs) : undefined;
    return getLivePointer(selectedEpisodes, nowMs, anchor);
  }, [selectedEpisodes, nowMs, selectedChannelId]);

  const horizonMs = horizonHours * 60 * 60 * 1000;
  const activeIndex =
    manualEpisode?.index ??
    livePointer?.index ??
    (selectedEpisodes.length ? 0 : -1);
  const activeEpisode =
    activeIndex >= 0 ? selectedEpisodes[activeIndex] : undefined;
  const startOffsetSeconds =
    manualEpisode?.offsetSeconds ?? livePointer?.offsetSeconds ?? 0;

  const handleEnded = () => {
    if (!selectedEpisodes.length) return;
    const next = (activeIndex + 1) % selectedEpisodes.length;
    setManualEpisode({ index: next, offsetSeconds: 0 });
  };

  const requestFullscreen = () => {
    const el = playerShellRef.current;
    if (!el) return;
    const anyEl = el as any;
    const req =
      el.requestFullscreen ||
      anyEl.webkitRequestFullscreen ||
      anyEl.mozRequestFullScreen ||
      anyEl.msRequestFullscreen;
    if (req) {
      try {
        req.call(el);
      } catch {
        // ignore fullscreen errors
      }
    }
  };

  const channelSchedules = useMemo(
    () =>
      channels.map((channel) => {
        const anchor =
          channel.id === 1 && nowMs !== null
            ? getMostRecentThreePm(nowMs)
            : undefined;
        return {
          channelId: channel.id,
          schedule:
            nowMs === null
              ? []
              : buildSchedule(channel.episodes, nowMs, horizonMs, anchor),
        };
      }),
    [channels, nowMs, horizonMs],
  );

  const horizonEnd = nowMs ? nowMs + horizonMs : null;
  const scheduleReady = nowMs !== null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="uppercase text-xs tracking-[0.3em] text-white/60">
            LiveLoop
          </p>
          <h1 className="text-3xl font-serif font-bold">6-channel lineup</h1>
          <p className="text-white/70">
            illuvrse1 runs the marathon; channels 2–6 are placeholder shells for future lineups.
          </p>
        </div>
        <Link
          href="/series"
          className="text-xs px-3 py-2 rounded-full border border-white/20 hover:bg-white/5"
        >
          View series library
        </Link>
      </header>

      <div className="grid xl:grid-cols-[1.1fr_1fr] gap-6">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => {
              const isActive = selectedChannelId === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  className={`rounded-full px-4 py-2 text-sm border transition ${
                    isActive
                      ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/15 text-white"
                      : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/40"
                  }`}
                >
                  {channel.name}
                </button>
              );
            })}
          </div>

          <div
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            ref={playerShellRef}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="uppercase text-[10px] tracking-[0.3em] text-white/50">
                  {selectedChannel?.label}
                </div>
                <div className="text-lg font-semibold text-white">
                  {activeEpisode
                    ? `S${activeEpisode.season.toString().padStart(2, "0")}E${activeEpisode.episode
                        .toString()
                        .padStart(2, "0")} — ${activeEpisode.title}`
                    : "No content scheduled"}
                </div>
                <div className="text-xs text-white/60">
                  {selectedChannel?.description}
                </div>
              </div>
              {activeEpisode && (
                <div className="text-xs text-white/60 text-right">
                  {readableDuration(activeEpisode.durationSeconds)} · #
                  {activeEpisode.productionId}
                </div>
              )}
            </div>

            <div className="mt-3">
              {activeEpisode ? (
                <Player
                  key={`${selectedChannelId}-${activeEpisode.filename}`}
                  title={`${selectedChannel?.name || "Channel"} · S${activeEpisode.season
                    .toString()
                    .padStart(2, "0")}E${activeEpisode.episode.toString().padStart(2, "0")}`}
                  source={{
                    mp4Url: activeEpisode.url,
                    startPosition: startOffsetSeconds,
                  }}
                  onEnded={handleEnded}
                />
              ) : (
                <div className="overflow-hidden rounded-lg border border-white/10 bg-black flex aspect-video items-center justify-center text-white/60">
                  {selectedChannel?.placeholder
                    ? `${selectedChannel.name} placeholder`
                    : "Promo slot — add content to illuvrse1 or choose a season."}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <button
                onClick={() => {
                  setManualEpisode(null);
                  requestFullscreen();
                }}
                className="px-3 py-1 rounded-full border border-white/20 bg-white/5 hover:bg-white/10"
              >
                Jump to live
              </button>
              {activeEpisode && (
                <button
                  onClick={() =>
                    setManualEpisode({
                      index: (activeIndex + 1) % selectedEpisodes.length,
                      offsetSeconds: 0,
                    })
                  }
                  className="px-3 py-1 rounded-full border border-white/20 bg-white/5 hover:bg-white/10"
                >
                  Skip to next
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Up next (channel timeline)</h3>
              <span className="text-xs text-white/50">
                Next {horizonHours} hours (first 12 slots)
              </span>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-auto pr-1">
              {scheduleReady &&
                channelSchedules
                  .find((c) => c.channelId === selectedChannelId)
                  ?.schedule.slice(0, 12)
                  .map((entry, idx) => (
                    <button
                      key={`${entry.episode.filename}-${idx}`}
                      onClick={() => {
                        const matchIdx = selectedEpisodes.findIndex(
                          (e) => e.filename === entry.episode.filename,
                        );
                        if (matchIdx >= 0) {
                          setManualEpisode({ index: matchIdx, offsetSeconds: 0 });
                        }
                      }}
                      className="w-full text-left rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:border-[var(--color-accent)]/50"
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                        {formatTime(entry.start)} – {formatTime(entry.end)}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        S{entry.episode.season.toString().padStart(2, "0")}E
                        {entry.episode.episode.toString().padStart(2, "0")} ·{" "}
                        {entry.episode.title}
                      </div>
                      <div className="text-[11px] text-white/50">
                        {readableDuration(entry.episode.durationSeconds)}
                      </div>
                    </button>
                  ))}
              {(!scheduleReady ||
                selectedEpisodes.length === 0 ||
                selectedChannel?.placeholder) && (
                <div className="text-white/60 text-sm">
                  {scheduleReady
                    ? "No schedule — placeholder channel."
                    : "Syncing schedule…"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">
                TV-style guide (next {horizonHours} hours)
              </h3>
              <div className="flex gap-2">
                {[DEFAULT_HOURS, EXTENDED_HOURS].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setHorizonHours(hours)}
                    className={`px-3 py-1 rounded-full border text-xs ${
                      horizonHours === hours
                        ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/15 text-white"
                        : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-white/60">
              {scheduleReady && horizonEnd
                ? `${formatTime(nowMs)} to ${formatTime(horizonEnd)}`
                : "Syncing schedule…"}
            </div>
          </div>

          <div className="space-y-2 overflow-x-auto">
            <div className="grid grid-cols-[120px_1fr] min-w-full text-[11px] uppercase tracking-[0.2em] text-white/50 px-2">
              <div>Channel</div>
              <div className="flex justify-between">
                <span>{scheduleReady && nowMs ? formatTime(nowMs) : "--:--"}</span>
                <span>
                  {scheduleReady && nowMs
                    ? formatTime(nowMs + horizonMs / 2)
                    : "--:--"}
                </span>
                <span>
                  {scheduleReady && horizonEnd ? formatTime(horizonEnd) : "--:--"}
                </span>
              </div>
            </div>

            {channelSchedules.map(({ channelId, schedule }) => {
              const channel = channels.find((c) => c.id === channelId);
              return (
                <div
                  key={channelId}
                  className="grid grid-cols-[120px_1fr] min-w-full items-stretch gap-2 px-2 py-2 rounded-xl hover:bg-white/5"
                >
                  <div className="text-sm font-semibold text-white">
                    {channel?.name}
                    <div className="text-[11px] text-white/60">{channel?.label}</div>
                  </div>
                  <div className="flex gap-1 items-stretch">
                    {scheduleReady &&
                      schedule.map((entry, idx) => {
                      const start = Math.max(entry.start, nowMs ?? entry.start);
                      const end = Math.min(entry.end, horizonEnd ?? entry.end);
                      const widthPct = ((end - start) / horizonMs) * 100;
                      if (widthPct <= 0) return null;
                      const isLive =
                        entry.start <= nowMs && entry.end >= nowMs;
                      return (
                        <div
                          key={`${entry.episode.filename}-${idx}`}
                          className={`relative rounded-lg border px-3 py-2 text-left text-xs leading-tight ${
                            isLive
                              ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/15"
                              : "border-white/10 bg-black/30"
                          }`}
                          style={{ width: `${widthPct}%`, minWidth: "120px" }}
                        >
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                            {formatTime(entry.start)} — {formatTime(entry.end)}
                          </div>
                          <div className="font-semibold text-white line-clamp-2">
                            S{entry.episode.season.toString().padStart(2, "0")}E
                            {entry.episode.episode.toString().padStart(2, "0")} · {entry.episode.title}
                          </div>
                          <div className="text-[11px] text-white/60">
                            {readableDuration(entry.episode.durationSeconds)}
                          </div>
                          {isLive && (
                            <div className="absolute top-1 right-2 text-[10px] text-[var(--color-accent)]">
                              LIVE
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {schedule.length === 0 && (
                      <div className="flex-1 rounded-lg border border-white/10 bg-black/30 text-white/60 text-xs flex items-center justify-center">
                        No programming
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
