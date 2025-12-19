import clsx from "clsx";

export function LicenseChip({ license }: { license?: string | null }) {
  if (!license) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
      )}
      style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
    >
      License: {license}
    </span>
  );
}
