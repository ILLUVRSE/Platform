import Link from "next/link";
import clsx from "clsx";

type TagChipProps = {
  label: string;
  count?: number | string;
  href?: string;
  active?: boolean;
  muted?: boolean;
  className?: string;
  ariaLabel?: string;
  dataCy?: string;
  hideCount?: boolean;
};

/**
 * Rounded tag pill used across article cards, filters, and hero chips.
 * Keeps styling centralized so we can swap themes without touching markup.
 */
export function TagChip({
  label,
  count,
  href,
  active,
  muted,
  className,
  ariaLabel,
  dataCy,
  hideCount,
}: TagChipProps) {
  const computedLabel = ariaLabel ?? `${label}${count ? `, ${count} items` : ""}`;
  const content = (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
        active
          ? "shadow-[0_10px_30px_-12px_rgba(33,49,45,0.35)]"
          : "hover:-translate-y-0.5 hover:shadow-sm",
        muted && !active && "opacity-70",
        className,
      )}
      style={{
        borderColor: active ? "var(--forest)" : "var(--border)",
        background: active ? "var(--forest)" : "var(--bg-cream, var(--cream))",
        color: active ? "var(--white, #fff)" : "var(--forest)",
      }}
      aria-label={computedLabel}
      data-cy={dataCy}
    >
      <span>{label}</span>
      {typeof count !== "undefined" && !hideCount && <small className="text-[10px] opacity-80">({count})</small>}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-cream,var(--cream))]"
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return content;
}
