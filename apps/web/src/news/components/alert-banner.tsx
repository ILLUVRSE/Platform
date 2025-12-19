"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Alert = {
  id: string;
  message: string;
  region?: string | null;
  severity?: "info" | "warning" | "critical";
};

export function AlertBanner({ region }: { region?: string | null }) {
  const searchParams = useSearchParams();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedId = sessionStorage.getItem("dismissedAlertId");
    const activeRegion = region || searchParams.get("region") || "WORLD";
    fetch(`/news/api/alerts${activeRegion ? `?region=${activeRegion}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        const first = data?.alerts?.find(
          (a: Alert) => !activeRegion || !a.region || a.region === activeRegion || a.region === "WORLD",
        );
        if (first && first.id !== dismissedId) {
          setAlert(first);
        }
      })
      .catch(() => {
        /* silent */
      });
  }, [region, searchParams]);

  if (!alert || dismissed) return null;
  const liveMode = alert.severity === "critical" ? "assertive" : "polite";
  const tone =
    alert.severity === "critical"
      ? { bg: "#b91c1c", text: "#fff", border: "#fecdd3" }
      : alert.severity === "warning"
        ? { bg: "#d97706", text: "#fff", border: "#fed7aa" }
        : { bg: "var(--forest)", text: "#fff", border: "#c5f1d4" };

  return (
    <div
      role={alert.severity === "critical" ? "alert" : "status"}
      aria-live={liveMode}
      className="flex items-center justify-between px-4 py-3 text-sm shadow-[0_10px_30px_-18px_rgba(0,0,0,0.3)]"
      style={{ background: tone.bg, color: tone.text, borderBottom: `1px solid ${tone.border}` }}
      data-cy="global-alert"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex items-center rounded-full bg-black/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
          aria-label={`Alert severity ${alert.severity ?? "info"}`}
        >
          {alert.severity === "critical" ? "Critical" : alert.severity === "warning" ? "Warning" : "Info"}
        </span>
        <span className="text-xs uppercase tracking-[0.18em] opacity-80">
          Region: {alert.region || region || searchParams.get("region") || "WORLD"}
        </span>
        <span>{alert.message}</span>
      </div>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem("dismissedAlertId", alert.id);
        }}
        className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(0,0,0,0.2)]"
        aria-label="Dismiss alert"
      >
        Dismiss
      </button>
    </div>
  );
}
