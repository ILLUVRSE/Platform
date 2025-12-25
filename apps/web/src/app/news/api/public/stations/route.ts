import { NextResponse } from "next/server";
import prisma from "@news/lib/prisma";

type LiveLoopFallbackStation = {
  name: string;
  slug: string;
  streamUrl: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  language?: string | null;
  genre?: string | null;
  bitrate?: number | null;
  codec?: string | null;
  status?: string | null;
  notes?: string | null;
  matchTokens?: string[];
};

const liveloopFallbackStations: LiveLoopFallbackStation[] = [
  {
    name: "NPR News",
    slug: "npr-news",
    streamUrl: "https://npr-ice.streamguys1.com/live.mp3",
    websiteUrl: "https://www.npr.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/NPR_logo.svg/320px-NPR_logo.svg.png",
    countryCode: "US",
    genre: "News",
    bitrate: 128,
    codec: "mp3",
    status: "unknown",
    matchTokens: ["npr"],
  },
  {
    name: "Deutschlandfunk",
    slug: "deutschlandfunk",
    streamUrl: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    websiteUrl: "https://www.deutschlandfunk.de/",
    countryCode: "DE",
    region: "EU",
    genre: "News",
    bitrate: 128,
    codec: "mp3",
    status: "unknown",
    matchTokens: ["deutschlandfunk", "dlf"],
  },
  {
    name: "BBC World Service",
    slug: "bbc-world-service",
    streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    websiteUrl: "https://www.bbc.co.uk/sounds/play/live:bbc_world_service",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/9/9c/BBC_World_Service_logo.png",
    countryCode: "GB",
    region: "EU",
    genre: "News",
    bitrate: 128,
    codec: "mp3",
    status: "unknown",
  },
  {
    name: "Radio France Internationale",
    slug: "radio-france-internationale",
    streamUrl: "https://stream11.tdiradio.com/rfi/rfia/francais/mp3-128/rfia.mp3",
    websiteUrl: "https://www.rfi.fr/",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Logo_RFI.svg/320px-Logo_RFI.svg.png",
    countryCode: "FR",
    region: "EU",
    genre: "News",
    bitrate: 128,
    codec: "mp3",
    status: "unknown",
  },
  {
    name: "Voice of Nigeria",
    slug: "voice-of-nigeria",
    streamUrl: "",
    websiteUrl: "https://voiceofnigeria.gov.ng/",
    countryCode: "NG",
    region: "AF",
    genre: "News",
    status: "unknown",
    notes: "Syndication target. Stream URL pending.",
  },
  {
    name: "All India Radio External Services",
    slug: "all-india-radio-external-services",
    streamUrl: "",
    websiteUrl: "https://www.newsonair.gov.in/",
    countryCode: "IN",
    region: "AS",
    genre: "News",
    status: "unknown",
    notes: "Syndication target. Stream URL pending.",
    matchTokens: ["all india radio", "akashvani"],
  },
  {
    name: "Channel Africa",
    slug: "channel-africa",
    streamUrl: "",
    websiteUrl: "https://www.sabc.co.za/",
    countryCode: "ZA",
    region: "AF",
    genre: "News",
    status: "unknown",
    notes: "Syndication target. Stream URL pending.",
  },
  {
    name: "VOV1 News",
    slug: "vov1-news",
    streamUrl: "https://str.vov.gov.vn/vovlive/vov1vov5Vietnamese.sdp_aac/playlist.m3u8",
    websiteUrl: "https://vovworld.vn/",
    countryCode: "VN",
    region: "AS",
    genre: "News",
    bitrate: 128,
    codec: "aac",
    status: "unknown",
    matchTokens: ["vov1", "voice of vietnam"],
  },
  {
    name: "VOV5 International",
    slug: "vov5-international",
    streamUrl: "https://stream.vovmedia.vn/vov5",
    websiteUrl: "https://vovworld.vn/",
    countryCode: "VN",
    region: "AS",
    genre: "News",
    bitrate: 128,
    codec: "aac",
    status: "unknown",
    matchTokens: ["vov5", "voice of vietnam"],
  },
];

function normalizeFallbackStation(station: LiveLoopFallbackStation) {
  return {
    id: `liveloop-${station.slug}`,
    name: station.name,
    slug: station.slug,
    streamUrl: station.streamUrl,
    websiteUrl: station.websiteUrl ?? null,
    logoUrl: station.logoUrl ?? null,
    countryCode: station.countryCode ?? null,
    region: station.region ?? null,
    city: station.city ?? null,
    language: station.language ?? null,
    genre: station.genre ?? null,
    bitrate: station.bitrate ?? null,
    codec: station.codec ?? null,
    status: station.status ?? "unknown",
    lastCheckedAt: null,
    failureCount: 0,
    isPublic: true,
    notes: station.notes ?? null,
    updatedAt: new Date(),
  };
}

export async function GET() {
  const stations = await prisma.station.findMany({
    where: { isPublic: true },
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      streamUrl: true,
      websiteUrl: true,
      logoUrl: true,
      countryCode: true,
      region: true,
      city: true,
      language: true,
      genre: true,
      bitrate: true,
      codec: true,
      status: true,
      lastCheckedAt: true,
      failureCount: true,
      isPublic: true,
      notes: true,
      updatedAt: true,
    },
  });

  const existingSlugs = new Set(stations.map((station) => station.slug.toLowerCase()));
  const existingHaystack = stations.map((station) =>
    `${station.name} ${station.slug}`.toLowerCase(),
  );
  const fallbackStations = liveloopFallbackStations
    .filter((station) => {
      if (existingSlugs.has(station.slug.toLowerCase())) return false;
      if (
        station.matchTokens?.some((token) =>
          existingHaystack.some((hay) => hay.includes(token.toLowerCase())),
        )
      ) {
        return false;
      }
      return true;
    })
    .map(normalizeFallbackStation);

  return NextResponse.json({ stations: [...stations, ...fallbackStations] });
}
