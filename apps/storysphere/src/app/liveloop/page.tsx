import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";
import { headers } from "next/headers";
import { Suspense } from "react";
import { AddToLiveLoopButton } from "../../components/AddToLiveLoopButton";
import { moviesCatalog } from "../../lib/libraryData";

type ScheduleSlot = {
  title: string;
  startMinutes: number;
  durationMinutes: number;
  status?: "On Air" | "Next";
  detail?: string;
  mediaDuration?: string;
  file?: string;
  note?: string;
};

type GuideSlot = ScheduleSlot & {
  start: Date;
  end: Date;
};

const PRIME_TIME_START = 18 * 60;
const MEDIA_BASE = (process.env.MEDIA_BASE_URL || "").replace(/\/$/, "");
const primeTimeOrder = ["gilda-1946", "royal-wedding", "casablanca-color"];
const primeTimeNotes: Record<string, string> = {
  "gilda-1946": "Rita Hayworth & Glenn Ford open prime time",
  "royal-wedding": "Fred Astaire + Jane Powell classic",
  "casablanca-color": "Bogart & Bergman close the block"
};

export default function LiveLoopPage() {
  const host = headers().get("host") ?? "";
  const isIlluvrseHost = host === "www.illuvrse.com";
  const canShowLiveLoop = isIlluvrseHost || host.includes("localhost");
  const schedule = buildSchedule();
  const guide = buildGuide(new Date(), schedule);
  const nowPlaying = guide.find((slot) => slot.status === "On Air");
  const eveningMovies = buildPrimeTime(schedule);
  const previewFile = schedule.find((slot) => slot.file)?.file;

  return (
    <div className="space-y-10">
      <LiveLoopHero host={host} isIlluvrseHost={isIlluvrseHost} primeTime={eveningMovies} />
      <LiveLoopPlayerShell
        host={host}
        canShowLiveLoop={canShowLiveLoop}
        nowPlaying={nowPlaying}
        previewFile={previewFile}
      />
      <ScheduleGuide guide={guide} />

      <PageSection eyebrow="Tonight on LiveLoop" title="Triple feature, then back to Beverly Hills">
        <div className="grid gap-6 lg:grid-cols-3">
          {eveningMovies.map((movie) => (
            <Card
              key={movie.title}
              title={`${movie.time} • ${movie.title}`}
              body={
                <div className="space-y-2 text-sm text-slate-200/80">
                  <div className="text-cream">
                    {movie.note || "Prime-time feature sourced from the Library block"}
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Duration</div>
                    <div className="text-teal-100">{movie.duration}</div>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      </PageSection>

      {canShowLiveLoop ? (
        <Suspense fallback={<div>Loading playlist…</div>}>
          <PlaylistSection host={host} isIlluvrseHost={isIlluvrseHost} guide={guide} />
        </Suspense>
      ) : (
        <PageSection eyebrow="Access" title="LiveLoop is pinned to www.illuvrse.com">
          <Card
            title="Production-only stream"
            body={
              <div className="space-y-3 text-sm text-slate-200/80">
                <p>
                  The channel renders only on the illuvrse.com host. You&apos;re hitting {host || "this host"},
                  so swap to https://www.illuvrse.com to see the live stream and queue.
                </p>
                <a
                  className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-4 py-2 font-semibold text-slate-900 shadow-card transition hover:opacity-95"
                  href="https://www.illuvrse.com"
                >
                  Go to www.illuvrse.com
                </a>
              </div>
            }
          />
        </PageSection>
      )}

      <AboutSection />
    </div>
  );
}

async function PlaylistSection({
  host,
  isIlluvrseHost,
  guide
}: {
  host: string;
  isIlluvrseHost: boolean;
  guide: GuideSlot[];
}) {
  const playlist = buildPlaylistFromGuide(guide);
  return (
    <PageSection eyebrow="Channel playlist" title="Locked to www.illuvrse.com">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Now playing + queued"
          body={
            <div className="space-y-3 text-sm">
              {playlist.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3"
                >
                  <div className="text-cream">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-slate-200/70">{item.duration}</div>
                  </div>
                  <Pill
                    className={`${
                      item.status === "On Air"
                        ? "bg-gold-500/30 text-gold-100"
                        : item.status === "Next"
                          ? "bg-teal-600/30 text-teal-100"
                          : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {item.status}
                  </Pill>
                </div>
              ))}
              <div className="mt-4">
                <AddToLiveLoopButton title="New slot" duration="00:10" />
              </div>
            </div>
          }
        />
        <Card
          title="Promo + proofs"
          body={
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Streaming home</div>
                <div className="mt-1 font-semibold text-cream">www.illuvrse.com</div>
                {!isIlluvrseHost ? (
                  <p className="mt-2 text-slate-200/80">
                    The live stream only renders on the production domain. You&apos;re previewing on{" "}
                    {host || "local dev"} — switch to www.illuvrse.com to see the channel.
                  </p>
                ) : (
                  <p className="mt-2 text-slate-200/80">You&apos;re on the production domain.</p>
                )}
              </div>
              <p>Every slot carries proofs so the Player can display them inline.</p>
              <ProofCard
                sha="bhills:2477...loop"
                signer="Kernel multisig"
                timestamp="Daily rotation @ 06:00 PM"
                policyVerdict="SentinelNet PASS"
              />
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Coming next</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-200/80">
                  <li>More Beverly Hillbillies drops as downloads finish</li>
                  <li>Nightly promos for the triple feature block</li>
                  <li>Player embed tuned for illuvrse.com</li>
                </ul>
              </div>
            </div>
          }
        />
      </div>
    </PageSection>
  );
}

function LiveLoopHero({
  host,
  isIlluvrseHost,
  primeTime
}: {
  host: string;
  isIlluvrseHost: boolean;
  primeTime: ReturnType<typeof buildPrimeTime>;
}) {
  const startLabel = primeTime[0]?.time ?? "6:00 PM";
  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Pill className="bg-gold-500/30 text-gold-100">LiveLoop • www.illuvrse.com</Pill>
          <h1 className="text-4xl font-semibold">
            Beverly Hillbillies all day + a 6:00 PM classic triple feature
          </h1>
          <p className="max-w-2xl text-lg text-slate-200/90">
            One LiveLoop channel on illuvrse.com: Season 1 of The Beverly Hillbillies runs nonstop. Prime time
            pulls straight from the Library so Gilda, Royal Wedding, and Casablanca slot in automatically before
            the Clampetts take back over.
          </p>
          <ul className="space-y-1 text-sm text-slate-100">
            {primeTime.map((slot) => (
              <li key={slot.title}>
                {slot.time} — {slot.title}
              </li>
            ))}
            <li>Then back to Beverly Hills overnight</li>
          </ul>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href="https://www.illuvrse.com"
              className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 font-semibold text-slate-900 shadow-card transition hover:opacity-95"
            >
              Watch on www.illuvrse.com
            </a>
            <Pill className="bg-teal-600/30 text-teal-100">Triple feature starts {startLabel}</Pill>
            {!isIlluvrseHost && (
              <Pill className="bg-red-500/20 text-red-100">
                Preview on {host || "local"} — live stream is gated to illuvrse.com
              </Pill>
            )}
          </div>
        </div>
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Channel</div>
              <div className="text-lg font-semibold text-cream">ILLUVRSE LiveLoop</div>
            </div>
            <Pill className="bg-gold-500/30 text-gold-100">On Air</Pill>
          </div>
          <div className="space-y-2 text-sm text-slate-200/80">
            <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-3">
              <div className="text-slate-200">The Beverly Hillbillies • Season 1</div>
              <div className="text-xs uppercase tracking-[0.2em] text-teal-100/90">24/7 anchor loop</div>
            </div>
            <ul className="space-y-1">
              <li>6:00 PM — Casablanca (Color Edition)</li>
              <li>7:42 PM — The Royal Wedding</li>
              <li>6:00 PM — Gilda</li>
              <li>7:50 PM — The Royal Wedding</li>
              <li>9:23 PM — Casablanca (Color Edition)</li>
              <li>Then back to Beverly Hills overnight</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveLoopPlayerShell({
  host,
  canShowLiveLoop,
  nowPlaying,
  previewFile
}: {
  host: string;
  canShowLiveLoop: boolean;
  nowPlaying?: GuideSlot;
  previewFile?: string | null;
}) {
  const previewName =
    previewFile ??
    "Casablanca 1942, in color, Humphrey Bogart, Ingrid Bergman, Paul Henreid, Claude Rains, Sydney Greenstreet, Peter Lorre, Dooley Wilson,.mp4";
  const previewIsRemote = previewName.startsWith("http://") || previewName.startsWith("https://");
  const previewSrc = previewIsRemote
    ? previewName
    : `/api/liveloop/preview?file=${encodeURIComponent(previewName)}`;
  const streamSrc = canShowLiveLoop
    ? process.env.NEXT_PUBLIC_LIVELOOP_SRC ?? previewSrc
    : previewSrc;
  const usingLiveStream = Boolean(process.env.NEXT_PUBLIC_LIVELOOP_SRC) && canShowLiveLoop;
  const previewingLocal = !usingLiveStream;
  const fallbackPoster =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='#0b1224' offset='0'/><stop stop-color='#123146' offset='1'/></linearGradient></defs><rect fill='url(#g)' width='1600' height='900'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#c7d2fe' font-size='42' font-family='sans-serif'>ILLUVRSE LiveLoop • Beverly Hillbillies</text></svg>`
    );

  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 px-4 py-6 shadow-card md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Pill className="bg-slate-700/80 text-slate-100">LiveLoop Channel</Pill>
          <div className="mt-2 text-2xl font-semibold text-cream">Beverly Hillbillies Marathon</div>
          <p className="text-sm text-slate-200/80">
            Commercial-free stream. Defaults to Beverly Hillbillies Season 1 with the 6:00 PM triple
            feature.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-200/80">
          {!canShowLiveLoop && (
            <Pill className="bg-red-500/20 text-red-100">Live stream gated to www.illuvrse.com</Pill>
          )}
          <Pill className="bg-teal-600/30 text-teal-100">HLS/MP4 ready for Vercel</Pill>
          {usingLiveStream ? (
            <Pill className="bg-gold-500/30 text-gold-100">Streaming production feed</Pill>
          ) : (
            <Pill className="bg-slate-700/60 text-slate-100">Previewing local file</Pill>
          )}
        </div>
      </div>
      {nowPlaying && (
        <div className="mt-3 flex items-center gap-3 text-sm text-slate-200/80">
          <Pill className="bg-gold-500/30 text-gold-100">On Air</Pill>
          <div className="text-cream">
            {nowPlaying.title} • {formatTime(nowPlaying.startMinutes)}–{formatTimeFromDate(nowPlaying.end)}
          </div>
        </div>
      )}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950">
        <video
          className="h-full w-full max-h-[540px] bg-slate-950 object-cover"
          controls
          playsInline
          muted
          autoPlay
          loop
          poster={fallbackPoster}
        >
          <source src={streamSrc || undefined} type={mimeFromSrc(streamSrc)} />
        </video>
        {!canShowLiveLoop && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6 text-center text-sm text-slate-100 backdrop-blur">
            The LiveLoop stream renders on www.illuvrse.com. You&apos;re on {host || "this host"} — switch to
            production to watch. Player is Vercel-ready; set NEXT_PUBLIC_LIVELOOP_SRC to your HLS/MP4; this view
            shows the local preview clip.
          </div>
        )}
      </div>
    </section>
  );
}

function ScheduleGuide({ guide }: { guide: GuideSlot[] }) {
  const minutesToPx = (minutes: number) => minutes * 2; // 1 minute = 2px gives ~2880px width for 24h
  const totalWidth = minutesToPx(24 * 60);

  return (
    <PageSection eyebrow="Schedule" title="24 hours, scrollable — shows a 3-hour viewport">
      <div className="overflow-x-auto rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
        <div className="relative min-w-[960px]" style={{ width: `${totalWidth}px` }}>
          <div className="mb-2 flex justify-between text-[11px] uppercase tracking-[0.2em] text-slate-300/70">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
          <div className="relative h-40 rounded-xl border border-slate-700/80 bg-slate-950/80">
            {guide.map((slot, idx) => {
              const left = minutesToPx(slot.startMinutes);
              const width = minutesToPx(slot.durationMinutes);
              return (
                <div
                  key={slot.title + idx}
                  className="absolute h-full rounded-xl border border-slate-700/80 bg-gradient-to-br from-teal-600/30 to-gold-500/20 p-4 text-sm text-cream shadow-card"
                  style={{ left, width }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{slot.title}</div>
                    {slot.status && (
                      <Pill className={slot.status === "On Air" ? "bg-gold-500/30 text-gold-100" : "bg-teal-600/30 text-teal-100"}>
                        {slot.status}
                      </Pill>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-200/80">
                    {formatTime(slot.startMinutes)} · {slot.durationMinutes} min
                  </div>
                  {slot.detail && <div className="mt-2 text-slate-100/90">{slot.detail}</div>}
                </div>
              );
            })}
            <div className="absolute inset-0 grid grid-cols-24 text-[10px] text-slate-400">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="border-r border-slate-800/60" />
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-300/80">
            Drag or scroll horizontally to see the full 24 hours. Each minute is scaled for a ~3-hour viewport at a glance.
          </div>
        </div>
      </div>
    </PageSection>
  );
}

function AboutSection() {
  return (
    <PageSection eyebrow="About" title="Coming soon to www.illuvrse.com">
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          title="Commercial-free"
          body={<p className="text-sm text-slate-200/80">One channel, zero ads. Beverly Hillbillies Season 1 anchors the day.</p>}
        />
        <Card
          title="Prime-time triple feature"
          body={
            <p className="text-sm text-slate-200/80">
              6:00 PM Gilda → 7:50 PM Royal Wedding → 9:23 PM Casablanca (Color).
            </p>
          }
        />
        <Card
          title="Illuvrse Player"
          body={<p className="text-sm text-slate-200/80">Tune in at www.illuvrse.com. Player is Vercel-ready; set NEXT_PUBLIC_LIVELOOP_SRC to your HLS/MP4.</p>}
        />
      </div>
    </PageSection>
  );
}

function buildSchedule(): ScheduleSlot[] {
  const anchor: ScheduleSlot = {
    title: "Beverly Hillbillies Marathon (S1)",
    startMinutes: 0,
    durationMinutes: PRIME_TIME_START,
    detail: "Rotating episodes, commercial free"
  };

  const primeTime = primeTimeOrder
    .map((id) => moviesCatalog.find((movie) => movie.id === id))
    .filter((movie): movie is (typeof moviesCatalog)[number] => Boolean(movie));

  let cursor = PRIME_TIME_START;
  const primeSlots: ScheduleSlot[] = primeTime.map((movie) => {
    const durationMinutes = parseDurationToMinutes(movie.duration);
    const resolvedFile = resolveMediaFile(movie.file);
    const slot: ScheduleSlot = {
      title: movie.title,
      startMinutes: cursor,
      durationMinutes,
      mediaDuration: movie.duration,
      file: resolvedFile,
      detail: `${formatTime(cursor)} — ${primeTimeNotes[movie.id] ?? "Prime-time feature"}`,
      note: primeTimeNotes[movie.id]
    };
    cursor += durationMinutes;
    return slot;
  });

  const overnightStart = cursor;
  const overnightSlot: ScheduleSlot = {
    title: "Beverly Hillbillies Overnight Loop",
    startMinutes: overnightStart,
    durationMinutes: 24 * 60 - overnightStart,
    detail: "Back to the Clampetts till morning"
  };

  return [anchor, ...primeSlots, overnightSlot];
}

function buildPrimeTime(schedule: ScheduleSlot[]) {
  return schedule
    .filter((slot) => slot.startMinutes >= PRIME_TIME_START && slot.mediaDuration)
    .map((slot) => ({
      title: slot.title,
      time: formatTimeLabel(slot.startMinutes),
      duration: friendlyDuration(slot.durationMinutes),
      note: slot.note ?? slot.detail ?? ""
    }));
}

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const h = ((hours + 24) % 24).toString().padStart(2, "0");
  const m = minutes.toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatTimeFromDate(date: Date) {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatTimeLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 || 12;
  return `${twelveHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function formatDurationMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function friendlyDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function parseDurationToMinutes(duration: string) {
  const [hours, minutes] = duration.split(":").map((part) => parseInt(part, 10));
  const safeHours = Number.isFinite(hours) ? hours : 0;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  return safeHours * 60 + safeMinutes;
}

function resolveMediaFile(file?: string) {
  if (!file) return file;
  if (file.startsWith("http://") || file.startsWith("https://")) return file;
  if (MEDIA_BASE) return `${MEDIA_BASE}/${encodeURIComponent(file)}`;
  return file;
}

function mimeFromSrc(src?: string | null) {
  if (!src) return "video/mp4";
  const clean = src.split("?")[0] ?? "";
  const dotIndex = clean.lastIndexOf(".");
  const ext = dotIndex >= 0 ? clean.slice(dotIndex).toLowerCase() : "";
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".mkv":
      return "video/x-matroska";
    case ".avi":
      return "video/x-msvideo";
    case ".mpeg":
      return "video/mpeg";
    case ".m3u8":
      return "application/vnd.apple.mpegurl";
    default:
      return "video/mp4";
  }
}

function buildGuide(now: Date, slots: ScheduleSlot[]): GuideSlot[] {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const guide = slots.map((slot) => {
    const start = new Date(startOfDay.getTime() + slot.startMinutes * 60_000);
    const end = new Date(start.getTime() + slot.durationMinutes * 60_000);
    return { ...slot, start, end };
  });

  let nextAssigned = false;
  return guide.map((slot) => {
    const isOnAir = now >= slot.start && now < slot.end;
    const isFuture = now < slot.start;
    let status: ScheduleSlot["status"];
    if (isOnAir) status = "On Air";
    else if (isFuture && !nextAssigned) {
      status = "Next";
      nextAssigned = true;
    }
    return { ...slot, status };
  });
}

function buildPlaylistFromGuide(guide: GuideSlot[]) {
  return guide.map((slot, idx) => ({
    id: `slot-${idx}`,
    title: slot.title,
    duration: formatDurationMinutes(slot.durationMinutes),
    status: slot.status ?? "Queued",
    sha: `guide:${idx.toString().padStart(2, "0")}`
  }));
}
