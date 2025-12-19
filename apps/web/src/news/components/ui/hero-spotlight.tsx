import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { TagChip } from "./tag-chip";
import { VerificationBadge } from "./verification-badge";
import { LicenseChip } from "./license-chip";
import { ShareActions } from "./share-actions";

type Action = { label: string; href: string };

type HeroSpotlightProps = {
  eyebrow?: string;
  title: string;
  kicker?: string;
  summary?: string;
  imageUrl?: string;
  imageAlt?: string;
  tags?: Array<{ label: string; href?: string; count?: number; hideCount?: boolean }>;
  primaryAction?: Action;
  secondaryAction?: Action;
  meta?: ReactNode;
  supporting?: ReactNode;
  author?: string;
  dateLabel?: string;
  readTime?: string;
  reliability?: number | null;
  license?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  regionLabel?: string | null;
  languageLabel?: string | null;
  shareUrl?: string | null;
};

/**
 * Magazine-style spotlight panel for the top of the page.
 * Accepts optional background image, meta, and tag chips for quick navigation.
 */
export function HeroSpotlight({
  eyebrow,
  title,
  kicker,
  summary,
  imageUrl,
  imageAlt,
  tags,
  primaryAction,
  secondaryAction,
  meta,
  supporting,
  author,
  dateLabel,
  readTime,
  reliability,
  license,
  sourceName,
  sourceUrl,
  regionLabel,
  languageLabel,
  shareUrl,
}: HeroSpotlightProps) {
  const primaryTextColor = imageUrl ? "var(--white, #fff)" : "var(--forest)";
  const secondaryTextColor = imageUrl ? "rgba(255,255,255,0.9)" : "var(--text)";
  const supportingBg = imageUrl ? "rgba(16,20,19,0.6)" : "var(--panel)";
  const supportingBorder = imageUrl ? "rgba(255,255,255,0.22)" : "var(--border)";
  const supportingHeadingColor = imageUrl ? "rgba(255,255,255,0.7)" : "var(--muted)";
  const supportingBodyColor = imageUrl ? "rgba(255,255,255,0.9)" : "var(--text)";
  return (
    <section
      className="relative overflow-hidden rounded-3xl border shadow-[0_25px_80px_-60px_rgba(33,49,45,0.35)]"
      style={{
        borderColor: "var(--border)",
        background: imageUrl
          ? "linear-gradient(180deg, rgba(12,17,16,0.72), rgba(12,17,16,0.78))"
          : "linear-gradient(135deg, rgba(247,243,235,0.95), rgba(240,240,232,0.92))",
      }}
      role="region"
      aria-label="Top story spotlight"
      data-cy="hero-spotlight"
    >
      {imageUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(7,10,9,0.85)] via-[rgba(7,10,9,0.72)] to-[rgba(7,10,9,0.55)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,10,9,0.65)] via-transparent to-transparent" />
          <Image
            src={imageUrl}
            alt={imageAlt ?? ""}
            fill
            className="object-cover"
            style={{ filter: "saturate(1.05)", opacity: 0.82 }}
            sizes="100vw"
            priority
          />
        </div>
      )}

      <div className="relative z-10 grid gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-12">
        <div className="space-y-4">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.76)" }}>
              {eyebrow}
            </p>
          )}
          <h1
            className="text-4xl font-black leading-tight md:text-5xl"
            style={{
              color: primaryTextColor,
              textShadow: imageUrl ? "0 6px 24px rgba(0,0,0,0.35)" : undefined,
            }}
          >
            {title}
          </h1>
          {kicker && (
            <p className="text-lg font-semibold" style={{ color: secondaryTextColor }}>
              {kicker}
            </p>
          )}
          {summary && (
            <p className="max-w-2xl text-base leading-relaxed" style={{ color: secondaryTextColor }}>
              {summary}
            </p>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1" aria-label="Top tags">
              {tags.map((tag) => (
                <TagChip
                  key={tag.label}
                  label={tag.label}
                  count={tag.count}
                  hideCount={tag.hideCount}
                  href={tag.href}
                  active={imageUrl ? false : undefined}
                  muted
                  ariaLabel={`${tag.label}${tag.count ? `, ${tag.count} stories` : ""}`}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {primaryAction && (
              <Link
                href={primaryAction.href}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] shadow-md transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(7,10,9,0.8)]"
                style={{ background: "var(--forest)", color: "var(--white, #fff)" }}
              >
                {primaryAction.label} →
              </Link>
            )}
            {secondaryAction && (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(7,10,9,0.8)]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-cream, var(--cream))",
                  color: "var(--forest)",
                }}
              >
                {secondaryAction.label} →
              </Link>
            )}
            {meta}
          </div>

          <div
            className="flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: imageUrl ? "rgba(255,255,255,0.82)" : "var(--muted)" }}
          >
            {author && <span>{author}</span>}
            {dateLabel && <span aria-label={`Published ${dateLabel}`}>{dateLabel}</span>}
            {readTime && <span aria-label={`Estimated read time ${readTime}`}>{readTime}</span>}
            {regionLabel && <span aria-label={`Region ${regionLabel}`}>{regionLabel}</span>}
            {languageLabel && <span aria-label={`Language ${languageLabel}`}>{languageLabel}</span>}
          </div>
        </div>

        <div
          className="flex flex-col justify-between gap-4 rounded-2xl border p-6 shadow-lg backdrop-blur md:p-7"
          style={{ borderColor: supportingBorder, background: supportingBg }}
        >
          {supporting ?? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: supportingHeadingColor }}>
                Verification & Sources
              </p>
              <div className="flex flex-wrap gap-2">
                <VerificationBadge reliability={reliability} />
                <LicenseChip license={license} />
              </div>
              <div className="space-y-2 text-sm leading-relaxed" style={{ color: supportingBodyColor }}>
                <p>
                  {sourceName ? "Source:" : "Provenance"}{" "}
                  {sourceName
                    ? sourceUrl
                      ? (
                        <Link
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-[var(--forest)] decoration-2 underline-offset-4"
                        >
                          {sourceName}
                        </Link>
                        )
                      : (
                        <span className="font-semibold">{sourceName}</span>
                        )
                    : (
                      "Verified feed"
                    )}
                </p>
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Open data-first: badges reflect automated reliability scoring. Tap through for provenance and license terms.
                </p>
              </div>
              {shareUrl && (
                <div className="pt-2">
                  <ShareActions url={shareUrl} title={title} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
