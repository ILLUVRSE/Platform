import clsx from "clsx";

export function VerificationBadge({
  reliability,
  label = "Verified",
  sourceHref,
  size = "md",
}: {
  reliability?: number | null;
  label?: string;
  sourceHref?: string | null;
  size?: "sm" | "md";
}) {
  if (typeof reliability !== "number") return null;
  const tone = reliability >= 80 ? "var(--forest)" : reliability >= 60 ? "#d97706" : "#b91c1c";
  const descriptor = reliability >= 80 ? "High" : reliability >= 60 ? "Moderate" : "Low";
  const labelText = `${label}: ${descriptor} confidence (${reliability}/100)`;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold uppercase tracking-[0.18em]",
        size === "sm" ? "text-[10px]" : "text-[11px]",
      )}
      style={{ borderColor: "var(--border)", background: "var(--panel)", color: tone }}
      aria-label={labelText}
      title={`${labelText}. Click to view source profile.`}
    >
      ● {label} {descriptor}
      {sourceHref && (
        <a
          href={sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          aria-label="Open source profile"
        >
          Source
        </a>
      )}
    </span>
  );
}
