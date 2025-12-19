"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, RefObject } from "react";

type ChannelTile = {
  title: string;
  href: string;
  thumbnail?: string;
  live?: boolean;
  meta?: string;
  badge?: string;
  description?: string;
};

type ChannelRow = {
  title: string;
  items: ChannelTile[];
  ctaLabel?: string;
  ctaHref?: string;
};

type ChannelGridProps = {
  rows: ChannelRow[];
};

function scrollRow(rowRef: RefObject<HTMLDivElement | null>, direction: "left" | "right") {
  if (!rowRef.current) return;
  const delta = direction === "left" ? -320 : 320;
  rowRef.current.scrollBy({ left: delta, behavior: "smooth" });
}

/**
 * Roku-style grid of horizontal carousels with keyboard and button nav.
 */
export function ChannelGrid({ rows }: ChannelGridProps) {
  return (
    <div className="space-y-10">
      {rows.map((row) => (
        <ChannelRowView key={row.title} row={row} />
      ))}
    </div>
  );
}

function ChannelRowView({ row }: { row: ChannelRow }) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--text)" }}>
            {row.title}
          </h2>
          {row.ctaLabel && row.ctaHref && (
            <Link href={row.ctaHref} className="text-xs font-semibold uppercase tracking-[0.2em] hover:opacity-70" style={{ color: "var(--forest)" }}>
              {row.ctaLabel} →
            </Link>
          )}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollRow(rowRef, "left")}
            className="rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:-translate-y-0.5 hover:shadow-sm"
            style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollRow(rowRef, "right")}
            className="rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:-translate-y-0.5 hover:shadow-sm"
            style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="channel-row flex gap-4 overflow-x-auto pb-3"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {row.items.map((item) => (
          <ChannelTile key={item.title} tile={item} />
        ))}
      </div>
    </section>
  );
}

function ChannelTile({ tile }: { tile: ChannelTile }) {
  return (
    <Link
      href={tile.href}
      className="channel-tile group relative flex min-w-[220px] flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-cream,var(--cream))]"
      style={{ borderColor: "var(--border)", background: "var(--panel)", scrollSnapAlign: "start" }}
      onKeyDown={(e) => {
        if (!e.currentTarget.parentElement) return;
        const siblings = Array.from(e.currentTarget.parentElement.querySelectorAll<HTMLElement>("[data-channel-tile='true']"));
        const currentIndex = siblings.indexOf(e.currentTarget);
        if (e.key === "ArrowRight" && currentIndex < siblings.length - 1) {
          e.preventDefault();
          siblings[currentIndex + 1]?.focus();
        }
        if (e.key === "ArrowLeft" && currentIndex > 0) {
          e.preventDefault();
          siblings[currentIndex - 1]?.focus();
        }
      }}
      data-channel-tile="true"
    >
      {tile.thumbnail && (
        <div className="relative h-32 w-full overflow-hidden">
          <Image
            src={tile.thumbnail}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 260px, 70vw"
          />
          {tile.live && (
            <span className="live-badge absolute right-3 top-3 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "#e63946", color: "#fff" }}>
              Live
            </span>
          )}
          {tile.badge && !tile.live && (
            <span className="absolute right-3 top-3 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "var(--forest)", color: "var(--white, #fff)" }}>
              {tile.badge}
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgba(0,0,0,0.45)] to-transparent opacity-0 transition group-hover:opacity-70" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          {tile.meta && <span>{tile.meta}</span>}
          {tile.live && <span className="text-[var(--forest)]">● Live</span>}
        </div>
        <h3 className="text-lg font-bold leading-tight transition group-hover:text-[var(--forest)]" style={{ color: "var(--text)" }}>
          {tile.title}
        </h3>
        {tile.description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
            {tile.description}
          </p>
        )}
      </div>
    </Link>
  );
}
