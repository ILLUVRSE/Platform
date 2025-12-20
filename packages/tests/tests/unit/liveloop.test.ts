import { describe, expect, it } from "vitest";
import { buildLiveLoopSchedule, mapLiveLoopEvents } from "../../../apps/web/src/app/liveloop/page";

describe("LiveLoop helpers", () => {
  it("maps 24h schedule and marks on-air/next by UTC hour", () => {
    const now = new Date(Date.UTC(2024, 0, 1, 5, 0, 0));
    const { schedule, onAirSlot, nextSlot } = buildLiveLoopSchedule(1, now);

    expect(schedule).toHaveLength(1);
    expect(onAirSlot?.window).toBe("05:00–06:00");
    expect(nextSlot?.window).toBe("06:00–07:00");

    const events = mapLiveLoopEvents(schedule);
    expect(events).toHaveLength(24);
    expect(events[5].status).toBe("live");
    expect(events[5].time).toContain("05:00–06:00");
    expect(events[6].status).toBe("upcoming");
  });
});
