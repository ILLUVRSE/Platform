"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const regions = [
  { value: "WORLD", label: "World" },
  { value: "NA", label: "North America" },
  { value: "EU", label: "Europe" },
  { value: "AS", label: "Asia" },
  { value: "AF", label: "Africa" },
  { value: "SA", label: "South America" },
  { value: "OC", label: "Oceania" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
  { value: "zh", label: "中文" },
];

export function RegionLanguageBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentRegion = searchParams.get("region") || "WORLD";
  const currentLang = searchParams.get("lang") || "en";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (!searchParams.get("region")) {
      updateParam("region", currentRegion);
    }
    if (!searchParams.get("lang")) {
      updateParam("lang", currentLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const regionOptions = useMemo(() => regions, []);
  const langOptions = useMemo(() => languages, []);

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-sm"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
      aria-live="polite"
      data-cy="region-language-bar"
    >
      <label className="flex items-center gap-2">
        <span style={{ color: "var(--muted)" }}>Region:</span>
        <select
          value={currentRegion}
          onChange={(e) => updateParam("region", e.target.value)}
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-cream,var(--cream))]"
          style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
          aria-label="Select region"
        >
          {regionOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span style={{ color: "var(--muted)" }}>Language:</span>
        <select
          value={currentLang}
          onChange={(e) => updateParam("lang", e.target.value)}
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-cream,var(--cream))]"
          style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--forest)" }}
          aria-label="Select language"
        >
          {langOptions.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] sm:inline">
        Showing {currentRegion} / {currentLang.toUpperCase()}
      </span>
    </div>
  );
}
