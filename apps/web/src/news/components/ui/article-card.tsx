import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { TagChip } from "./tag-chip";
import { VerificationBadge } from "./verification-badge";
import { LicenseChip } from "./license-chip";

type ArticleTag = { label: string; href?: string };

type ArticleCardProps = {
  title: string;
  href: string;
  excerpt?: string;
  dateLabel?: string;
  author?: string;
  readTime?: string;
  imageUrl?: string;
  tags?: ArticleTag[];
  license?: string | null;
  reliability?: number | null;
  layout?: "vertical" | "horizontal";
  showBorder?: boolean;
  live?: boolean;
};

/**
 * Editorial card used for news/feature listings and home page grids.
 * Keeps a consistent hierarchy: date/kicker → headline → excerpt → tags/meta.
 */
export function ArticleCard({
  title,
  href,
  excerpt,
  dateLabel,
  author,
  readTime,
  imageUrl,
  tags,
  license,
  reliability,
  layout = "vertical",
  showBorder = true,
  live,
}: ArticleCardProps) {
  return (
    <article
      className={clsx(
        "group flex h-full rounded-2xl transition hover:-translate-y-1 hover:shadow-lg",
        layout === "horizontal" ? "flex-row gap-4" : "flex-col",
      )}
      style={{
        background: "var(--panel)",
        border: showBorder ? `1px solid var(--border)` : "none",
      }}
    >
      <Link
        href={href}
        className={clsx("flex flex-1", layout === "horizontal" ? "flex-row gap-4" : "flex-col")}
        aria-label={title}
      >
        {imageUrl && (
          <div
            className={clsx(
              "relative overflow-hidden",
              layout === "horizontal" ? "h-40 w-48 flex-shrink-0 rounded-xl" : "h-52 w-full rounded-t-2xl",
            )}
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 320px, 100vw"
            />
            {live && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "#e63946", color: "#fff" }}>
                ● Live
              </span>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.35)] to-transparent opacity-0 transition group-hover:opacity-60" />
          </div>
        )}

        <div className="flex h-full flex-1 flex-col gap-3 p-4">
          <div className="space-y-1">
            {(dateLabel || author || readTime) && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                {[dateLabel, author, readTime].filter(Boolean).join(" • ")}
              </p>
            )}
            <h3 className="text-xl font-black leading-snug transition group-hover:text-[var(--forest)]" style={{ color: "var(--text)" }}>
              {title}
            </h3>
            {excerpt && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                {excerpt}
              </p>
            )}
            {(license || typeof reliability === "number") && (
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                <LicenseChip license={license ?? undefined} />
                <VerificationBadge reliability={reliability} />
              </div>
            )}
          </div>
        </div>
      </Link>

      {!!tags?.length && (
        <div className="mt-auto flex flex-wrap gap-2 px-4 pb-4">
          {tags.map((tag) => (
            <TagChip key={tag.label} label={tag.label} href={tag.href} muted />
          ))}
        </div>
      )}
    </article>
  );
}
