import { AvailabilityStatus } from "@illuvrse/db";
import prisma from "@news/lib/prisma";
import { LiveClient } from "./live-client";

export default async function LivePage() {
  const [streams, videos] = await Promise.all([
    prisma.stream.findMany({
      where: { isPublic: true },
      orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.video.findMany({
      where: { live: true, published: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const liveVideos = videos.flatMap((video) => {
    const embedUrl = video.liveUrl || video.hlsUrl || video.mp4Url;
    if (!embedUrl) return [];
    return [
      {
        id: `video-${video.id}`,
        name: video.title,
        slug: video.slug,
        embedUrl,
        posterImage: video.thumbnail,
        locationName: null,
        countryCode: video.countryCode,
        attribution: null,
        licenseNote: video.license,
        status: AvailabilityStatus.online,
        kind: "video" as const,
      },
    ];
  });

  const publicStreams = streams.map((stream) => ({
    id: `stream-${stream.id}`,
    name: stream.name,
    slug: stream.slug,
    embedUrl: stream.embedUrl,
    posterImage: stream.posterImage,
    locationName: stream.locationName,
    countryCode: stream.countryCode,
    attribution: stream.attribution,
    licenseNote: stream.licenseNote,
    status: stream.status,
    kind: "stream" as const,
  }));

  const normalized = [...publicStreams, ...liveVideos];

  return <LiveClient streams={normalized} />;
}
