export type LiveLoopSlot = {
  id: string;
  window: string;
  title: string;
  focus: string;
  proof: string;
  asset: string;
  thumbnail?: string;
  status?: "on-air" | "next";
  startMinutes: number;
  endMinutes: number;
};

const BEVERLY_ASSETS = [
  "/00efdd5717132ce3a95944dd2f83dba6-360p.mp4",
  "/0570d5a39fca358ee78cd3a7e3b1b30e-360p.mp4",
  "/10ad753894979bff8863a9b94d63b770-360p.mp4",
  "/24e066e09cdc6be412932c8d4931be82-360p.mp4",
  "/2fcaae33bcc4b2493c90edf2d409888a-360p.mp4",
  "/3073e2bea35d23e0a2c9f271223a7dcb-360p.mp4"
];

const MOVIE_ASSETS = {
  gilda: encodeURI("/Gilda 1946.mp4"),
  royalWedding: "/royal_wedding.mp4",
  casablanca: encodeURI(
    "/Casablanca 1942, in color, Humphrey Bogart, Ingrid Bergman, Paul Henreid, Claude Rains, Sydney Greenstreet, Peter Lorre, Dooley Wilson,.mp4"
  )
};

const minutesToLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const makeSlot = (startMinutes: number, endMinutes: number, overrides: Partial<LiveLoopSlot> = {}): LiveLoopSlot => ({
  id: `slot-${startMinutes}`,
  startMinutes,
  endMinutes,
  window: `${minutesToLabel(startMinutes)}–${minutesToLabel(endMinutes % (24 * 60))}`,
  title: "LiveLoop Block",
  focus: "Featured content",
  proof: `lv:${startMinutes}`,
  asset: "",
  ...overrides
});

export function generateLiveLoopSchedule(): LiveLoopSlot[] {
  const GILDA_DURATION_MIN = 110;
  const ROYAL_DURATION_MIN = 93;
  const CASABLANCA_DURATION_MIN = 102;

  const gildaStart = 18 * 60; // local 18:00
  const gildaEnd = gildaStart + GILDA_DURATION_MIN; // 19:50
  const royalStart = gildaEnd; // immediately after Gilda
  const royalEnd = royalStart + ROYAL_DURATION_MIN; // 21:23
  const casaStart = royalEnd; // immediately after Royal Wedding
  const casaEnd = casaStart + CASABLANCA_DURATION_MIN; // 23:05

  const slots: LiveLoopSlot[] = [
    makeSlot(0, gildaStart, {
      title: "The Beverly Hillbillies — Marathon",
      focus: "Nonstop episodes — no commercials",
      proof: "bh:day",
      asset: BEVERLY_ASSETS[0]
    }),
    makeSlot(gildaStart, gildaEnd, {
      title: "Gilda (1946)",
      focus: "Prime-time feature — uninterrupted",
      proof: "mv:gilda",
      asset: MOVIE_ASSETS.gilda,
      thumbnail: "/Gilda_itemimage.jpg"
    }),
    makeSlot(royalStart, royalEnd, {
      title: "The Royal Wedding (1951)",
      focus: "Prime-time feature — uninterrupted",
      proof: "mv:royal-wedding",
      asset: MOVIE_ASSETS.royalWedding
    }),
    makeSlot(casaStart, casaEnd, {
      title: "Casablanca (Color Edition)",
      focus: "Prime-time feature — uninterrupted",
      proof: "mv:casablanca",
      asset: MOVIE_ASSETS.casablanca,
      thumbnail: encodeURI("/__ia_thumb.jpg")
    }),
    makeSlot(casaEnd, 24 * 60, {
      title: "The Beverly Hillbillies — Overnight",
      focus: "Wind down with the Clampetts",
      proof: "bh:overnight",
      asset: BEVERLY_ASSETS[1 % BEVERLY_ASSETS.length]
    })
  ];

  return slots;
}

export function mapLiveLoopEvents(slots: LiveLoopSlot[], now: Date | number = new Date()) {
  const nowMinutes = typeof now === "number" ? now : now.getHours() * 60 + now.getMinutes();
  let onAirIndex = -1;
  const schedule = slots.map((s, idx) => {
    const isOnAir = nowMinutes >= s.startMinutes && nowMinutes < s.endMinutes;
    if (isOnAir) onAirIndex = idx;
    const prevEnd = slots[idx === 0 ? slots.length - 1 : idx - 1].endMinutes;
    const isNext = !isOnAir && nowMinutes >= prevEnd && nowMinutes < s.startMinutes;
    return { ...s, status: isOnAir ? "on-air" : isNext ? "next" : undefined };
  });

  const onAirSlot = schedule.find((s) => s.status === "on-air");
  let nextSlot = schedule.find((s) => s.status === "next");
  if (!nextSlot && onAirIndex >= 0) {
    const nextIndex = (onAirIndex + 1) % schedule.length;
    const marked = { ...schedule[nextIndex], status: "next" as const };
    schedule[nextIndex] = marked;
    nextSlot = marked;
  }

  return { schedule, onAirSlot, nextSlot };
}
