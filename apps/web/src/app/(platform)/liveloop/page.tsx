import LiveLoopClient from "./LiveLoopClient";
import { playlist as defaultPlaylist } from "@studio/lib/liveloopData";
import prisma from "@news/lib/prisma";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 60;

const title = "LiveLoop | ILLUVRSE channel guide";
const description =
  "LiveLoop is the channel guide for StorySphere, LiveLoop, News, Radio, and LiveStreams with proof-backed slots and schedule visibility.";
const pageUrl = "https://www.illuvrse.com/liveloop";

export const metadata = buildMetadata({
  title,
  description,
  path: "/liveloop"
});

const onAirItem = defaultPlaylist.find((item) => item.status === "On Air") ?? defaultPlaylist[0];
const nowIso = new Date().toISOString();
const nextHourIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();

const liveLoopJsonLd = {
  "@context": "https://schema.org",
  "@type": "BroadcastService",
  name: "ILLUVRSE LiveLoop",
  description,
  url: pageUrl,
  broadcaster: {
    "@type": "Organization",
    name: "ILLUVRSE"
  },
  inLanguage: "en",
  hasBroadcastChannel: {
    "@type": "BroadcastChannel",
    name: "LiveLoop"
  },
  broadcastOfEvent: {
    "@type": "BroadcastEvent",
    name: onAirItem?.title ?? "LiveLoop",
    isLiveBroadcast: true,
    startDate: nowIso,
    endDate: nextHourIso,
    workPresented: {
      "@type": "CreativeWork",
      name: onAirItem?.title ?? "LiveLoop"
    }
  }
};

export default async function LiveLoopPage() {
  const [stations, streams, videos, articles] = await Promise.all([
    prisma.station.findMany({
      where: { isPublic: true },
      orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
      take: 24,
      select: {
        id: true,
        name: true,
        slug: true,
        streamUrl: true,
        logoUrl: true,
        region: true,
        countryCode: true,
        genre: true,
        bitrate: true,
        codec: true,
        status: true
      }
    }),
    prisma.stream.findMany({
      where: { isPublic: true },
      orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        slug: true,
        embedUrl: true,
        posterImage: true,
        locationName: true,
        countryCode: true,
        status: true,
        attribution: true
      }
    }),
    prisma.video.findMany({
      where: { published: true },
      orderBy: [{ live: "desc" }, { publishedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        live: true,
        liveUrl: true,
        hlsUrl: true,
        mp4Url: true
      }
    }),
    prisma.article.findMany({
      where: {
        published: true,
        status: "published",
        publishedAt: { lte: new Date() }
      },
      orderBy: { publishedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        excerpt: true
      }
    })
  ]);

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(liveLoopJsonLd)}</script>
      <LiveLoopClient
        stations={stations}
        streams={streams}
        videos={videos}
        articles={articles}
      />
    </>
  );
}
