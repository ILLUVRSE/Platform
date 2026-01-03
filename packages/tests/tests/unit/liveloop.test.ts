import { describe, expect, it } from "vitest";
import { generateLiveLoopSchedule, mapLiveLoopEvents } from "@web/app/studio/liveloop/utils";

describe("LiveLoop helpers", () => {
  it("maps 24h schedule and marks on-air/next by UTC hour", () => {
    const now = new Date(Date.UTC(2024, 0, 1, 18, 30, 0));
    const baseSchedule = generateLiveLoopSchedule();
    const { schedule, onAirSlot, nextSlot } = mapLiveLoopEvents(baseSchedule, now);

    expect(schedule).toHaveLength(baseSchedule.length);
    expect(onAirSlot?.status).toBe("on-air");
    expect(onAirSlot?.title).toContain("Gilda");
    expect(nextSlot?.status).toBe("next");
    expect(nextSlot?.window).toContain("19");
  });
});
