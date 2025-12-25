"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { LicenseModal } from "@news/components/news/license-modal";
import { VerificationBadge } from "@news/components/ui";

type Station = {
  id: string;
  name: string;
  slug: string;
  streamUrl: string;
  websiteUrl?: string | null;
  rightsContact?: string | null;
  logoUrl?: string | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  language?: string | null;
  genre?: string | null;
  bitrate?: number | null;
  codec?: string | null;
  status: string;
  lastCheckedAt?: string | null;
  failureCount?: number | null;
  updatedAt?: string | null;
  isPublic: boolean;
  notes?: string | null;
};

type Filters = {
  region: string;
  language: string;
  genre: string;
  verifiedOnly: boolean;
  sort: string;
  search: string;
};

const defaultFilters: Filters = {
  region: "WORLD",
  language: "all",
  genre: "all",
  verifiedOnly: false,
  sort: "health",
  search: "",
};

const statusTone = (status?: string) => {
  if (!status) return { bg: "#fef08a", text: "#854d0e", label: "Unknown" };
  if (status.toLowerCase() === "online") return { bg: "#dcfce7", text: "#166534", label: "Online" };
  if (status.toLowerCase() === "offline") return { bg: "#fee2e2", text: "#991b1b", label: "Offline" };
  return { bg: "#fef08a", text: "#854d0e", label: status };
};

