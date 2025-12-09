"use client";

import { useMemo } from "react";
import { Card, PageSection, Pill } from "@illuvrse/ui";

type Slot = {
  window: string;
  status: "live" | "upcoming" | "completed";
};

type DaySchedule = {
  dayLabel: string;
  slots: Slot[];
};

function pad(num: number) {
  return String(num).padStart(2, "0");
}

export function buildLiveLoopSchedule(days = 1, now: Date = new Date()) {
  const onAirHour = now.getUTCHours();
  const schedule: DaySchedule[] = [];

  for (let d = 0; d < days; d++) {
    const slots: Slot[] = [];
    for (let h = 0; h < 24; h++) {
      const start = pad(h);
      const end = pad((h + 1) % 24);
      let status: Slot["status"] = "upcoming";
      if (d === 0) {
        if (h === onAirHour) status = "live";
        else if (h < onAirHour) status = "completed";
      }
      slots.push({ window: `${start}:00–${end}:00`, status });
    }
    schedule.push({ dayLabel: `Day ${d + 1}`, slots });
  }

  const onAirSlot = schedule[0]?.slots[onAirHour];
  const nextSlot = schedule[0]?.slots[(onAirHour + 1) % 24];

  return { schedule, onAirSlot, nextSlot };
}

export function mapLiveLoopEvents(schedule: DaySchedule[]) {
  const events: { time: string; status: Slot["status"]; day: string }[] = [];
  schedule.forEach((day) => {
    day.slots.forEach((slot) => {
      events.push({ time: `${day.dayLabel} · LiveLoop (UTC) · ${slot.window}`, status: slot.status, day: day.dayLabel });
    });
  });
  return events;
}

export default function LiveLoopPage() {
  const now = useMemo(() => new Date(), []);
  const { schedule, onAirSlot } = buildLiveLoopSchedule(1, now);
  const events = mapLiveLoopEvents(schedule);
  const hourLabel = `LiveLoop · ${pad(now.getUTCHours())}:00`;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-gold-500/20 text-gold-100">LiveLoop</Pill>
        <h1 className="mt-3 text-3xl font-semibold">{hourLabel}</h1>
        <p className="mt-2 max-w-2xl text-slate-200/85">
          24/7 LiveLoop stream. Current UTC hour is marked Live; next hour is Upcoming. Slots roll forward automatically.
        </p>
        {onAirSlot ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-100">
            Live now · {onAirSlot.window}
          </div>
        ) : null}
      </section>

      <PageSection eyebrow="Day 1 · LiveLoop (UTC)" title="Schedule">
        <div className="grid gap-3 md:grid-cols-3">
          {events.map((event, idx) => {
            const isLive = event.status === "live";
            const isUpcoming = event.status === "upcoming";
            return (
              <Card
                key={idx}
                title={event.time}
                body={
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isLive
                          ? "bg-emerald-500/30 text-emerald-100"
                          : isUpcoming
                            ? "bg-gold-500/30 text-gold-100"
                            : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {isLive ? "Live" : isUpcoming ? "Upcoming" : "Completed"}
                    </span>
                  </div>
                }
              />
            );
          })}
        </div>
      </PageSection>
    </div>
  );
}
