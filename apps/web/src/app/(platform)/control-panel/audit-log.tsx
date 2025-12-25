"use client";

import { useEffect, useState } from "react";

type AuditEvent = { id: string; message: string; timestamp: number; actor?: string };

export function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => setEvents(data.events ?? []))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <div className="text-sm text-rose-600">Audit error: {error}</div>;

  return (
    <div className="space-y-2 text-sm text-slate-700">
      {events.map((evt) => (
        <div
          key={evt.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div>
            <div className="font-semibold text-slate-900">{evt.message}</div>
            <div className="text-[11px] text-slate-500">
              {evt.actor ? `${evt.actor} · ` : ""}
              {new Date(evt.timestamp).toLocaleString()}
            </div>
          </div>
          <span className="text-[11px] text-slate-400">{evt.id}</span>
        </div>
      ))}
    </div>
  );
}