export default function RadioPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const savedFavs = localStorage.getItem("radioFavorites");
    return savedFavs ? JSON.parse(savedFavs) : [];
  });
  const [nowPlaying, setNowPlaying] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ariaMessage, setAriaMessage] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateStationLocal = useCallback((patched: Partial<Station> & { id: string }) => {
    setStations((prev) =>
      prev.map((s) => (s.id === patched.id ? { ...s, ...patched } : s)),
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("radioFavorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const fetchStations = async () => {
      const res = await fetch("/news/api/public/stations");
      const data = await res.json();
      setStations(data.stations || []);
      if (data.stations?.length) {
        setSelectedStationId(data.stations[0].id);
      }
    };
    fetchStations();
    const interval = setInterval(fetchStations, 120000);
    return () => clearInterval(interval);
  }, []);

  const filteredStations = useMemo(() => {
    return stations
      .filter((s) => s.isPublic)
      .filter((s) => (filters.region === "WORLD" ? true : s.region === filters.region || s.countryCode === filters.region))
      .filter((s) => (filters.language === "all" ? true : s.language?.toLowerCase() === filters.language.toLowerCase()))
      .filter((s) => (filters.genre === "all" ? true : (s.genre || "").toLowerCase().includes(filters.genre.toLowerCase())))
      .filter((s) => (filters.verifiedOnly ? s.status?.toLowerCase() === "online" : true))
      .filter((s) => {
        if (!filters.search.trim()) return true;
        const hay = `${s.name} ${s.genre ?? ""} ${s.region ?? ""} ${s.language ?? ""}`.toLowerCase();
        return hay.includes(filters.search.toLowerCase().trim());
      })
      .sort((a, b) => {
        if (filters.sort === "health") {
          const order = { online: 2, unknown: 1, offline: 0 };
          return (order[(b.status ?? "unknown").toLowerCase() as keyof typeof order] ?? 0) - (order[(a.status ?? "unknown").toLowerCase() as keyof typeof order] ?? 0);
        }
        if (filters.sort === "bitrate") {
          return (b.bitrate ?? 0) - (a.bitrate ?? 0);
        }
        if (filters.sort === "recent") {
          return new Date(b.lastCheckedAt ?? b.updatedAt ?? 0).getTime() - new Date(a.lastCheckedAt ?? a.updatedAt ?? 0).getTime();
        }
        return a.name.localeCompare(b.name);
      });
  }, [stations, filters]);

  const selectedStation = filteredStations.find((s) => s.id === selectedStationId) || filteredStations[0] || null;
  const selectedHasStream = Boolean(selectedStation?.streamUrl?.trim());

  const playStation = useCallback(
    (station: Station) => {
      const streamUrl = station.streamUrl?.trim();
      if (!streamUrl) {
        setAriaMessage(`Stream pending for ${station.name}`);
        return;
      }
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener("ended", () => setIsPlaying(false));
        audioRef.current.addEventListener("pause", () => setIsPlaying(false));
        audioRef.current.addEventListener("play", () => setIsPlaying(true));
      }
      if (nowPlaying?.id === station.id && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      if (audioRef.current) {
        audioRef.current.src = streamUrl;
        audioRef.current.play().catch(() => setIsPlaying(false));
        setNowPlaying(station);
        setSelectedStationId(station.id);
        setAriaMessage(`Now playing ${station.name}${station.region ? ` in ${station.region}` : ""}`);
      }
    },
    [isPlaying, nowPlaying],
  );

  // Periodic health checks for the selected station only (avoid flooding)
  useEffect(() => {
    if (!selectedStation) return;
    let cancelled = false;
    const runCheck = async () => {
      try {
        const res = await fetch("/news/api/stations/health", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stationId: selectedStation.id }),
        });
        const data = await res.json();
        if (!cancelled && data?.station) {
          updateStationLocal(data.station);
        }
      } catch {
        /* ignore */
      }
    };
    runCheck();
    const timer = setInterval(runCheck, 90000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedStation, updateStationLocal]);

  // Keyboard shortcuts for grid navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!filteredStations.length) return;
      const currentIndex = selectedStation ? filteredStations.findIndex((s) => s.id === selectedStation.id) : 0;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = filteredStations[Math.min(filteredStations.length - 1, currentIndex + 1)];
        if (next) setSelectedStationId(next.id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = filteredStations[Math.max(0, currentIndex - 1)];
        if (prev) setSelectedStationId(prev.id);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedStation) playStation(selectedStation);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filteredStations, selectedStation, playStation]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const copyStream = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setAriaMessage("Stream URL not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(trimmed);
      setAriaMessage("Stream URL copied");
    } catch {
      setAriaMessage("Copy failed");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12" style={{ background: "var(--cream)", color: "var(--text)" }}>
      <div className="sr-only" aria-live="polite">
        {ariaMessage}
      </div>
      <header className="mb-8 space-y-2" role="banner">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--forest)" }}>
          Radio
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--forest)" }}>
          Public Access Radio
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Verified public and community stations with licensing guidance. Streams show live health and last checked times.
        </p>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Keyboard: ↑/↓ change station, Enter to play. Health auto-refresh for the selected station only.
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
          <button
            type="button"
            onClick={async () => {
              if (!selectedStation) return;
              try {
                const res = await fetch("/news/api/stations/health", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stationId: selectedStation.id }),
                });
                const data = await res.json();
                if (data?.station) {
                  updateStationLocal(data.station);
                }
              } catch {
                /* ignore */
              }
            }}
            className="rounded-full border px-3 py-1 text-[11px] transition hover:-translate-y-0.5"
            style={{ borderColor: "var(--border)", color: "var(--forest)" }}
          >
            Refresh selected health
          </button>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>
            Health auto-refreshes every 90s for the selected station.
          </span>
        </div>
      </header>

      <section className="mb-6 grid gap-3 rounded-2xl border p-4 md:grid-cols-2 lg:grid-cols-3" style={{ borderColor: "var(--border)", background: "var(--panel)" }} aria-label="Radio filters">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Region
          <select
            value={filters.region}
            onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: "var(--border)", background: "var(--cream)", color: "var(--forest)" }}
            data-cy="radio-filter-region"
          >
            <option value="WORLD">World</option>
            <option value="NA">North America</option>
            <option value="EU">Europe</option>
            <option value="AS">Asia</option>
            <option value="AF">Africa</option>
            <option value="SA">South America</option>
            <option value="OC">Oceania</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Language
          <select
            value={filters.language}
            onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: "var(--border)", background: "var(--cream)", color: "var(--forest)" }}
            data-cy="radio-filter-language"
          >
            <option value="all">All languages</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
            <option value="zh">中文</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Genre
          <input
            value={filters.genre}
            onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value }))}
            placeholder="e.g., News, Talk, Music"
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: "var(--border)", background: "var(--cream)", color: "var(--forest)" }}
            data-cy="radio-filter-genre"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Sort
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: "var(--border)", background: "var(--cream)", color: "var(--forest)" }}
            data-cy="radio-filter-sort"
          >
            <option value="health">Health first</option>
            <option value="bitrate">Highest bitrate</option>
            <option value="recent">Recently checked</option>
            <option value="alpha">A–Z</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Search
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search station or region"
            className="rounded-full border px-3 py-2 text-sm font-semibold tracking-[0.08em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
            style={{ borderColor: "var(--border)", background: "var(--cream)", color: "var(--forest)" }}
            data-cy="radio-filter-search"
          />
        </label>

        <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))}
            className="h-4 w-4 rounded border text-[var(--forest)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)]"
            data-cy="radio-filter-verified"
          />
          Only verified/online
        </label>

        <div className="flex flex-wrap items-center gap-3 lg:col-span-3" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Stations list">
        {filteredStations.map((station) => {
          const isSelected = selectedStation?.id === station.id;
          const isFav = favorites.includes(station.id);
          const tone = statusTone(station.status);
          const lastChecked = station.lastCheckedAt ? new Date(station.lastCheckedAt).toLocaleString() : "Unknown";
          const hasStream = station.streamUrl.trim().length > 0;
          return (
            <article key={station.id} className="flex flex-col gap-3 rounded-2xl border p-4 shadow-sm" style={{ borderColor: "var(--border)", background: isSelected ? "rgba(47,107,88,0.06)" : "var(--panel)" }} data-cy="radio-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {station.logoUrl && (
                    <Image
                      src={station.logoUrl}
                      alt={`${station.name} logo`}
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-lg object-contain border"
                      style={{ borderColor: "var(--border)" }}
                    />
                  )}
                  <div>
                    <Link href={`/radio/${station.slug}`} className="text-base font-bold leading-tight hover:underline" style={{ color: "var(--forest)" }}>
                      {station.name}
                    </Link>
                    <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                      {[station.countryCode, station.region, station.language].filter(Boolean).join(" • ") || "Global"}
                    </p>
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ background: tone.bg, color: tone.text, border: `1px solid ${tone.text}20` }}
                  aria-label={`Status ${tone.label}`}
                >
                  {tone.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                {station.genre && <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--border)" }}>{station.genre}</span>}
                {station.bitrate && <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--border)" }}>{station.bitrate} kbps</span>}
                {station.codec && <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--border)" }}>{station.codec}</span>}
                <VerificationBadge reliability={tone.label === "Online" ? 90 : tone.label === "Offline" ? 10 : 50} label="Health" size="sm" />
              </div>

              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                {station.notes || "No description provided. Visit station profile for schedule and provenance."}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                <span>Last checked: {lastChecked}</span>
                <span aria-live="polite">{station.failureCount ? `${station.failureCount} recent failures` : "Stable"}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStationId(station.id);
                    playStation(station);
                  }}
                  className="rounded-full bg-[var(--forest)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest)] disabled:cursor-not-allowed disabled:opacity-60"
                  data-cy="radio-play"
                  aria-pressed={nowPlaying?.id === station.id && isPlaying}
                  aria-label={
                    nowPlaying?.id === station.id && isPlaying
                      ? `Pause ${station.name}`
                      : hasStream
                        ? `Play ${station.name}`
                        : `${station.name} stream pending`
                  }
                  disabled={!hasStream}
                >
                  {nowPlaying?.id === station.id && isPlaying ? "Pause" : hasStream ? "Listen" : "Stream pending"}
                </button>
                <button
                  type="button"
                  onClick={() => copyStream(station.streamUrl)}
                  className="rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ borderColor: "var(--border)", color: "var(--forest)" }}
                  data-cy="radio-copy"
                  disabled={!hasStream}
                >
                  Copy stream URL
                </button>
                {hasStream && (
                  <a
                    href={station.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5"
                    style={{ borderColor: "var(--border)", color: "var(--forest)" }}
                    data-cy="radio-open-external"
                  >
                    Open player
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => toggleFavorite(station.id)}
                  className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
                  style={{ borderColor: "var(--border)", color: isFav ? "#b91c1c" : "var(--forest)" }}
                  data-cy="radio-favorite"
                  aria-pressed={isFav}
                >
                  {isFav ? "Unfavorite" : "Favorite"}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <LicenseModal
                  license="Public broadcast — confirm reuse with source"
                  title={station.name}
                  author="Station operator"
                  sourceName={station.name}
                  dataCy="radio-license"
                />
                {station.websiteUrl && (
                  <a
                    href={station.websiteUrl}
                    className="text-xs font-semibold uppercase tracking-[0.18em] underline"
                    style={{ color: "var(--forest)" }}
                    target="_blank"
                    rel="noreferrer"
                    data-cy="radio-source-site"
                  >
                    Source site →
                  </a>
                )}
                <Link href={`/radio/${station.slug}`} className="text-xs font-semibold uppercase tracking-[0.18em] underline" style={{ color: "var(--forest)" }}>
                  Station profile
                </Link>
              </div>
            </article>
          );
        })}

        {filteredStations.length === 0 && (
          <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--muted)" }} data-cy="radio-empty">
            No stations match these filters. Try clearing search or selecting another region/language.
          </div>
        )}

        <aside className="rounded-2xl border p-4 md:col-span-2 lg:col-span-1" style={{ borderColor: "var(--border)", background: "var(--panel)" }} aria-label="Station details">
          {selectedStation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {selectedStation.logoUrl ? (
                  <Image src={selectedStation.logoUrl} alt={`${selectedStation.name} logo`} width={56} height={56} className="h-14 w-14 rounded-lg object-contain border" style={{ borderColor: "var(--border)" }} />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border text-sm font-semibold uppercase" style={{ borderColor: "var(--border)", color: "var(--forest)" }}>
                      {selectedStation.name.slice(0, 3)}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold" style={{ color: "var(--forest)" }}>
                      {selectedStation.name}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                      {[selectedStation.countryCode, selectedStation.region, selectedStation.language].filter(Boolean).join(" • ") || "Global"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <VerificationBadge
                    reliability={selectedStation.status?.toLowerCase() === "online" ? 90 : selectedStation.status?.toLowerCase() === "offline" ? 10 : 50}
                    label="Health"
                    size="sm"
                  />
                  <LicenseModal
                    license="Public broadcast — confirm reuse with source"
                    title={selectedStation.name}
                    author="Station operator"
                    sourceName={selectedStation.name}
                    licenseUrl={selectedStation.websiteUrl ?? undefined}
                    contactEmail={selectedStation.rightsContact ?? undefined}
                    dataCy="radio-license-aside"
                  />
                  <button
                    type="button"
                    onClick={() => copyStream(selectedStation.streamUrl)}
                    className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ borderColor: "var(--border)", color: "var(--forest)" }}
                    disabled={!selectedHasStream}
                  >
                    Copy stream URL
                  </button>
                  {selectedHasStream && (
                    <a
                      href={selectedStation.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5"
                      style={{ borderColor: "var(--border)", color: "var(--forest)" }}
                    >
                      Open external
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  <span>Last checked: {selectedStation.lastCheckedAt ? new Date(selectedStation.lastCheckedAt).toLocaleString() : "Unknown"}</span>
                  <span>{selectedStation.failureCount ? `${selectedStation.failureCount} failures` : "Stable"}</span>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                  {selectedStation.notes || "Schedule data not provided. Visit station profile for more info."}
                </p>

                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                  {selectedStation.websiteUrl && (
                    <a href={selectedStation.websiteUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--forest)" }}>
                      Source site
                    </a>
                  )}
                  <Link href={`/radio/${selectedStation.slug}`} className="underline" style={{ color: "var(--forest)" }}>
                    Station profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => playStation(selectedStation)}
                    className="rounded-full bg-[var(--forest)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!selectedHasStream}
                  >
                    {selectedHasStream ? "Listen live" : "Stream pending"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Select a station to view details.
              </p>
            )}
          </aside>
      </section>
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-[rgba(247,243,235,0.95)] shadow-[0_-10px_30px_-20px_rgba(0,0,0,0.35)]"
        role="complementary"
        aria-label="Sticky radio player"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex flex-1 flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              {nowPlaying ? "Now playing" : "Select a station to start listening"}
            </p>
            <p className="text-sm font-bold" style={{ color: "var(--forest)" }}>
              {nowPlaying ? nowPlaying.name : "No station selected"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!nowPlaying) return;
                if (audioRef.current?.paused) {
                  audioRef.current.play();
                } else {
                  audioRef.current?.pause();
                }
              }}
              className="rounded-full bg-[var(--forest)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest)]"
              aria-label={isPlaying ? "Pause playback" : "Play"}
              disabled={!nowPlaying}
              data-cy="radio-mini-toggle"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.volume = Math.min(1, (audioRef.current.volume || 0.5) + 0.1);
              }}
              className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: "var(--border)", color: "var(--forest)" }}
              disabled={!nowPlaying}
              data-cy="radio-mini-volume-up"
            >
              Vol +
            </button>
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.volume = Math.max(0, (audioRef.current.volume || 0.5) - 0.1);
              }}
              className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: "var(--border)", color: "var(--forest)" }}
              disabled={!nowPlaying}
              data-cy="radio-mini-volume-down"
            >
              Vol -
            </button>
            {nowPlaying?.slug && (
              <Link
                href={`/radio/${nowPlaying.slug}`}
                className="text-xs font-semibold uppercase tracking-[0.18em] underline"
                style={{ color: "var(--forest)" }}
              >
                Open profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
